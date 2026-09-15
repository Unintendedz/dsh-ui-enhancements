import { lstat, readdir, realpath, unlink } from 'node:fs/promises'
import { basename, dirname, join, relative, sep } from 'node:path'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

function sessionId(value) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError('sessionId must be a non-empty string')
  return value
}

const titleCaches = new WeakMap()
function titleCache(ctx) {
  let cache = titleCaches.get(ctx)
  if (!cache) { cache = { rows: new Map(), pending: new Map() }; titleCaches.set(ctx, cache) }
  return cache
}
const headerKey = header => JSON.stringify(header)
function archivedItem(ctx, id) {
  const live = ctx.sessions.get(id)
  const header = live?.header ?? ctx.workspaceRegistry.headers.get(id)
  const base = { sessionId: id, title: id, cwd: header?.cwd ?? '', createdAt: header?.createdAt ?? 0, available: !!header, titlePending: false }
  if (!header) return base
  // Match the host's listing contract: a cold seeded header does not prove the
  // inherited cut, so never hydrate its checkpoint using a guessed zero cut.
  const snapshot = live ? ctx.sessionProjections?.cachedSnapshot(live, ['title'])
    : header.isSeeded ? undefined : ctx.sessionProjectionCache?.cachedSnapshot(header, 0, ['title'])
      ?? ctx.sessionProjectionCache?.cachedPredecessorTitle?.(header, 0)
  const title = snapshot?.values.title
  if (typeof title === 'string' && title) return { ...base, title }
  const cached = titleCache(ctx).rows.get(id)
  if (cached?.key === headerKey(header) && Date.now() - cached.at < 60_000) return cached.item
  return { ...base, titlePending: true }
}

export async function listArchivedSessions(ctx) {
  const ids = [...ctx.workspaceRegistry.archivedSessionIds].reverse()
  const present = new Set(ids)
  for (const id of titleCache(ctx).rows.keys()) if (!present.has(id)) titleCache(ctx).rows.delete(id)
  // Header and projection indexes are already resident in DSH. Full logs are
  // read only by the bounded, deferred title RPC or an explicit text preview.
  return { items: ids.map(id => archivedItem(ctx, id)) }
}

export async function resolveArchivedTitles(ctx, ids) {
  if (!Array.isArray(ids) || ids.length > 8) throw new Error('resolve at most 8 archived titles at a time')
  const cache = titleCache(ctx)
  for (const id of ids) {
    sessionId(id)
    if (!ctx.workspaceRegistry.archivedSessionIds.includes(id)) throw new Error('session is not archived')
  }
  const items = await Promise.all([...new Set(ids)].map(id => {
    const item = archivedItem(ctx, id)
    if (!item.titlePending) return item
    if (cache.pending.has(id)) return cache.pending.get(id)
    const key = headerKey(ctx.sessions.get(id)?.header ?? ctx.workspaceRegistry.headers.get(id))
    const task = (async () => {
      const [result] = await ctx.sessionQuery.readTitleSnapshots([id])
      if (result.status !== 'fulfilled') return { ...item, available: false, titlePending: false }
      const resolved = { ...item, title: result.value.title?.title ?? id, cwd: result.value.session.cwd ?? '', createdAt: result.value.session.createdAt, titlePending: false }
      if (ctx.workspaceRegistry.archivedSessionIds.includes(id)) cache.rows.set(id, {key, item:resolved, at:Date.now()})
      return resolved
    })().finally(() => cache.pending.delete(id))
    cache.pending.set(id, task)
    return task
  }))
  const archived = new Set(ctx.workspaceRegistry.archivedSessionIds)
  return { items: items.filter(item => archived.has(item.sessionId)) }
}

export async function readArchivedSession(ctx, id) {
  sessionId(id)
  if (!ctx.workspaceRegistry.archivedSessionIds.includes(id)) throw new Error('session is not archived')
  const surface = await ctx.sessionQuery.readSurface(id)
  const messages = []
  for (const event of surface.events) {
    const message = event.type === 'user/message' ? event.data : event.type === 'assistant/message' ? event.data.message : undefined
    if (message === undefined) continue
    messages.push({ role: message.role, text: (message.content ?? []).filter(part => part.type === 'text').map(part => part.text).join('\n') })
  }
  return { sessionId: id, messages }
}

// DSH 0.1.5 exposes archive but no inverse. Use the registry's own serialized,
// durable state writer; never write its storage file behind its live cache.
export async function restoreArchivedSession(ctx, id) {
  sessionId(id)
  titleCache(ctx).rows.delete(id)
  const registry = ctx.workspaceRegistry
  return registry.enqueueOperation(async () => {
    const state = registry.requireState()
    const archivedSessionIds = state.archivedSessionIds.filter(value => value !== id)
    if (archivedSessionIds.length !== state.archivedSessionIds.length) await registry.setState({ ...state, archivedSessionIds })
    return { archivedSessionIds }
  })
}

const generationName = /^session(?:\.v[1-9][0-9]*)?\.jsonl(?:\.zstd)?$/

async function logFiles(persistence, id) {
  const current = await persistence.resolveCurrentLog(id) ?? (await persistence.findLog?.(id))?.sourcePath
  if (current === undefined || !generationName.test(basename(current))) throw new Error('session has no supported JSONL generation')
  const root = await realpath(persistence.config.root)
  const directory = dirname(current)
  const actual = await realpath(directory)
  const parts = relative(root, actual).split(sep)
  if (parts.length !== 2 || parts.some(part => part === '..' || part === '')
    || relative(root, actual) !== relative(persistence.config.root, directory)) {
    throw new Error('session directory is outside the configured storage root or is a symlink')
  }
  const names = (await readdir(directory)).filter(name => generationName.test(name))
  const files = []
  for (const name of names) {
    const path = join(directory, name)
    const info = await lstat(path)
    if (!info.isFile() || info.isSymbolicLink()) throw new Error('session generation must be a regular file')
    files.push(path)
  }
  // Remove historical generations first so a partially failed delete cannot
  // expose older history as the current log on a subsequent cold read.
  return files.filter(path => path !== current).concat(current)
}

export async function deleteSession(ctx, id, confirmed, handles) {
  sessionId(id)
  if (confirmed !== true) throw new Error('explicit deletion confirmation is required')
  const persistence = ctx.sessionPersistence
  if (persistence.name !== 'session-persistence-jsonl' || typeof persistence.resolveCurrentLog !== 'function') {
    throw new Error('immediate deletion requires the DSH 0.1.5 JSONL backend')
  }
  const agent = ctx.agents.get(id)
  const live = ctx.sessions.get(id)
  const handle = handles.get(id)
  if (live !== undefined && (handle?.agent !== agent || agent === undefined)) throw new Error('session lifecycle handle is unavailable; restart DSH before deleting this session')
  const snapshot = await persistence.stat(id)
  const header = live?.header ?? snapshot?.header
  if (header?.origin === 'subagent') throw new Error('delete the owning conversation instead of an active subagent')
  if (snapshot !== undefined) await logFiles(persistence, id)
  if (handle !== undefined && handle.agent === agent) await handle.dispose()
  if (ctx.sessions.get(id) !== undefined) throw new Error('session lifecycle did not finish')
  if (await persistence.stat(id) !== undefined) {
    const writer = await persistence.open(id, 'write')
    try {
      if (writer.header.id !== id) throw new Error('session storage identity mismatch')
      for (const path of await logFiles(persistence, id)) await unlink(path)
    } finally { await writer.close() }
  }
  const registry = ctx.workspaceRegistry
  for (const workspace of registry.list()) if (workspace.sessionIds.includes(id)) await workspace.detachSession(id)
  const result = await restoreArchivedSession(ctx, id)
  registry.headers.delete(id)
  registry.sessionPaths.delete(id)
  registry.invalidSessionPaths.delete(id)
  // The stock SQLite search backend has no public eviction method. Serialize
  // this narrow eviction with its searches and advance their cursor generation.
  const query = ctx.sessionQuery
  if (typeof query._serialized === 'function' && query.config.openAt !== 'never') {
    await query._serialized(undefined, async () => {
      await query._ensureReady()
      query._deleteSession('persisted', id)
      query._deleteSession('live', id)
      query._db.prepare('UPDATE search_state SET global_generation = global_generation + 1 WHERE singleton = 1').run()
      query._globalGeneration += 1
    })
  }
  ctx.emit('api-session/removed', id)
  return { ...result, sessionId: id, deleted: true }
}

export function trackSessionHandles(ctx, handles, deleting) {
  const registry = ctx.agents
  const originals = new Map()
  const wrappers = new Map()
  for (const method of ['create', 'resume']) {
    const original = registry[method]
    originals.set(method, original)
    const wrapper = async function (options) {
      const id = options.sessionId ?? options.resumeSessionId
      if (deleting.has(id)) throw new Error('session is being deleted')
      const handle = await original.call(this, options)
      handles.set(handle.agent.id, handle)
      if (deleting.has(handle.agent.id)) { await handle.dispose(); throw new Error('session is being deleted') }
      return handle
    }
    wrappers.set(method, wrapper)
    registry[method] = wrapper
  }
  const disposeListener = ctx.on('agent/disposed', ({ agent }) => {
    if (handles.get(agent.id)?.agent === agent) handles.delete(agent.id)
  }, { global: true })
  return () => {
    disposeListener()
    for (const [method, original] of originals) if (registry[method] === wrappers.get(method)) registry[method] = original
    handles.clear()
  }
}

export class SessionManagementGateway extends TypertRemoteService {
  constructor(ctx) {
    super(ctx, 'sessionManagement')
    this.handles = new Map()
    this.deleting = new Set()
    ctx.effect(() => trackSessionHandles(ctx, this.handles, this.deleting))
    for (const initialize of initializers) initialize.call(this)
  }
  listArchived() { return listArchivedSessions(this.ctx) }
  resolveArchivedTitles(ids) { return resolveArchivedTitles(this.ctx, ids) }
  readArchived(id) { return readArchivedSession(this.ctx, id) }
  restore(id) { return restoreArchivedSession(this.ctx, id) }
  async delete(id, confirmed) {
    sessionId(id)
    if (this.deleting.has(id)) throw new Error('session is already being deleted')
    this.deleting.add(id)
    try { return await deleteSession(this.ctx, id, confirmed, this.handles) }
    finally { this.deleting.delete(id) }
  }
}
const initializers = []
for (const method of ['listArchived', 'resolveArchivedTitles', 'readArchived', 'restore', 'delete']) Remote(method)(SessionManagementGateway.prototype[method], {
  kind: 'method', name: method, static: false, private: false,
  addInitializer(initializer) { initializers.push(initializer) },
})
