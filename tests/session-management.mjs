import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as host from '../lib/index.js'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-session-management-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const logs = join(root, 'home', 'sessions')
  const directory = join(logs, 'synthetic-workspace', 'target')
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'session.v3.jsonl'), 'synthetic current log')
  await writeFile(join(directory, 'session.v2.jsonl'), 'synthetic previous log')
  await writeFile(join(directory, '.writer.lock'), '')
  await writeFile(join(directory, 'keep.txt'), 'unrelated file')
  const state = { initialized: true, workspaceIds: ['workspace'], archivedSessionIds: ['target', 'other'] }
  const entries = ['target', 'other']
  const live = new Map()
  const events = []
  const ctx = {
    workspaceRegistry: {
      state,
      headers: new Map(), sessionPaths: new Map(), invalidSessionPaths: new Map(),
      get archivedSessionIds() { return this.state.archivedSessionIds },
      list: () => [{ sessionIds: entries, async detachSession(id) { entries.splice(entries.indexOf(id), 1) } }],
      requireState() { return this.state },
      async setState(value) { this.state = value },
      enqueueOperation(operation) { return operation() },
    },
    sessionQuery: {
      async readTitleSnapshots(ids) {
        return ids.map(sessionId => ({ sessionId, status: 'fulfilled', value: {
          session: { id: sessionId, cwd: '/synthetic-workspace', createdAt: 1 }, title: { title: sessionId === 'target' ? 'Archived title' : 'Other title' },
        } }))
      },
      async readSurface() { return { events: [
        { type: 'user/message', data: { role: 'user', content: [{ type: 'text', text: '<script>literal text</script>' }] } },
        { type: 'assistant/message', data: { message: { role: 'assistant', content: [{ type: 'text', text: 'Synthetic answer' }] } } },
      ] } },
    },
    sessions: { get: id => live.get(id)?.session },
    agents: { get: id => live.get(id) },
    sessionPersistence: {
      name: 'session-persistence-jsonl', config: { root: logs },
      async stat(id) { return id === 'target' && (await readdir(directory)).includes('session.v3.jsonl') ? { header: { id, cwd: '/synthetic-workspace' } } : undefined },
      async open(id, access) {
        assert.equal(id, 'target'); assert.equal(access, 'write')
        events.push('lock')
        return { id, header: { id }, async close() { events.push('unlock') } }
      },
      async resolveCurrentLog() { return join(directory, 'session.v3.jsonl') },
    },
    emit: (...args) => events.push(args),
  }
  return { root, directory, ctx, events, live, entries }
}

test('archive inventory uses only host archives, including cold titles', async t => {
  const { ctx } = await fixture(t)
  assert.equal(typeof host.listArchivedSessions, 'function')
  const result = await host.listArchivedSessions(ctx)
  assert.deepEqual(result.items.map(item => item.sessionId), ['other', 'target'])
  assert.equal(result.items[1].title, 'Archived title')
})

test('reading an archive leaves its archive state intact and returns message text', async t => {
  const { ctx } = await fixture(t)
  assert.equal(typeof host.readArchivedSession, 'function')
  const value = await host.readArchivedSession(ctx, 'target')
  assert.deepEqual(value.messages.map(message => message.text), ['<script>literal text</script>', 'Synthetic answer'])
  assert.deepEqual(ctx.workspaceRegistry.archivedSessionIds, ['target', 'other'])
  await assert.rejects(host.readArchivedSession(ctx, 'unarchived'), /not archived/)
})

test('restore removes only the selected archive through the registry queue', async t => {
  const { ctx, entries } = await fixture(t)
  assert.equal(typeof host.restoreArchivedSession, 'function')
  const result = await host.restoreArchivedSession(ctx, 'target')
  assert.deepEqual(result.archivedSessionIds, ['other'])
  assert.deepEqual(entries, ['target', 'other'])
  await host.restoreArchivedSession(ctx, 'target')
  assert.deepEqual(ctx.workspaceRegistry.archivedSessionIds, ['other'])
})

test('delete removes all log generations while locked and preserves unrelated files and sessions', async t => {
  const { ctx, directory, events, entries } = await fixture(t)
  assert.equal(typeof host.deleteSession, 'function')
  const result = await host.deleteSession(ctx, 'target', true, new Map())
  assert.equal(result.deleted, true)
  assert.deepEqual((await readdir(directory)).sort(), ['.writer.lock', 'keep.txt'])
  assert.deepEqual(entries, ['other'])
  assert.deepEqual(ctx.workspaceRegistry.archivedSessionIds, ['other'])
  assert.equal(events[0], 'lock')
  assert.ok(events.includes('unlock'))
  assert.deepEqual(events.at(-1), ['api-session/removed', 'target'])
})

test('delete requires explicit confirmation and rejects unsupported storage before stopping anything', async t => {
  const { ctx, directory } = await fixture(t)
  assert.equal(typeof host.deleteSession, 'function')
  await assert.rejects(host.deleteSession(ctx, 'target', false, new Map()), /confirmation/)
  ctx.sessionPersistence.name = 'unknown'
  await assert.rejects(host.deleteSession(ctx, 'target', true, new Map()), /JSONL/)
  assert.equal(await readFile(join(directory, 'session.v3.jsonl'), 'utf8'), 'synthetic current log')
})

test('delete refuses a mismatched resolved directory and never follows paths outside the storage root', async t => {
  const { ctx, root } = await fixture(t)
  assert.equal(typeof host.deleteSession, 'function')
  const outside = join(root, 'session.v3.jsonl')
  await writeFile(outside, 'keep outside')
  ctx.sessionPersistence.resolveCurrentLog = async () => outside
  await assert.rejects(host.deleteSession(ctx, 'target', true, new Map()), /storage root|directory/)
  assert.equal(await readFile(outside, 'utf8'), 'keep outside')
})

test('a live session is disposed by its captured native handle before taking the storage lock', async t => {
  const { ctx, live, events } = await fixture(t)
  assert.equal(typeof host.deleteSession, 'function')
  const agent = { id: 'target', status: 'running', session: { header: { id: 'target' } } }
  live.set('target', agent)
  const handles = new Map([['target', { agent, async dispose() { events.push('dispose'); live.delete('target') } }]])
  await host.deleteSession(ctx, 'target', true, handles)
  assert.deepEqual(events.slice(0, 2), ['dispose', 'lock'])
})

test('a live session without its lifecycle handle cannot be partially deleted', async t => {
  const { ctx, live, directory } = await fixture(t)
  assert.equal(typeof host.deleteSession, 'function')
  live.set('target', { id: 'target', session: { header: { id: 'target' } } })
  await assert.rejects(host.deleteSession(ctx, 'target', true, new Map()), /restart|lifecycle/)
  assert.ok((await readdir(directory)).includes('session.v3.jsonl'))
})

test('deleting an indexed session invalidates search pagination and evicts both index sources', async t => {
  const { ctx } = await fixture(t)
  const records = new Map([['persisted', new Set(['target', 'other'])], ['live', new Set(['target', 'other'])]])
  let generation = 7
  Object.assign(ctx.sessionQuery, {
    config: { openAt: 'first-search' }, _globalGeneration: 7,
    _serialized: async (_signal, operation) => operation(),
    async _ensureReady() {},
    _deleteSession(source, id) { records.get(source).delete(id) },
    _db: { prepare: () => ({ run() { generation++ } }) },
  })
  await host.deleteSession(ctx, 'target', true, new Map())
  assert.deepEqual([...records.values()].map(items => [...items]), [['other'], ['other']])
  assert.equal(generation, 8)
  assert.equal(ctx.sessionQuery._globalGeneration, 8, 'in-memory cursor generation must advance with the durable index')
})

test('delete accepts a cold historical generation before write-open migrates it', async t => {
  const { ctx, directory } = await fixture(t)
  let opened = false
  ctx.sessionPersistence.resolveCurrentLog = async () => opened ? join(directory, 'session.v3.jsonl') : undefined
  ctx.sessionPersistence.findLog = async () => ({ sourcePath: join(directory, 'session.v2.jsonl') })
  const original = ctx.sessionPersistence.open
  ctx.sessionPersistence.open = async (...args) => { opened = true; return original(...args) }
  await host.deleteSession(ctx, 'target', true, new Map())
  assert.deepEqual((await readdir(directory)).sort(), ['.writer.lock', 'keep.txt'])
})

test('native handle tracking preserves creation receivers and restores its wrappers on unload', async () => {
  const handles = new Map(), deleting = new Set()
  const handle = { agent: { id: 'captured' }, async dispose() {} }
  const registry = { marker: 'owner', async create() { assert.equal(this.marker, 'owner'); return handle }, async resume() { return handle } }
  const originals = [registry.create, registry.resume]
  const ctx = { agents: registry, on: () => () => {} }
  const cleanup = host.trackSessionHandles(ctx, handles, deleting)
  assert.equal(await registry.create({ sessionId: 'captured' }), handle)
  assert.equal(handles.get('captured'), handle)
  deleting.add('blocked')
  await assert.rejects(registry.resume({ resumeSessionId: 'blocked' }), /being deleted/)
  cleanup()
  assert.deepEqual([registry.create, registry.resume], originals)
})
