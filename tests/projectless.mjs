import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readdir, readFile, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as host from '../lib/index.js'
import * as client from '../src/client.js'
import { registerProjectless } from '../src/projectless.js'

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

test('the virtual workspace never claims real workspaces as tree children', () => {
  assert.equal(typeof client.virtualWorkspaceRecord, 'function', 'the virtual workspace record builder is missing')
  const root = '/home/me/.dsh/projectless'
  const record = client.virtualWorkspaceRecord(root, 'No workspace', ['session-projectless-' + one])
  assert.equal(record.path, root, 'the entry must carry the managed root, not an empty path')
  // The native tree nests a workspace under the nearest entry whose directory
  // contains it: `path.startsWith(parent + "/")`. An empty path passes that test
  // for every absolute path, which is how the whole sidebar became one group.
  const owns = (parent, path) => path.startsWith(parent + '/')
  assert.equal(owns(record.path, '/Users/x/projects/turnitin'), false)
  assert.equal(owns(record.path, '/Users/x/projects/security/turnitin'), false)
  assert.equal(owns(record.path, record.path + '/session-projectless-' + one), true, 'it still owns the managed conversations')
  assert.deepEqual(record.sessionIds, ['session-projectless-' + one])
})

function registrationFixture() {
  const created = []
  const forwarded = []
  const byId = {}
  const root = '/synthetic/projectless'
  const react = {
    createElement() {}, Fragment: 'Fragment',
    useEffect() {}, useState() {}, useMemo() {}, useCallback() {},
  }
  const previous = { require: globalThis.require, window: globalThis.window }
  const navigation = {
    connectWorkspace(id) { forwarded.push(id) },
    startSession(id) { forwarded.push(id) },
    async openSession() {},
  }
  const ctx = {
    uiWorkspace: navigation,
    sessions: {
      list: { getSnapshot: () => ({ byId }) },
      async create(data) {
        created.push(data)
        byId[data.sessionId] = { cwd: data.cwd, blank: true }
        return data.sessionId
      },
    },
    workspaces: { list: { getSnapshot: () => ({ items: [], archivedSessionIds: [] }) } },
    slots: {
      inject(key, setup) { return setup() },
      entries() { return [{ options: {}, component: () => null }] },
      register() { return () => {} },
    },
  }
  globalThis.require = () => react
  globalThis.window = { sessionStorage: { getItem: () => null, setItem() {} } }
  const prepare = async id => ({ sessionId: 'session-projectless-' + id, cwd: root + '/session-projectless-' + id })
  return {
    ctx, navigation, created, forwarded, root, prepare,
    restore() {
      globalThis.require = previous.require
      globalThis.window = previous.window
    },
  }
}

test('the No workspace group create button starts a managed conversation instead of forwarding its virtual id', async () => {
  const f = registrationFixture()
  const original = f.navigation.startSession
  const dispose = registerProjectless(f.ctx, f.root, f.prepare, key => key)
  try {
    // Native group rows call `startSession(group.workspaceId)`. The No workspace
    // group's id is the client-only virtual workspace, and the Host registry has
    // no entry for it, so forwarding it failed with `workspace/not-found`.
    const virtual = client.virtualWorkspaceRecord(f.root, 'No workspace').workspaceId
    const started = await f.navigation.startSession(virtual)
    assert.match(String(started), /^session-projectless-[0-9a-f-]{36}$/, 'the create button opens a managed conversation')
    assert.deepEqual(f.forwarded, [], 'the virtual id never reaches the Host')
    assert.equal(f.created.length, 1)
    assert.equal(f.created[0].cwd, f.root + '/session-projectless-' + String(started).slice('session-projectless-'.length))

    // Real workspaces still go straight to the Host.
    await f.navigation.startSession('workspace-1')
    assert.deepEqual(f.forwarded, ['workspace-1'])
  } finally {
    dispose()
    f.restore()
  }
  assert.equal(f.navigation.startSession, original, 'unloading restores the native navigation')
})
