import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readdir, readFile, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as host from '../lib/index.js'
import * as client from '../src/client.js'

const one = '9c8a7d63-86fd-40da-a2c4-e41288a39850'
const two = '77777777-86fd-40da-a2c4-e41288a39850'
async function fixture(t) {
  const home = await mkdtemp(join(tmpdir(), 'dsh-projectless-unit-'))
  t.after(() => rm(home, { recursive: true, force: true }))
  assert.equal(typeof host.createProjectlessStorage, 'function', 'managed conversation storage is missing')
  const root = join(home, 'projectless')
  return { home, root, storage: host.createProjectlessStorage(root) }
}

test('projectless allocation creates separate private directories and retries preserve files', async t => {
  const { root, storage } = await fixture(t)
  const a = await storage.prepare(one)
  const b = await storage.prepare(two)
  assert.notEqual(a.cwd, b.cwd)
  assert.equal(a.cwd, join((await storage.info()).root, a.sessionId))
  await writeFile(join(a.cwd, 'output.txt'), 'keep my output')
  assert.deepEqual(await storage.prepare(one), a)
  assert.equal(await readFile(join(a.cwd, 'output.txt'), 'utf8'), 'keep my output')
  assert.deepEqual((await readdir(root)).sort(), [a.sessionId, b.sessionId].sort())
})

test('invalid allocation IDs cannot create files outside managed storage', async t => {
  const { home, storage } = await fixture(t)
  for (const id of ['', '../escape', '/absolute', one + '/child', null]) {
    await assert.rejects(() => storage.prepare(id), /UUID/)
  }
  assert.deepEqual(await readdir(home), [])
})

test('allocation refuses a symlink root or session directory without touching its target', async t => {
  const { home, root, storage } = await fixture(t)
  const outside = join(home, 'outside')
  await mkdir(outside)
  await symlink(outside, root)
  await assert.rejects(() => storage.prepare(one), /directory|symlink/)
  await rm(root)
  const a = await storage.prepare(one)
  await rm(a.cwd, { recursive: true })
  await symlink(outside, a.cwd)
  await assert.rejects(() => storage.prepare(one), /directory|symlink/)
  assert.deepEqual(await readdir(outside), [])
})

function clientFixture() {
  assert.equal(typeof client.createProjectlessDrafts, 'function', 'native draft adapter is missing')
  const byId = {}
  const calls = []
  const remembered = new Map()
  const saved = { getItem: k => remembered.get(k), setItem: (k, v) => remembered.set(k, v) }
  const workspaces = { items: [], archivedSessionIds: [] }
  const sessions = {
    list: { getSnapshot: () => ({ byId }) },
    async create(data) { calls.push(data); byId[data.sessionId] = { id: data.sessionId, cwd: data.cwd, blank: true }; return data.sessionId },
  }
  let next = 0
  let allocations = 0
  const options = {
    root: '/synthetic/projectless', sessions, storage: saved,
    workspaces: { list: { getSnapshot: () => workspaces } },
    uuid: () => [one, two][next++],
    async prepare(id) { allocations++; return { sessionId: 'session-projectless-' + id, cwd: '/synthetic/projectless/session-projectless-' + id } },
  }
  return { options, calls, byId, workspaces, allocationCount: () => allocations }
}

test('concurrent starts and page reloads reuse the empty draft; a sent conversation gets a new directory', async () => {
  const f = clientFixture()
  const drafts = client.createProjectlessDrafts(f.options)
  const [a, b] = await Promise.all([drafts.connect(), drafts.connect()])
  assert.equal(a, b)
  assert.equal(f.calls.length, 1)
  assert.equal(await client.createProjectlessDrafts(f.options).connect(), a)
  f.byId[a].blank = false
  const c = await drafts.connect()
  assert.notEqual(c, a)
  assert.equal(f.calls.length, 2)
  assert.equal(f.allocationCount(), 2)
})

test('archived or moved drafts are never reused as no-workspace conversations', async () => {
  for (const moved of [false, true]) {
    const f = clientFixture()
    const drafts = client.createProjectlessDrafts(f.options)
    const a = await drafts.connect()
    if (moved) f.workspaces.items.push({ sessionIds: [a] })
    else f.workspaces.archivedSessionIds.push(a)
    assert.notEqual(await drafts.connect(), a)
  }
})

test('native creation failures retry the same allocated identity without discarding files', async () => {
  const f = clientFixture()
  const create = f.options.sessions.create
  let fail = true
  f.options.sessions.create = async data => {
    if (fail) { fail = false; throw new Error('connection interrupted') }
    return create(data)
  }
  const drafts = client.createProjectlessDrafts(f.options)
  await assert.rejects(() => drafts.connect(), /interrupted/)
  assert.equal(await drafts.connect(), 'session-projectless-' + one)
  assert.equal(f.allocationCount(), 2)
})
