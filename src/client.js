import { ARCHIVE_STYLES } from './archive-styles.js'
import { createSessionManager, SESSION_MANAGEMENT_REMOTE, registerArchiveEntry } from './session-manager.js'
import { registerSessionDeleteEntry } from './session-menu.js'
import { PROJECTLESS_REMOTE, registerProjectless } from './projectless.js'
import { installProjectlessIcons } from './workspace-sidebar.js'
export { createProjectlessDrafts, virtualWorkspaceRecord } from './projectless.js'
export { workspaceGroupOrder } from './workspace-sidebar.js'
export { createSessionManager } from './session-manager.js'
export { registerSessionDeleteEntry, createDeleteMenuItem } from './session-menu.js'

const NS = 'dsh-ui-enhancements'
const STYLE_ID = 'dsh-ui-enhancements-style'

const zh = {
  'projectless.label': '无工作区',
  'projectless.groupHint': '独立对话，不关联工作区',
  'projectless.clear': '切换到无工作区',
  'projectless.failed': '无法开始对话：',
  'projectless.description': '新对话无需选择工作区。文件按对话分别保存到以下目录。',
  'archives.dateLocale': 'zh-CN',
  'archives.settings': '对话管理',
  'archives.settingsDescription': '查看、整理或恢复归档的对话。',
  'archives.manage': '管理',
  'archives.back': '返回对话',
  'archives.backToList': '返回归档列表',
  'archives.titlesLoading': '正在补全标题…',
  'archives.hint': '选择对话查看内容',
  'archives.matches': '{count} 条匹配',
  'archives.noWorkspace': '无工作区',
  'archives.unavailableShort': '无法读取',
  'archives.untitled': '正在读取标题…',
  'archives.created': '创建于：',
  'archives.noText': '没有可预览的文本内容',

  'archives.title': '归档对话',
  'archives.description': '归档的对话保留在这里，不会出现在工作区列表中。',
  'archives.search': '搜索归档标题或工作区',
  'archives.empty': '没有已归档的对话',
  'archives.unavailable': '暂时无法读取此对话。可刷新重试，或删除这条归档记录。',
  'archives.noMatches': '没有匹配的归档对话',
  'archives.view': '查看',
  'archives.restore': '恢复对话',
  'archives.preview': '文本预览；恢复后可在对话中查看完整内容。',
  'archives.user': '你',
  'archives.assistant': '助手',
  'archives.loading': '正在加载…',
  'archives.refresh': '刷新',
  'manager.close': '关闭',
  'manager.cancel': '取消',
  'manager.retry': '重试',
  'manager.failed': '操作失败，请重试：',
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
  'projectless.label': 'No workspace',
  'projectless.groupHint': 'Standalone conversations without a workspace',
  'projectless.clear': 'Switch to No workspace',
  'projectless.failed': 'Could not start a conversation:',
  'projectless.description': 'Start conversations without choosing a workspace. Files are saved in a separate folder per conversation under this directory.',
  'archives.dateLocale': 'en-US',
  'archives.settings': 'Conversations',
  'archives.settingsDescription': 'View, organize, or restore archived conversations.',
  'archives.manage': 'Manage',
  'archives.back': 'Back to conversation',
  'archives.backToList': 'Back to archived conversations',
  'archives.titlesLoading': 'Updating titles…',
  'archives.hint': 'Select a conversation to preview',
  'archives.matches': '{count} matches',
  'archives.noWorkspace': 'No workspace',
  'archives.unavailableShort': 'Unavailable',
  'archives.untitled': 'Reading title…',
  'archives.created': 'Created: ',
  'archives.noText': 'No text to preview',

  'archives.title': 'Archived conversations',
  'archives.description': 'Archived conversations are kept here and hidden from workspace lists.',
  'archives.search': 'Search archived titles or workspaces',
  'archives.empty': 'No archived conversations',
  'archives.unavailable': 'This conversation cannot be read right now. Refresh to retry, or delete this archived record.',
  'archives.noMatches': 'No matching archived conversations',
  'archives.view': 'View',
  'archives.restore': 'Restore conversation',
  'archives.preview': 'Text preview. Restore the conversation to view its full content.',
  'archives.user': 'You',
  'archives.assistant': 'Assistant',
  'archives.loading': 'Loading…',
  'archives.refresh': 'Refresh',
  'manager.close': 'Close',
  'manager.cancel': 'Cancel',
  'manager.retry': 'Retry',
  'manager.failed': 'Could not complete the action. Try again: ',
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

export const inject = ['locale', 'remote', 'slots', 'sessions', 'workspaces', 'layout', 'uiWorkspace']

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
  // DSH 0.2.0 replaced the bare `schema` field with a memoized `create()`
  // factory that returns it. A codec still spelling `schema` fails the registry
  // check, and the resulting mount rejection is swallowed, so nothing
  // downstream ever applies.
  let cached
  return { mode: 'strict', typeSymbol, create: () => (cached ??= schema) }
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
.dsh-ui-enhancements-menu-row {
  position: relative;
}
.dsh-ui-enhancements-menu-separator {
  height: .5px;
  margin: 3px 2px;
  background: var(--dsw-alias-border-l2);
}
/* The delete row reads as a shipped menu row: same cell metrics and focus
   fill, with the destructive colors the menu uses for danger rows. */
.dsh-ui-enhancements-menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 34px;
  padding: 6px 8px;
  border: none;
  border-radius: var(--dsw-radius-md);
  background: transparent;
  color: var(--dsw-alias-state-error-primary);
  font-family: inherit;
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
}
.dsh-ui-enhancements-menu-item:hover,
.dsh-ui-enhancements-menu-item:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover-danger);
  outline: none;
}
.dsh-ui-enhancements-menu-icon {
  display: inline-flex;
  flex: none;
  width: 14px;
  height: 14px;
  align-items: center;
  justify-content: center;
}
.dsh-ui-enhancements-menu-icon svg {
  width: 14px;
  height: 14px;
}
.dsh-ui-enhancements-menu-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${ARCHIVE_STYLES}
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
  .dsh-ui-enhancements-menu-item { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
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
    // A rejected mount never reaches the catch below — the gateway settles the
    // effect instead — so surface it here or the whole plugin fails silently.
    let unmount
    try {
      unmount = await ctx.remote.$mount({
        package: NS, descriptors: [...PROFILE_PLUGIN_REMOTE.descriptors, ...SESSION_MANAGEMENT_REMOTE.descriptors, ...PROJECTLESS_REMOTE.descriptors],
      })
    } catch (error) {
      console.error('[dsh-ui-enhancements] Remote mount failed:', error)
      throw error
    }
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
      const sessionApi = Object.fromEntries(['listArchived', 'resolveArchivedTitles', 'readArchived', 'restore', 'delete'].map(method => [method, async (...args) => {
        const result = await sessionRemote[method](...args)
        if (!result.ok) throw new Error(result.error.message)
        return result.value
      }]))
      const manager = createSessionManager(ctx.locale.bind(NS), sessionApi, async result => {
        ctx.workspaces.model.installArchived(result.archivedSessionIds)
        if (result.deleted && ctx.sessions.list.getSnapshot().current === result.sessionId) ctx.sessions.clear()
      })
      cleanups.push(() => manager.dispose())
      const projectless = ctx.get('remote.projectlessConversations')
      const info = await projectless.info()
      if (!info.ok) throw new Error(info.error.message)
      cleanups.push(registerArchiveEntry(ctx, manager, ctx.locale.bind(NS), { projectlessRoot: info.value.root }))
      cleanups.push(registerProjectless(ctx, info.value.root, async requestId => {
        const result = await projectless.prepare(requestId)
        if (!result.ok) throw new Error(result.error.message)
        return result.value
      }, ctx.locale.bind(NS)))
      cleanups.push(registerSessionDeleteEntry(ctx, manager, ctx.locale.bind(NS)))
      cleanups.push(installProjectlessIcons(ctx.locale.bind(NS), window, document, globalThis.MutationObserver))
      return async () => {
        for (const cleanup of cleanups.reverse()) cleanup()
        await unmount()
      }
    } catch (error) {
      console.error('[dsh-ui-enhancements] apply failed:', error)
      for (const cleanup of cleanups.reverse()) cleanup()
      await unmount()
      throw error
    }
  })
}
