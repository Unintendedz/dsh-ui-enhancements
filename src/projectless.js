import { createWorkspaceSidebar } from './workspace-sidebar.js'
import { createWorkspaceChoice, VIRTUAL_WORKSPACE } from './workspace-choice.js'

const PREFIX = 'session-projectless-'
function string(value) {
  if (typeof value !== 'string' || !value) throw new TypeError('Expected a non-empty string')
  return value
}
const codec = (name, parse) => ({ mode: 'strict', typeSymbol: `dsh-ui-enhancements#${name}`, schema: { parse } })
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
        && !workspace.items.some(item => item.sessionIds.includes(remembered))) return Promise.resolve(remembered)
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
    try { dispose = ctx.slots.register({ name: key, priority: Number.MAX_SAFE_INTEGER }, () => null) }
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
    this.ctx.layout.beginNavigation()
    this.sessions.clear()
    this.ctx.layout.selectPanel(null)
  }
  navigation.connectWorkspace = connectWrapper
  navigation.startSession = startWrapper
  const cleanups = [() => {
    if (navigation.connectWorkspace === connectWrapper) navigation.connectWorkspace = connect
    if (navigation.startSession === startWrapper) navigation.startSession = start
  }]
  try {
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
      const renderSlotChain = (key, owner, options) => props.renderSlotChain(key, owner,
        key === 'conversation.composer' && options?.fallback
          ? { ...options, fallback: choices.composer(options.fallback, choiceOwner) } : options)
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
