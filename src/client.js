import { createSessionManager, SESSION_MANAGEMENT_REMOTE, registerArchiveEntry } from './session-manager.js'
export { createSessionManager } from './session-manager.js'

const NS = 'dsh-ui-enhancements'
const PINNED_STORAGE_KEY = 'dsh-ui-enhancements.pinned-session-ids.v1'
const FLAT_SESSION_ORDER_KEY = '__flat_session_order__'
const STYLE_ID = 'dsh-ui-enhancements-style'

const zh = {
  'pin.aria': '置顶会话“{title}”',
  'unpin.aria': '取消置顶会话“{title}”',
  'archive.aria': '归档会话“{title}”',
  'archive.failed': '归档失败',
  'archives.title': '已归档',
  'archives.description': '归档会保留对话。你可以查看内容、恢复，或立即删除。',
  'archives.search': '搜索归档标题或工作区',
  'archives.empty': '没有已归档的对话',
  'archives.noMatches': '没有匹配的归档对话',
  'archives.view': '查看',
  'archives.restore': '恢复并打开',
  'archives.preview': '文本预览；恢复后可在对话中查看完整内容。',
  'archives.user': '你',
  'archives.assistant': '助手',
  'archives.loading': '正在加载…',
  'archives.refresh': '刷新',
  'manager.close': '关闭',
  'manager.cancel': '取消',
  'manager.retry': '重试',
  'manager.failed': '操作失败，请重试：',
  'delete.aria': '立即删除会话“{title}”',
  'delete.action': '立即删除',
  'delete.title': '立即删除“{title}”？',
  'delete.description': '将停止这个对话并永久删除它的对话记录，无法恢复。工作区文件和其他分支会保留。',
  'delete.pending': '正在删除…',
  'delete.success': '对话已删除',
  'plugin.enable': '启用插件“{name}”',
  'plugin.disable': '停用插件“{name}”',
  'plugin.locked': '插件管理器“{name}”始终启用',
  'plugin.refreshRequired': '设置已保存。浏览器插件需要刷新后生效；请先保存未发送的内容。',
  'plugin.refresh': '我已保存内容，刷新页面',
  'plugin.failed': '插件“{name}”开关失败，请重试',
}

const en = {
  'pin.aria': 'Pin session “{title}”',
  'unpin.aria': 'Unpin session “{title}”',
  'archive.aria': 'Archive session “{title}”',
  'archive.failed': 'Archive failed',
  'archives.title': 'Archived',
  'archives.description': 'Archived conversations are kept. View, restore, or delete them here.',
  'archives.search': 'Search archived titles or workspaces',
  'archives.empty': 'No archived conversations',
  'archives.noMatches': 'No matching archived conversations',
  'archives.view': 'View',
  'archives.restore': 'Restore and open',
  'archives.preview': 'Text preview. Restore the conversation to view its full content.',
  'archives.user': 'You',
  'archives.assistant': 'Assistant',
  'archives.loading': 'Loading…',
  'archives.refresh': 'Refresh',
  'manager.close': 'Close',
  'manager.cancel': 'Cancel',
  'manager.retry': 'Retry',
  'manager.failed': 'Could not complete the action. Try again: ',
  'delete.aria': 'Delete session “{title}” now',
  'delete.action': 'Delete now',
  'delete.title': 'Delete “{title}” now?',
  'delete.description': 'This stops the conversation and permanently deletes its conversation log. This cannot be undone. Workspace files and other branches are kept.',
  'delete.pending': 'Deleting…',
  'delete.success': 'Conversation deleted',
  'plugin.enable': 'Enable plugin “{name}”',
  'plugin.disable': 'Disable plugin “{name}”',
  'plugin.locked': 'Plugin manager “{name}” is always enabled',
  'plugin.refreshRequired': 'Settings saved. Refresh to apply browser plugins; save any unsent work first.',
  'plugin.refresh': 'I have saved my work — refresh',
  'plugin.failed': 'Could not change plugin “{name}”; try again',
}

export const inject = ['locale', 'remote', 'slots', 'sessions', 'workspaces']

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`)
  }
  return value
}

function booleanValue(value, field) {
  if (typeof value !== 'boolean') throw new TypeError(`${field} must be a boolean`)
  return value
}

const entryIdSchema = {
  parse: value => nonEmptyString(value, 'entryId'),
}

const enabledSchema = {
  parse: value => booleanValue(value, 'enabled'),
}

const pluginToggleSnapshotSchema = {
  parse(value) {
    if (value === null || typeof value !== 'object' || !Array.isArray(value.entries)) {
      throw new TypeError('entries must be an array')
    }
    return {
      entries: value.entries.map((entry, index) => {
        if (entry === null || typeof entry !== 'object') {
          throw new TypeError(`entries[${index}] must be an object`)
        }
        return {
          entryId: nonEmptyString(entry.entryId, `entries[${index}].entryId`),
          moduleName: nonEmptyString(entry.moduleName, `entries[${index}].moduleName`),
          version: nonEmptyString(entry.version, `entries[${index}].version`),
          enabled: enabledSchema.parse(entry.enabled),
          locked: booleanValue(entry.locked, `entries[${index}].locked`),
        }
      }),
    }
  },
}

const pluginToggleResultSchema = {
  parse(value) {
    if (value === null || typeof value !== 'object') {
      throw new TypeError('toggle result must be an object')
    }
    return {
      entryId: entryIdSchema.parse(value.entryId),
      enabled: enabledSchema.parse(value.enabled),
    }
  },
}

function strictCodec(typeSymbol, schema) {
  return { mode: 'strict', typeSymbol, schema }
}

const PROFILE_PLUGIN_REMOTE = {
  package: 'dsh-ui-enhancements',
  descriptors: [
    {
      id: 'dsh-ui-enhancements#profilePluginToggles/list',
      service: 'profilePluginToggles',
      namespace: 'profilePluginToggles',
      method: 'list',
      invocation: { kind: 'direct' },
      parameters: [],
      result: strictCodec(
        'dsh-ui-enhancements#ProfilePluginToggleSnapshot',
        pluginToggleSnapshotSchema,
      ),
    },
    {
      id: 'dsh-ui-enhancements#profilePluginToggles/setEnabled',
      service: 'profilePluginToggles',
      namespace: 'profilePluginToggles',
      method: 'setEnabled',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'entryId',
          wire: 'entryId',
          source: 'json',
          codec: strictCodec('dsh-ui-enhancements#ProfilePluginEntryId', entryIdSchema),
        },
        {
          name: 'enabled',
          wire: 'enabled',
          source: 'json',
          codec: strictCodec('dsh-ui-enhancements#ProfilePluginEnabled', enabledSchema),
        },
      ],
      result: strictCodec(
        'dsh-ui-enhancements#ProfilePluginToggleResult',
        pluginToggleResultSchema,
      ),
    },
  ],
}

export function pinnedSessionOrder(sessionIds, pinnedIds) {
  const sessions = new Set(sessionIds)
  const pinned = pinnedIds.filter((id, index) => sessions.has(id) && pinnedIds.indexOf(id) === index)
  const pinnedSet = new Set(pinned)
  return [...pinned, ...sessionIds.filter(id => !pinnedSet.has(id))]
}

export function syncPinnedSessionOrder(context, pinnedIds) {
  if (typeof context?.setSessionOrder !== 'function' || typeof context?.accountKey !== 'string') return false
  const current = context.sessionOrderByAccount?.[context.accountKey]
  if (!Array.isArray(current)) return false
  const next = pinnedSessionOrder(current, pinnedIds)
  if (next.length === current.length && next.every((id, index) => id === current[index])) return false
  context.setSessionOrder(context.accountKey, next)
  return true
}

export function readPinnedSessionIds(storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(PINNED_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id, index) => (
      typeof id === 'string' && id.trim() !== '' && parsed.indexOf(id) === index
    ))
  } catch {
    return []
  }
}

export function writePinnedSessionIds(storage, pinnedIds) {
  try {
    storage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedIds))
    return true
  } catch {
    return false
  }
}

export function sessionContextFromElement(element) {
  const key = Object.getOwnPropertyNames(element).find(name => name.startsWith('__reactFiber$'))
  let fiber = key === undefined ? undefined : element[key]
  let sessionId
  let title
  let archiveSession
  let sessionOrderByAccount
  let setSessionOrder
  let workspaces
  for (let depth = 0; fiber !== undefined && fiber !== null && depth < 64; depth += 1) {
    const props = fiber.memoizedProps
    const candidateId = props?.node?.id
    if (sessionId === undefined && typeof candidateId === 'string' && candidateId.trim() !== '') {
      sessionId = candidateId
      title = props.node.title
    }
    if (archiveSession === undefined && typeof props?.archiveSession === 'function') {
      archiveSession = props.archiveSession
    }
    if (setSessionOrder === undefined
      && typeof props?.setSessionOrder === 'function'
      && typeof props?.sessionOrderByAccount === 'object') {
      sessionOrderByAccount = props.sessionOrderByAccount
      setSessionOrder = props.setSessionOrder
      workspaces = props.workspaces
    }
    fiber = fiber.return
  }
  if (sessionId === undefined) return undefined
  const workspace = Array.isArray(workspaces)
    ? workspaces.find(item => item?.sessionIds?.includes(sessionId))
    : undefined
  return {
    sessionId,
    title: typeof title === 'string' ? title : sessionId,
    archiveSession,
    sessionOrderByAccount,
    setSessionOrder,
    workspaces,
    accountKey: Array.isArray(workspaces) ? (workspace?.workspaceId ?? '') : FLAT_SESSION_ORDER_KEY,
  }
}

function svgElement(documentApi, name, attributes) {
  const element = documentApi.createElementNS('http://www.w3.org/2000/svg', name)
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value)
  return element
}

function quickActionIcon(documentApi, kind, active = false) {
  const svg = svgElement(documentApi, 'svg', {
    width: '16', height: '16', viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
  })
  if (kind === 'pin') {
    svg.appendChild(svgElement(documentApi, 'path', {
      d: 'M5.2 2.5h5.6l-.9 3.2 1.8 1.8v1H8.8V13L8 14l-.8-1V8.5H4.3v-1l1.8-1.8-.9-3.2Z',
      fill: active ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': '1.3',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    }))
    return svg
  }
  svg.appendChild(svgElement(documentApi, 'path', {
    d: kind === 'delete' ? 'M3 4h10M6 4V2.5h4V4M4 4l.6 9h6.8l.6-9M6.5 6.5v4M9.5 6.5v4' : 'M2.5 4.5h11M3.5 4.5l.8-2h7.4l.8 2v7.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V4.5ZM6 7.5h4',
    stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  }))
  return svg
}

export function mountSessionQuickActions(row, context, pinnedIds, t, onTogglePin, onRequestDelete) {
  if (typeof context?.archiveSession !== 'function') return false
  const nativeButton = row.querySelector('button')
  if (nativeButton === null) return false
  let actionHost = nativeButton.parentElement
  while (actionHost !== null && actionHost.parentElement !== row) actionHost = actionHost.parentElement
  if (actionHost === null) return false

  const documentApi = row.ownerDocument ?? document
  const pinned = pinnedIds.includes(context.sessionId)
  row.classList.add('dsh-ui-enhancements-row')
  actionHost.classList.add('dsh-ui-enhancements-row-actions-host')
  actionHost.previousElementSibling?.classList.add('dsh-ui-enhancements-row-time')

  const existing = actionHost.querySelector('[data-dsh-ui-enhancements-actions]')
  if (existing !== null) {
    if (existing.currentContext.sessionId !== context.sessionId) existing.children[1].disabled = false
    existing.currentContext = context
    existing.onRequestDelete = onRequestDelete
    existing.onTogglePin = onTogglePin
    const pin = existing.children[0]
    const archive = existing.children[1]
    const pinChanged = pin.getAttribute('aria-pressed') !== String(pinned)
    pin.setAttribute('aria-pressed', String(pinned))
    const pinLabel = t(pinned ? 'unpin.aria' : 'pin.aria', { title: context.title })
    pin.setAttribute('aria-label', pinLabel)
    pin.setAttribute('title', pinLabel)
    if (pinChanged) pin.replaceChildren(quickActionIcon(documentApi, 'pin', pinned))
    const archiveLabel = t('archive.aria', { title: context.title })
    archive.setAttribute('aria-label', archiveLabel)
    archive.setAttribute('title', archiveLabel)
    if (existing.children[2]) {
      const label = t('delete.aria', { title: context.title })
      existing.children[2].setAttribute('aria-label', label)
      existing.children[2].setAttribute('title', label)
    }
    return true
  }

  const actions = documentApi.createElement('span')
  actions.classList.add('dsh-ui-enhancements-row-actions')
  actions.setAttribute('data-dsh-ui-enhancements-actions', context.sessionId)
  actions.currentContext = context
  actions.onRequestDelete = onRequestDelete
  actions.onTogglePin = onTogglePin

  const pin = documentApi.createElement('button')
  pin.setAttribute('type', 'button')
  pin.classList.add('dsh-ui-enhancements-row-action')
  pin.setAttribute('data-dsh-ui-enhancements-action', 'pin')
  pin.setAttribute('aria-pressed', String(pinned))
  const pinLabel = t(pinned ? 'unpin.aria' : 'pin.aria', { title: context.title })
  pin.setAttribute('aria-label', pinLabel)
  pin.setAttribute('title', pinLabel)
  pin.appendChild(quickActionIcon(documentApi, 'pin', pinned))
  pin.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    actions.onTogglePin(actions.currentContext.sessionId)
  })

  const archive = documentApi.createElement('button')
  archive.setAttribute('type', 'button')
  archive.classList.add('dsh-ui-enhancements-row-action')
  archive.setAttribute('data-dsh-ui-enhancements-action', 'archive')
  const archiveLabel = t('archive.aria', { title: context.title })
  archive.setAttribute('aria-label', archiveLabel)
  archive.setAttribute('title', archiveLabel)
  archive.appendChild(quickActionIcon(documentApi, 'archive'))
  archive.addEventListener('click', async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (archive.disabled) return
    archive.disabled = true
    try {
      await actions.currentContext.archiveSession(actions.currentContext.sessionId)
    } catch {
      archive.disabled = false
      archive.dataset.status = 'failed'
      archive.setAttribute('title', t('archive.failed'))
    }
  })

  actions.append(pin, archive)
  if (typeof onRequestDelete === 'function') {
    const deletion = documentApi.createElement('button')
    deletion.setAttribute('type', 'button')
    deletion.classList.add('dsh-ui-enhancements-row-action')
    deletion.setAttribute('data-dsh-ui-enhancements-action', 'delete')
    const label = t('delete.aria', { title: context.title })
    deletion.setAttribute('aria-label', label)
    deletion.setAttribute('title', label)
    deletion.appendChild(quickActionIcon(documentApi, 'delete'))
    deletion.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
      const { sessionId, title } = actions.currentContext
      actions.onRequestDelete?.({ sessionId, title })
    })
    actions.appendChild(deletion)
  }
  actionHost.insertBefore(actions, actionHost.firstChild)
  return true
}

export function installSessionQuickActions(
  t,
  browser = window,
  documentApi = document,
  Observer = globalThis.MutationObserver,
  onRequestDelete,
) {
  let pinnedIds = readPinnedSessionIds(browser.localStorage)
  let timer

  const sync = () => {
    const seen = new Map()
    for (const row of documentApi.querySelectorAll('[role="treeitem"]')) {
      const context = sessionContextFromElement(row)
      if (context === undefined || typeof context.archiveSession !== 'function') continue
      mountSessionQuickActions(row, context, pinnedIds, t, togglePin, onRequestDelete)
      if (typeof context.setSessionOrder !== 'function') continue
      let accounts = seen.get(context.setSessionOrder)
      if (accounts === undefined) {
        accounts = new Set()
        seen.set(context.setSessionOrder, accounts)
      }
      if (accounts.has(context.accountKey)) continue
      accounts.add(context.accountKey)
      syncPinnedSessionOrder(context, pinnedIds)
    }
  }

  const togglePin = (sessionId) => {
    const next = pinnedIds.includes(sessionId)
      ? pinnedIds.filter(id => id !== sessionId)
      : [sessionId, ...pinnedIds]
    if (!writePinnedSessionIds(browser.localStorage, next)) return
    pinnedIds = next
    sync()
  }

  const schedule = () => {
    if (timer !== undefined) return
    timer = setTimeout(() => {
      timer = undefined
      sync()
    }, 0)
  }
  const observer = typeof Observer === 'function' ? new Observer(schedule) : undefined
  observer?.observe(documentApi.body, { childList: true, subtree: true })
  const onStorage = (event) => {
    if (event.key !== null && event.key !== PINNED_STORAGE_KEY) return
    pinnedIds = readPinnedSessionIds(browser.localStorage)
    sync()
  }
  browser.addEventListener?.('storage', onStorage)
  sync()

  return () => {
    if (timer !== undefined) clearTimeout(timer)
    observer?.disconnect()
    browser.removeEventListener?.('storage', onStorage)
  }
}

function syncPluginToggle(button, plugin, t) {
  button.setAttribute('aria-checked', String(plugin.enabled))
  button.disabled = plugin.locked === true || button.dataset.status === 'pending'
  const key = plugin.locked ? 'plugin.locked' : plugin.enabled ? 'plugin.disable' : 'plugin.enable'
  const label = t(key, { name: plugin.moduleName })
  button.setAttribute('aria-label', label)
  button.setAttribute('title', label)
}

export function mountPluginToggle(card, plugin, t, onToggle) {
  const header = [...card.children].find(child => child.tagName === 'BUTTON')
  if (header === undefined) return false
  const documentApi = card.ownerDocument ?? document
  card.classList.add('dsh-ui-enhancements-plugin-card')
  header.classList.add('dsh-ui-enhancements-plugin-card-header')

  let button = card.querySelector('[data-dsh-ui-enhancements-plugin-toggle]')
  if (button === null) {
    button = documentApi.createElement('button')
    button.setAttribute('type', 'button')
    button.setAttribute('role', 'switch')
    button.setAttribute('data-dsh-ui-enhancements-plugin-toggle', plugin.entryId)
    button.classList.add('dsh-ui-enhancements-plugin-toggle')
    const track = documentApi.createElement('span')
    track.classList.add('dsh-ui-enhancements-plugin-toggle-track')
    const thumb = documentApi.createElement('span')
    thumb.classList.add('dsh-ui-enhancements-plugin-toggle-thumb')
    track.appendChild(thumb)
    button.appendChild(track)
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      const current = button.pluginToggleState
      if (current.locked || button.disabled) return
      const enabled = !current.enabled
      button.disabled = true
      button.dataset.status = 'pending'
      try {
        const result = await button.pluginToggleAction(current.entryId, enabled)
        if (result?.entryId !== current.entryId || typeof result.enabled !== 'boolean') {
          throw new Error('invalid plugin toggle response')
        }
        current.enabled = result.enabled
        if (!button.pluginRefreshNotice) {
          const notice = documentApi.createElement('div')
          notice.setAttribute('role', 'status')
          notice.classList.add('dsh-ui-enhancements-refresh-notice')
          const message = documentApi.createElement('p')
          const refresh = documentApi.createElement('button')
          refresh.setAttribute('type', 'button')
          refresh.addEventListener('click', event => {
            event.preventDefault()
            event.stopPropagation()
            documentApi.defaultView?.location.reload()
          })
          notice.append(message, refresh)
          card.appendChild(notice)
          button.pluginRefreshNotice = notice
        }
        button.pluginRefreshNotice.children[0].textContent = button.pluginToggleTranslate('plugin.refreshRequired')
        button.pluginRefreshNotice.children[1].textContent = button.pluginToggleTranslate('plugin.refresh')
        button.dataset.status = 'idle'
        syncPluginToggle(button, current, button.pluginToggleTranslate)
      } catch {
        button.dataset.status = 'failed'
        syncPluginToggle(button, current, button.pluginToggleTranslate)
        button.setAttribute('title', button.pluginToggleTranslate('plugin.failed', { name: current.moduleName }))
      }
    })
    card.appendChild(button)
  }

  button.pluginToggleState = plugin
  button.pluginToggleAction = onToggle
  button.pluginToggleTranslate = t
  syncPluginToggle(button, plugin, t)
  return true
}

export function installPluginToggles(
  t,
  api,
  documentApi = document,
  Observer = globalThis.MutationObserver,
) {
  let entries = new Map()
  let timer
  let disposed = false

  const sync = () => {
    for (const card of documentApi.querySelectorAll('[data-plugin-entry]')) {
      const entry = entries.get(card.getAttribute('data-plugin-entry'))
      if (entry !== undefined) mountPluginToggle(card, entry, t, setEnabled)
    }
  }
  const refresh = async () => {
    try {
      const snapshot = await api.list()
      if (!Array.isArray(snapshot?.entries)) throw new Error('invalid plugin toggle inventory')
      entries = new Map(snapshot.entries
        .filter(entry => typeof entry?.entryId === 'string'
          && typeof entry?.moduleName === 'string'
          && typeof entry?.enabled === 'boolean'
          && typeof entry?.locked === 'boolean')
        .map(entry => [entry.entryId, entry]))
      if (!disposed) sync()
    } catch (error) {
      entries = new Map()
      console.warn('dsh-ui-enhancements: plugin switches unavailable', error)
    }
  }
  const setEnabled = async (entryId, enabled) => {
    const result = await api.setEnabled(entryId, enabled)
    const entry = entries.get(entryId)
    if (entry !== undefined && result?.entryId === entryId && typeof result.enabled === 'boolean') {
      entry.enabled = result.enabled
    }
    return result
  }
  const schedule = () => {
    if (timer !== undefined) return
    timer = setTimeout(() => {
      timer = undefined
      sync()
    }, 0)
  }
  const observer = typeof Observer === 'function' ? new Observer(schedule) : undefined
  observer?.observe(documentApi.body, { childList: true, subtree: true })
  void refresh()

  return () => {
    disposed = true
    if (timer !== undefined) clearTimeout(timer)
    observer?.disconnect()
  }
}

export function installStyles(documentApi = document) {
  if (documentApi.querySelector(`#${STYLE_ID}`) !== null) return () => {}
  const style = documentApi.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
.dsh-ui-enhancements-row-actions-host {
  display: inline-flex !important;
  align-items: center;
  gap: 4px !important;
  width: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition: opacity 120ms var(--ds-ease-in-out);
}
.dsh-ui-enhancements-row:hover .dsh-ui-enhancements-row-actions-host,
.dsh-ui-enhancements-row:focus-within .dsh-ui-enhancements-row-actions-host {
  width: auto;
  opacity: 1;
  overflow: visible;
  pointer-events: auto;
}
.dsh-ui-enhancements-row:hover .dsh-ui-enhancements-row-time,
.dsh-ui-enhancements-row:focus-within .dsh-ui-enhancements-row-time { display: none; }
.dsh-ui-enhancements-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.dsh-ui-enhancements-row-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  color: var(--dsw-alias-label-tertiary);
  background: transparent;
  cursor: pointer;
}
.dsh-ui-enhancements-row-action:hover { color: var(--dsw-alias-label-primary); }
.dsh-ui-enhancements-row-action[data-dsh-ui-enhancements-action="delete"]:hover { color: var(--dsw-alias-state-error-primary); }
.dsh-ui-enhancements-archive-entry {
  display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px;
  padding: 8px 12px; border: 0; border-radius: 10px; cursor: pointer;
  background: transparent; color: var(--dsw-alias-label-secondary); font: inherit;
}
.dsh-ui-enhancements-archive-entry:hover,
.dsh-ui-enhancements-manager-button:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-ui-enhancements-archive-entry:focus-visible,
.dsh-ui-enhancements-manager-button:focus-visible,
.dsh-ui-enhancements-dialog input:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
.dsh-ui-enhancements-dialog {
  box-sizing: border-box; width: min(720px, calc(100vw - 32px)); max-height: calc(100dvh - 48px);
  padding: 24px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 16px;
  background: var(--dsw-alias-bg-layer-1, Canvas); color: var(--dsw-alias-label-primary, CanvasText);
  box-shadow: 0 12px 48px #0004; overflow: auto;
}
.dsh-ui-enhancements-dialog[open] { display: flex; flex-direction: column; gap: 16px; }
.dsh-ui-enhancements-dialog::backdrop { background: #0008; }
.dsh-ui-enhancements-dialog h2 { margin: 0; font-size: 19px; line-height: 1.4; overflow-wrap: anywhere; }
.dsh-ui-enhancements-dialog h3 { margin: 0; font-size: 14px; line-height: 1.5; overflow-wrap: anywhere; }
.dsh-ui-enhancements-dialog p { margin: 0; font-size: 14px; line-height: 1.6; overflow-wrap: anywhere; }
.dsh-ui-enhancements-dialog input {
  box-sizing: border-box; width: 100%; min-height: 44px; padding: 10px 12px;
  color: inherit; background: transparent; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; font: inherit;
}
.dsh-ui-enhancements-archive-list,.dsh-ui-enhancements-preview { min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.dsh-ui-enhancements-archive-row { padding: 16px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.dsh-ui-enhancements-archive-info { min-width: 0; }
.dsh-ui-enhancements-archive-info p { font-size: 12px; color: var(--dsw-alias-label-secondary); margin-top: 4px; }
.dsh-ui-enhancements-archive-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.dsh-ui-enhancements-manager-button { min-height: 44px; padding: 8px 12px; border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px; color: inherit; background: transparent; font: inherit; font-size: 13px; cursor: pointer; }
.dsh-ui-enhancements-manager-button:disabled { opacity: .55; cursor: wait; }
.dsh-ui-enhancements-danger,.dsh-ui-enhancements-manager-error { color: var(--dsw-alias-state-error-primary); }
.dsh-ui-enhancements-manager-error:empty { display: none; }
.dsh-ui-enhancements-dialog-footer { display: flex; justify-content: flex-end; gap: 8px; flex: none; }
.dsh-ui-enhancements-preview article { padding: 12px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.dsh-ui-enhancements-preview p { white-space: pre-wrap; margin-top: 8px; }
.dsh-ui-enhancements-manager-notice { position: fixed; bottom: max(24px, env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%);
  z-index: 10000; padding: 12px 20px; border-radius: 10px; background: var(--dsw-alias-bg-layer-1, Canvas);
  color: var(--dsw-alias-label-primary, CanvasText); border: 1px solid var(--dsw-alias-border-l1); box-shadow: 0 4px 20px #0003; }
@media (max-width: 480px) { .dsh-ui-enhancements-dialog { padding: 16px; width: calc(100vw - 24px); } }
.dsh-ui-enhancements-row-action:focus-visible {
  outline: 2px solid var(--dsw-alias-label-primary-bluish);
  outline-offset: 1px;
}
.dsh-ui-enhancements-row-action[aria-pressed="true"] {
  color: var(--dsw-alias-state-business-primary);
}
.dsh-ui-enhancements-row-action:disabled {
  opacity: .45;
  cursor: default;
}
.dsh-ui-enhancements-row-action[data-status="failed"] {
  color: var(--dsw-alias-label-error);
}
.dsh-ui-enhancements-row-action svg {
  width: 16px;
  height: 16px;
  flex: none;
}
.dsh-ui-enhancements-plugin-card {
  position: relative;
}
.dsh-ui-enhancements-plugin-card-header {
  padding-right: 72px !important;
}
.dsh-ui-enhancements-refresh-notice {
  padding: 12px;
  margin: 8px;
  border: 1px solid currentColor;
  border-radius: 8px;
  font-size: 13px;
}
.dsh-ui-enhancements-refresh-notice button { text-decoration: underline; cursor: pointer; }
.dsh-ui-enhancements-plugin-toggle {
  position: absolute;
  z-index: 1;
  top: 4px;
  right: 10px;
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: var(--dsw-alias-label-tertiary);
  background: transparent;
  cursor: pointer;
}
.dsh-ui-enhancements-plugin-toggle:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-ui-enhancements-plugin-toggle:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}
.dsh-ui-enhancements-plugin-toggle-track {
  position: relative;
  display: block;
  width: 32px;
  height: 18px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-1);
}
.dsh-ui-enhancements-plugin-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
  transition: transform 120ms var(--ds-ease-in-out);
}
.dsh-ui-enhancements-plugin-toggle[aria-checked="true"] {
  color: var(--dsw-alias-state-business-primary);
}
.dsh-ui-enhancements-plugin-toggle[aria-checked="true"] .dsh-ui-enhancements-plugin-toggle-thumb {
  transform: translateX(14px);
}
.dsh-ui-enhancements-plugin-toggle:disabled {
  opacity: .45;
  cursor: default;
}
.dsh-ui-enhancements-plugin-toggle[data-status="pending"] { opacity: .65; }
.dsh-ui-enhancements-plugin-toggle[data-status="failed"] { color: var(--dsw-alias-label-error); }
@media (hover: none) and (pointer: coarse) {
  .dsh-ui-enhancements-row { min-height: 48px; }
  .dsh-ui-enhancements-row-action { width: 44px; height: 44px; }
  .dsh-ui-enhancements-row .dsh-ui-enhancements-row-actions-host {
    width: auto;
    opacity: 1;
    overflow: visible;
    pointer-events: auto;
  }
  .dsh-ui-enhancements-row .dsh-ui-enhancements-row-time { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .dsh-ui-enhancements-row-actions-host,
  .dsh-ui-enhancements-plugin-toggle-thumb { transition: none; }
}
`
  documentApi.head.appendChild(style)
  return () => { style.remove() }
}

export function apply(ctx) {
  ctx.effect(installStyles)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }))
  ctx.effect(async () => {
    const unmount = await ctx.remote.$mount({
      package: NS, descriptors: [...PROFILE_PLUGIN_REMOTE.descriptors, ...SESSION_MANAGEMENT_REMOTE.descriptors],
    })
    const cleanups = []
    try {
      const remote = ctx.get('remote.profilePluginToggles')
      if (remote === undefined) throw new Error('profile plugin Remote did not mount')
      const api = {
        async list() {
          const result = await remote.list()
          if (!result.ok) throw new Error(result.error.message)
          return result.value
        },
        async setEnabled(entryId, enabled) {
          const result = await remote.setEnabled(entryId, enabled)
          if (!result.ok) throw new Error(result.error.message)
          return result.value
        },
      }
      cleanups.push(installPluginToggles(ctx.locale.bind(NS), api))
      const sessionRemote = ctx.get('remote.sessionManagement')
      const sessionApi = Object.fromEntries(['listArchived', 'readArchived', 'restore', 'delete'].map(method => [method, async (...args) => {
        const result = await sessionRemote[method](...args)
        if (!result.ok) throw new Error(result.error.message)
        return result.value
      }]))
      const manager = createSessionManager(ctx.locale.bind(NS), sessionApi, async (result, openId) => {
        ctx.workspaces.model.installArchived(result.archivedSessionIds)
        if (result.deleted && ctx.sessions.list.getSnapshot().current === result.sessionId) ctx.sessions.clear()
        await ctx.sessions.refresh()
        if (openId) ctx.sessions.open(openId)
      })
      cleanups.push(() => manager.dispose())
      cleanups.push(registerArchiveEntry(ctx, manager, ctx.locale.bind(NS)))
      cleanups.push(installSessionQuickActions(ctx.locale.bind(NS), window, document, globalThis.MutationObserver, target => manager.confirmDelete(target)))
      return async () => {
        for (const cleanup of cleanups.reverse()) cleanup()
        await unmount()
      }
    } catch (error) {
      for (const cleanup of cleanups.reverse()) cleanup()
      await unmount()
      throw error
    }
  })
}
