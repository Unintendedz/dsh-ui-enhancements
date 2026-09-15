import { createArchiveStore } from './archive-store.js'
import { isProjectlessDirectory } from './projectless.js'
function text(value) {
  if (typeof value !== 'string') throw new TypeError('expected a string')
  return value
}
function id(value) {
  if (text(value).trim() === '') throw new TypeError('sessionId must not be empty')
  return value
}
function archiveState(value) {
  return { archivedSessionIds: value.archivedSessionIds.map(id) }
}
function codec(name, parse) {
  return { mode: 'strict', typeSymbol: `dsh-ui-enhancements#${name}`, schema: { parse } }
}
const identity = { name: 'id', wire: 'id', source: 'json', codec: codec('SessionId', id) }
function parseArchiveList(value) {
  return { items: value.items.map(item => ({ sessionId: id(item.sessionId), title: text(item.title), cwd: text(item.cwd), createdAt: Number(item.createdAt), available: item.available === true, titlePending: item.titlePending === true })) }
}
const methods = [
  ['listArchived', [], codec('ArchiveList', parseArchiveList)],
  ['resolveArchivedTitles', [{ name: 'ids', wire: 'ids', source: 'json', codec: codec('ArchiveIds', value => value.map(id)) }], codec('ArchiveList', parseArchiveList)],
  ['readArchived', [identity], codec('ArchivePreview', value => ({ sessionId: id(value.sessionId), messages: value.messages.map(message => ({ role: text(message.role), text: text(message.text) })) }))],
  ['restore', [identity], codec('ArchiveState', archiveState)],
  ['delete', [identity, { name: 'confirmed', wire: 'confirmed', source: 'json', codec: codec('DeleteConfirmation', value => {
    if (value !== true) throw new TypeError('deletion requires confirmation')
    return true
  }) }], codec('DeletedSession', value => {
    if (value.deleted !== true) throw new TypeError('deletion was not confirmed')
    return { ...archiveState(value), sessionId: id(value.sessionId), deleted: true }
  })],
]
export const SESSION_MANAGEMENT_REMOTE = {
  package: 'dsh-ui-enhancements',
  descriptors: methods.map(([method, parameters, result]) => ({
    id: `dsh-ui-enhancements#sessionManagement/${method}`,
    service: 'sessionManagement', namespace: 'sessionManagement', method,
    invocation: { kind: 'direct' }, parameters, result,
  })),
}

let nextDialogId = 0

export function createSessionManager(t, api, onChanged, documentApi = document) {
  const dialogs = new Set()
  const store = createArchiveStore(api, onChanged)
  let navigate = () => {}
  let disposed = false
  const element = (tag, content, className) => {
    const node = documentApi.createElement(tag)
    if (content !== undefined) node.textContent = content
    if (className) node.classList.add(className)
    return node
  }
  const button = (label, action, danger = false) => {
    const node = element('button', label, 'dsh-ui-enhancements-manager-button')
    node.setAttribute('type', 'button')
    if (danger) node.classList.add('dsh-ui-enhancements-danger')
    node.addEventListener('click', action)
    return node
  }
  const dialog = (title, description) => {
    const node = element('dialog', undefined, 'dsh-ui-enhancements-dialog')
    const heading = element('h2', title)
    heading.id = `dsh-session-dialog-${++nextDialogId}`
    node.setAttribute('aria-labelledby', heading.id)
    node.appendChild(heading)
    if (description) {
      const detail = element('p', description)
      detail.id = `${heading.id}-description`
      node.setAttribute('aria-describedby', detail.id)
      node.appendChild(detail)
    }
    dialogs.add(node)
    node.addEventListener('close', () => { dialogs.delete(node); node.remove() })
    documentApi.body.appendChild(node)
    return node
  }
  const errorBox = () => {
    const node = element('p', '', 'dsh-ui-enhancements-manager-error')
    node.setAttribute('role', 'alert')
    return node
  }
  const message = error => `${t('manager.failed')}${error instanceof Error ? error.message : String(error)}`

  const confirmDelete = (target, afterDelete) => {
    if (disposed || [...dialogs].some(node => node.dataset.deleting === target.sessionId)) return
    const node = dialog(t('delete.title', { title: target.title }), t('delete.description'))
    node.dataset.deleting = target.sessionId
    const error = errorBox()
    const footer = element('div', undefined, 'dsh-ui-enhancements-dialog-footer')
    const cancel = button(t('manager.cancel'), () => node.close())
    const confirm = button(t('delete.action'), async () => {
      if (confirm.disabled) return
      confirm.disabled = true
      cancel.disabled = true
      confirm.textContent = t('delete.pending')
      error.textContent = ''
      try {
        await store.remove(target.sessionId)
        node.close()
        afterDelete?.()
        const notice = element('div', t('delete.success'), 'dsh-ui-enhancements-manager-notice')
        notice.setAttribute('role', 'status')
        documentApi.body.appendChild(notice)
        setTimeout(() => notice.remove(), 3500)
      } catch (reason) { error.textContent = message(reason) }
      finally {
        confirm.disabled = false
        cancel.disabled = false
        confirm.textContent = t('delete.action')
      }
    }, true)
    node.addEventListener('cancel', event => { if (confirm.disabled) event.preventDefault() })
    footer.append(cancel, confirm)
    node.append(error, footer)
    node.showModal()
    cancel.focus()
  }

  return {
    store, confirmDelete,
    showArchives() { if (!disposed) { navigate(); void store.load() } },
    bindNavigation(action) { navigate = action },
    dispose() { disposed = true; store.dispose(); for (const node of dialogs) { node.close(); node.remove() }; dialogs.clear() },
  }
}

export function registerArchiveEntry(ctx, manager, t, { projectlessRoot } = {}) {
  // React is provided by DSH. Use its public main/settings slots and native
  // layout navigation, without adding another permanent sidebar action.
  const { createElement: h, useSyncExternalStore, useEffect, useLayoutEffect, useRef, useState } = require('react')
  const store = manager.store
  const paths = {
    back: 'm10 3-5 5 5 5', close: 'm4 4 8 8M4 12l8-8',
    search: 'M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm4-1 3 3',
    restore: 'M3 5h7a4 4 0 0 1 0 8H7M3 5l3-3M3 5l3 3',
    delete: 'M2 4h12M6 4V2h4v2M4 4l.5 10h7L12 4M7 7v4M9 7v4',
    refresh: 'M13 6a5 5 0 1 0 0 4M13 2v4H9',
  }
  const icon = name => h('svg', {width:16,height:16,viewBox:'0 0 16 16',fill:'none','aria-hidden':true}, h('path',{d:paths[name],stroke:'currentColor',strokeWidth:1.4,strokeLinecap:'round',strokeLinejoin:'round'}))
  const iconButton = (name, label, onClick, extra = {}) => h('button', {type:'button',className:'dsh-archives-icon',title:label,'aria-label':label,onClick,...extra},icon(name))
  const workspaceName = cwd => (projectlessRoot && isProjectlessDirectory(cwd, projectlessRoot)) ? t('archives.noWorkspace') : cwd.split(/[\\/]/).filter(Boolean).at(-1) || t('archives.noWorkspace')
  let savedScroll = 0
  function ArchivePage() {
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
    const list = useRef(null), heading = useRef(null), search = useRef(null), detail = useRef(null)
    const [rowError, setRowError] = useState(null)
    useLayoutEffect(() => { if (list.current) list.current.scrollTop = savedScroll }, [])
    useEffect(() => { heading.current?.focus() }, [])
    useEffect(() => { if (state.selectedId) detail.current?.focus() }, [state.selectedId])
    const query = state.query.trim().toLocaleLowerCase()
    const shown = state.items.filter(item => `${item.title} ${item.cwd}`.toLocaleLowerCase().includes(query))
    const selected = state.items.find(item => item.sessionId === state.selectedId)
    const focusRow = id => {
      const node = list.current?.querySelector(`[data-archived-session="${CSS.escape(id ?? '')}"] .dsh-archives-open`)
      ;(node ?? search.current)?.focus()
    }
    const afterRemove = item => {
      const index = shown.indexOf(item)
      const next = shown[index + 1] ?? shown[index - 1]
      requestAnimationFrame(() => focusRow(next?.sessionId))
    }
    const restore = async item => {
      setRowError(null)
      try { await store.restore(item.sessionId); afterRemove(item) }
      catch (error) { setRowError({id:item.sessionId,text:String(error.message ?? error)}) }
    }
    const backToList = () => { const id=state.selectedId; void store.select(null); requestAnimationFrame(()=>focusRow(id)) }
    const actions = item => h('div',{className:'dsh-archives-actions'},
      iconButton('restore',t('archives.restore'),()=>void restore(item),{disabled:!item.available || state.pending.has(item.sessionId)}),
      iconButton('delete',t('delete.action'),()=>manager.confirmDelete(item,()=>afterRemove(item)),{disabled:state.pending.has(item.sessionId),'data-danger':true}))
    const preview = state.preview
    return h('section',{className:'dsh-archives-page','aria-labelledby':'dsh-archives-heading'},
      h('header',{className:'dsh-archives-header'},
        iconButton('back',t('archives.back'),()=>ctx.layout.selectPanel(null)),
        h('h1',{id:'dsh-archives-heading',tabIndex:-1,ref:heading},t('archives.title')),
        h('span',{className:'dsh-archives-count'},state.loaded ? state.items.length : '')),
      h('p',{className:'dsh-archives-description'},t('archives.description')),
      h('div',{className:'dsh-archives-body','data-detail':!!selected},
        h('div',{className:'dsh-archives-inventory'},
          h('div',{className:'dsh-archives-toolbar'},
            h('label',{className:'dsh-archives-search'},icon('search'),h('span',{className:'dsh-archives-sr'},t('archives.search')),
              h('input',{type:'search',ref:search,value:state.query,placeholder:t('archives.search'),onChange:e=>store.setQuery(e.target.value)})),
            iconButton('refresh',t('archives.refresh'),()=>void store.load(),{disabled:state.loading || state.hydrating})),
          h('div',{className:'dsh-archives-status',role:'status'},state.loading ? t('archives.loading') : state.hydrating ? t('archives.titlesLoading') : query ? t('archives.matches',{count:shown.length}) : t('archives.hint')),
          state.error ? h('div',{className:'dsh-archives-error',role:'alert'},t('manager.failed')+state.error,h('button',{type:'button',onClick:()=>void store.load()},t('manager.retry'))) : null,
          h('ul',{className:'dsh-archives-list',ref:list,onScroll:e=>{savedScroll=e.currentTarget.scrollTop},'aria-label':t('archives.title')},
            !shown.length ? h('li',{className:'dsh-archives-empty'},state.loading && !state.loaded ? t('archives.loading') : t(query ? 'archives.noMatches' : 'archives.empty')) : null,
            ...shown.map(item=>h('li',{key:item.sessionId,'data-archived-session':item.sessionId,'data-selected':item.sessionId===state.selectedId,'aria-busy':state.pending.has(item.sessionId),className:'dsh-archives-row'},
              h('div',{className:'dsh-archives-row-main'},
                h('button',{type:'button',className:'dsh-archives-open','aria-current':item.sessionId===state.selectedId ? 'true' : undefined,onClick:()=>void store.select(item.sessionId),title:item.title},
                  h('span',{className:'dsh-archives-row-title'},item.titlePending && item.title === item.sessionId ? t('archives.untitled') : item.title),
                  h('span',{className:'dsh-archives-row-meta',title:item.cwd},workspaceName(item.cwd),!item.available ? ` · ${t('archives.unavailableShort')}` : '')),
                item.createdAt ? h('time',{className:'dsh-archives-date',dateTime:new Date(item.createdAt).toISOString(),title:t('archives.created')+new Date(item.createdAt).toLocaleString(t('archives.dateLocale'))},new Date(item.createdAt).toLocaleDateString(t('archives.dateLocale'),{month:'short',day:'numeric'})) : null,
                actions(item)),
              rowError?.id===item.sessionId ? h('div',{className:'dsh-archives-error',role:'alert'},t('manager.failed')+rowError.text) : null)))),
        selected ? h('section',{className:'dsh-archives-detail','aria-label':selected.title},
          h('header',{className:'dsh-archives-detail-header'},iconButton('back',t('archives.backToList'),backToList),h('h2',{tabIndex:-1,ref:detail},selected.title),actions(selected)),
          h('p',{className:'dsh-archives-preview-note'},t('archives.preview')),
          h('div',{className:'dsh-archives-messages'},
            preview?.loading ? h('p',{role:'status'},t('archives.loading')) : preview?.error ? h('div',{className:'dsh-archives-error',role:'alert'},t('manager.failed')+preview.error,h('button',{type:'button',onClick:()=>void store.select(selected.sessionId)},t('manager.retry')))
              : preview?.messages?.length ? preview.messages.map((entry,index)=>h('article',{key:index},h('h3',null,t(entry.role==='user'?'archives.user':'archives.assistant')),h('p',null,entry.text))) : h('p',null,t('archives.noText')))) : null))
  }
  function ConversationSettings({close}) {
    return h('section',{className:'dsh-archives-settings'},h('h2',null,t('archives.settings')),
      h('div',{className:'dsh-archives-settings-row'},h('div',null,h('h3',null,t('archives.title')),h('p',null,t('archives.settingsDescription'))),
        h('button',{type:'button',className:'dsh-ui-enhancements-manager-button',onClick:()=>{close();manager.showArchives()}},t('archives.manage'))),
      projectlessRoot && h('div',{className:'dsh-archives-settings-row'},h('div',null,
        h('h3',null,t('projectless.label')),h('p',null,t('projectless.description')),
        h('code',{className:'dsh-projectless-path'},projectlessRoot))))
  }
  manager.bindNavigation(()=>{
    ctx.layout.selectPanel('dsh-archives')
    // Settings restores focus to its trigger when closing. Transfer it after
    // that effect, including when returning to an already-mounted archive page.
    requestAnimationFrame(()=>{
      const heading = document.getElementById('dsh-archives-heading')
      const rect = heading?.closest('.dsh-archives-page')?.getBoundingClientRect()
      if (window.innerWidth < 600 && rect?.left > 200) ctx.layout.toggleSidebar()
      heading?.focus()
    })
  })
  const main = ctx.slots.inject('main',()=>ctx.slots.register({name:'main',key:'dsh-archives',locale:'dsh-ui-enhancements'},ArchivePage))
  const settings = ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'conversations',order:20,label:()=>t('archives.settings'),locale:'dsh-ui-enhancements'},ConversationSettings))
  return () => { settings(); main() }
}
