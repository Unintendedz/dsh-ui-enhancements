import { createWorkspaceSidebar } from './workspace-sidebar.js'
import { createWorkspaceChoice, VIRTUAL_WORKSPACE } from './workspace-choice.js'

const PREFIX = 'session-projectless-'
function string(value) {
  if (typeof value !== 'string' || !value) throw new TypeError('Expected a non-empty string')
  return value
}
// DSH 0.2.0 replaced the bare `schema` field with a memoized `create()` factory.
const codec = (name, parse) => {
  let cached
  return {
    mode: 'strict',
    typeSymbol: `dsh-ui-enhancements#${name}`,
    create: () => (cached ??= { parse }),
  }
}
export const PROJECTLESS_REMOTE = {
  package: 'dsh-ui-enhancements',
  descriptors: [
    ['info', [], codec('ProjectlessInfo', value => ({ root: string(value.root) }))],
    ['prepare', [{ name: 'requestId', wire: 'requestId', source: 'json', codec: codec('ProjectlessRequest', string) }], codec('ProjectlessLocation', value => ({ sessionId: string(value.sessionId), cwd: string(value.cwd) }))],
  ].map(([method, parameters, result]) => ({
    id: `dsh-ui-enhancements#projectlessConversations/${method}`,
    service: 'projectlessConversations', namespace: 'projectlessConversations', method,
    invocation: { kind: 'direct' }, parameters, result,
  })),
}

export function isProjectlessDirectory(cwd, root) {
  if (typeof cwd !== 'string') return false
  const normalized = cwd.replaceAll('\\', '/')
  const prefix = root.replaceAll('\\', '/').replace(/\/$/, '') + '/' + PREFIX
  return normalized.startsWith(prefix) && /^[0-9a-f-]{36}$/i.test(normalized.slice(prefix.length))
}

// The native Session Controller still creates, opens, sends, and persists the
// conversation. This adapter only supplies its managed cwd and reuses a blank
// draft. The retry identity survives a lost response without allocating again.
export function createProjectlessDrafts({ root, sessions, workspaces, prepare, storage, uuid = () => crypto.randomUUID() }) {
  const key = `dsh-ui-enhancements.projectless-draft:${root}`
  let remembered
  try { remembered = storage?.getItem(key) } catch {}
  let inflight
  let retryId
  return {
    connect() {
      if (inflight) return inflight
      const summary = sessions.list.getSnapshot().byId[remembered]
      const workspace = workspaces.list.getSnapshot()
      if (summary?.blank && isProjectlessDirectory(summary.cwd, root)
        && !workspace.archivedSessionIds.includes(remembered)
        // The virtual workspace is this plugin's own bookkeeping, so it must not
        // count as "the draft has been attached to a workspace": otherwise every
        // New Session allocated another blank directory instead of reusing one.
        && !workspace.items.some(item => item.workspaceId !== VIRTUAL_WORKSPACE && item.sessionIds.includes(remembered))) return Promise.resolve(remembered)
      retryId ??= uuid()
      inflight = (async () => {
        const location = await prepare(retryId)
        const id = await sessions.create(location)
        remembered = id
        retryId = undefined
        try { storage?.setItem(key, id) } catch {}
        return id
      })().finally(() => { inflight = undefined })
      return inflight
    },
  }
}

// The native tree view nests a Workspace under the nearest registered Workspace
// whose directory contains it. That test is `path.startsWith(parent + '/')`, so a
// browser-side entry with an empty path — which is a prefix of every absolute
// path — collected the whole sidebar as its children. Point the entry at the
// managed root: it is a real directory that contains only this plugin's own
// conversation folders, so nothing else can ever nest under it.
export function virtualWorkspaceRecord(root, label, sessionIds = []) {
  return {
    workspaceId: VIRTUAL_WORKSPACE,
    title: label,
    path: root,
    sessionIds,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  }
}

// DSH 0.2.0 gates the blank composer on the *selected workspace*, so a session
// that belongs to no workspace stays stuck behind "Choose a workspace to start"
// even when it is selected. Present the managed conversation to the native
// client-side workspace model as a virtual workspace. The Host registry is never
// touched, so no workspace is registered: the entry exists only in this browser.
function installVirtualWorkspace(ctx, root, label, selectionStore) {
  const model = ctx.workspaces?.model
  if (!model) return () => {}
  const membership = () => {
    try {
      // Every managed conversation has to be claimed, not just the selected one:
      // unclaimed ones fall back to the native ungrouped group, which renders
      // under the same "No workspace" label and produced a duplicate group.
      const byId = ctx.sessions?.list?.getSnapshot?.()?.byId ?? {}
      return Object.keys(byId).filter(id => isProjectlessDirectory(byId[id]?.cwd, root))
    } catch { return [] }
  }
  const sameMembers = (left, right) => left.length === right.length
    && left.every((value, index) => value === right[index])
  const apply = () => {
    const sessionIds = membership()
    try {
      // `upsert` mutates the very store we subscribe to, so it must be a no-op
      // unless the entry is missing or its membership actually changed.
      const items = model.getSnapshot?.()?.items ?? []
      const existing = items.find(item => item.workspaceId === VIRTUAL_WORKSPACE)
      if (existing && sameMembers(existing.sessionIds ?? [], sessionIds) && existing.path === root) return
      const record = virtualWorkspaceRecord(root, label, sessionIds)
      if (typeof model.upsert === 'function') model.upsert(record)
      else if (typeof model.upsertView === 'function') model.upsertView(record)
    } catch (error) {
      if (!installVirtualWorkspace.reported) {
        installVirtualWorkspace.reported = true
        console.log('[dsh-ui-enhancements] virtual workspace upsert failed: ' + String(error?.message ?? error).slice(0, 120))
      }
    }
  }
  const stops = []
  for (const store of [selectionStore, ctx.sessions?.list]) {
    if (typeof store?.subscribe !== 'function') continue
    try { stops.push(store.subscribe(apply)) } catch {}
  }
  apply()
  return () => {
    for (const stop of stops) { try { stop?.() } catch {} }
    try { model.remove?.(VIRTUAL_WORKSPACE) } catch {}
  }
}

// DSH 0.1.5's occupied conversation slot owns its child declarations, so a
// replacement registration would orphan the native composer. Decorate that
// entry in place, retaining its store, injection, and child ownership. An inert
// lower-ranked registration publishes the change and restores it on unload.
function decorateNativeSlot(ctx, key, decorate) {
  return ctx.slots.inject(key, () => {
    const entry = ctx.slots.entries(key).find(item => item.options.registrant?.startsWith('@deepseek-ai/'))
      ?? ctx.slots.entries(key)[0]
    if (!entry || typeof entry.component !== 'function') throw new Error(`Unsupported DSH slot: ${key}`)
    const original = entry.component
    const decorated = decorate(original)
    entry.component = decorated
    let dispose
    try { dispose = ctx.slots.register({ name: key, priority: Number.MAX_SAFE_INTEGER, id: `dsh-ui-enhancements#refresh-${key}` }, () => null) }
    catch (error) { entry.component = original; throw error }
    return () => { if (entry.component === decorated) entry.component = original; dispose() }
  })
}

export function registerProjectless(ctx, root, prepare, t) {
  const { createElement: h, Fragment, useEffect, useState, useMemo, useCallback } = require('react')
  const navigation = ctx.uiWorkspace
  const choices = createWorkspaceChoice(require('react'), t)
  const drafts = createProjectlessDrafts({ root, prepare, sessions: ctx.sessions, workspaces: ctx.workspaces, storage: window.sessionStorage })
  const connect = navigation.connectWorkspace
  const start = navigation.startSession
  const connectWrapper = function (id) { return id === VIRTUAL_WORKSPACE ? drafts.connect() : connect.call(this, id) }
  const startWrapper = function (id) {
    if (id !== undefined) return start.call(this, id)
    // DSH 0.2.0 removed `navigation.sessions.clear()`. Calling it threw inside the
    // click handler, which is why New Session and its shortcut did nothing at all.
    // Start the managed workspace-less conversation instead.
    try { this.ctx?.layout?.beginNavigation?.() } catch {}
    try { this.ctx?.layout?.selectPanel?.(null) } catch {}
    return Promise.resolve(drafts.connect())
      .then(async (sessionId) => {
        if (sessionId !== undefined && typeof navigation.openSession === 'function') {
          await navigation.openSession(sessionId)
        }
        return sessionId
      })
      .catch(() => start.call(navigation))
  }
  navigation.connectWorkspace = connectWrapper
  navigation.startSession = startWrapper
  const cleanups = [() => {
    if (navigation.connectWorkspace === connectWrapper) navigation.connectWorkspace = connect
    if (navigation.startSession === startWrapper) navigation.startSession = start
  }]
  try {
    // DSH 0.2.0 mounts the hero without the decorated conversation entry, so the
    // workspace-less conversation is published to the native workspace model
    // instead of being injected through the conversation's slot props.
    const selectionStore = navigation.selection
    cleanups.push(installVirtualWorkspace(ctx, root, t('projectless.label'), selectionStore))
    cleanups.push(decorateNativeSlot(ctx, 'main.conversation', Native => function ProjectlessConversation(props) {
      const { sessionId } = props
      const phase = props.useSessions(s => s.phase)
      const cwd = props.useSessions(s => s.byId[sessionId]?.cwd)
      const noWorkspaceLabel = t('projectless.label')
      const [error, setError] = useState('')
      const [retry, setRetry] = useState(0)
      const selectWorkspace = async id => {
        setError('')
        try { return await props.selectWorkspace(id) }
        catch (reason) { setError(String(reason.message ?? reason)); throw reason }
      }
      useEffect(() => {
        if (sessionId !== undefined || phase !== 'ready') return
        let alive = true
        setError('')
        navigation.openWorkspace(VIRTUAL_WORKSPACE).catch(reason => { if (alive) setError(String(reason.message ?? reason)) })
        return () => { alive = false }
      }, [sessionId, phase, retry])
      const useWorkspaceChoices = useCallback(function useWorkspaceChoices(selector) {
        const snapshot = props.useWorkspaces(s => s)
        const value = useMemo(() => ({ ...snapshot, items: [{
          workspaceId: VIRTUAL_WORKSPACE, title: noWorkspaceLabel, path: '',
          sessionIds: isProjectlessDirectory(cwd, root) && !snapshot.items.some(item => item.sessionIds.includes(sessionId)) ? [sessionId] : [],
        }, ...snapshot.items] }), [snapshot, sessionId, cwd, noWorkspaceLabel])
        return selector(value)
      }, [props.useWorkspaces, sessionId, cwd, noWorkspaceLabel])
      let choiceOwner
      const renderSlot = (key, owner, options) => {
        if (key !== 'conversation.hero.workspace') return props.renderSlot(key, owner, options)
        choiceOwner = owner
        return h(Fragment, null,
          props.renderSlot(key, { ...owner, useWorkspaces: useWorkspaceChoices }, options),
          error && h('span', { className: 'dsh-projectless-error', role: 'alert' },
            t('projectless.failed'), ' ', error, ' ', h('button', { type: 'button', onClick: () => {
              if (sessionId === undefined) setRetry(n => n + 1)
              else void selectWorkspace(VIRTUAL_WORKSPACE).catch(() => {})
            } }, t('manager.retry'))))
      }
      const renderSlotChain = (key, owner, options) => {
        return props.renderSlotChain(key, owner,
          key === 'conversation.composer' && options?.fallback
            ? { ...options, fallback: choices.composer(options.fallback, choiceOwner) } : options)
      }
      return h(Native, { ...props, useWorkspaces: useWorkspaceChoices, renderSlot, renderSlotChain, selectWorkspace })
    }))
    cleanups.push(decorateNativeSlot(ctx, 'conversation.hero.workspace', choices.picker))
    cleanups.push(decorateNativeSlot(ctx, 'sidebar.workspaces', Native => createWorkspaceSidebar(require('react'), Native, t)))
    cleanups.push(decorateNativeSlot(ctx, 'conversation.session', Native => function CarriedDraft(props) {
      const draft = props.useInput(s => s.draft)
      const saved = props.useStore(s => s.draft)
      // Native workspace navigation fills the destination before its mirror
      // mounts. Publish that carried text to the native store once it mounts;
      // ordinary typing/submission continues to use the native mirror.
      useEffect(() => { if (draft && draft !== saved) props.actions.setDraft(draft) }, [draft, saved, props.actions])
      return h(Native, props)
    }))
    return () => { for (const dispose of cleanups.reverse()) dispose() }
  } catch (error) { for (const dispose of cleanups.reverse()) dispose(); throw error }
}
