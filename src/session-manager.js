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
const methods = [
  ['listArchived', [], codec('ArchiveList', value => ({ items: value.items.map(item => ({
    sessionId: id(item.sessionId), title: text(item.title), cwd: text(item.cwd), createdAt: Number(item.createdAt),
  })) }))],
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
  let archiveDialog
  let refreshArchives
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

  const confirmDelete = target => {
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
        const result = await api.delete(target.sessionId, true)
        await onChanged(result)
        node.close()
        if (refreshArchives) await refreshArchives()
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

  const preview = async item => {
    const node = dialog(item.title, t('archives.preview'))
    const body = element('div', t('archives.loading'), 'dsh-ui-enhancements-preview')
    const close = button(t('manager.close'), () => node.close())
    node.append(body, close)
    node.showModal()
    try {
      const value = await api.readArchived(item.sessionId)
      if (!dialogs.has(node)) return
      body.replaceChildren()
      for (const entry of value.messages) {
        const article = element('article')
        article.append(element('h3', t(entry.role === 'user' ? 'archives.user' : 'archives.assistant')), element('p', entry.text))
        body.appendChild(article)
      }
    } catch (reason) { body.textContent = message(reason) }
  }

  const showArchives = async () => {
    if (disposed || archiveDialog) return
    const node = dialog(t('archives.title'), t('archives.description'))
    archiveDialog = node
    const search = element('input')
    search.setAttribute('type', 'search')
    search.setAttribute('aria-label', t('archives.search'))
    search.setAttribute('placeholder', t('archives.search'))
    search.value = ''
    const error = errorBox()
    const list = element('div', undefined, 'dsh-ui-enhancements-archive-list')
    const footer = element('div', undefined, 'dsh-ui-enhancements-dialog-footer')
    let items = []
    let busy = false
    const render = () => {
      const query = search.value.trim().toLocaleLowerCase()
      const shown = items.filter(item => `${item.title} ${item.cwd}`.toLocaleLowerCase().includes(query))
      list.replaceChildren()
      if (!shown.length) list.appendChild(element('p', t(items.length ? 'archives.noMatches' : 'archives.empty')))
      for (const item of shown) {
        const row = element('article', undefined, 'dsh-ui-enhancements-archive-row')
        row.setAttribute('data-archived-session', item.sessionId)
        const info = element('div', undefined, 'dsh-ui-enhancements-archive-info')
        info.append(element('h3', item.title), element('p', item.cwd))
        const actions = element('div', undefined, 'dsh-ui-enhancements-archive-actions')
        actions.append(button(t('archives.view'), () => { void preview(item) }), button(t('archives.restore'), async () => {
          if (busy) return
          busy = true
          error.textContent = ''
          try {
            const result = await api.restore(item.sessionId)
            await onChanged(result, item.sessionId)
            node.close()
          } catch (reason) { error.textContent = message(reason) }
          finally { busy = false }
        }), button(t('delete.action'), () => { if (!busy) confirmDelete(item) }, true))
        row.append(info, actions)
        list.appendChild(row)
      }
    }
    const refresh = async () => {
      list.textContent = t('archives.loading')
      error.textContent = ''
      try {
        const value = await api.listArchived()
        if (!dialogs.has(node)) return
        items = value.items
        render()
      } catch (reason) { list.textContent = ''; error.textContent = message(reason) }
    }
    refreshArchives = refresh
    search.addEventListener('input', render)
    footer.append(button(t('archives.refresh'), refresh), button(t('manager.close'), () => node.close()))
    node.append(search, error, list, footer)
    node.addEventListener('close', () => { archiveDialog = undefined; refreshArchives = undefined; dialogs.delete(node); node.remove() })
    node.showModal()
    await refresh()
  }
  return {
    showArchives, confirmDelete,
    dispose() { disposed = true; for (const node of dialogs) { node.close(); node.remove() }; dialogs.clear() },
  }
}

export function registerArchiveEntry(ctx, manager, t) {
  // Resolved by DSH's browser module loader; React stays external to the bundle.
  const { createElement: h } = require('react')
  function ArchiveEntry({ wide, t: translate = t }) {
    return h('button', {
      type: 'button', className: 'dsh-ui-enhancements-archive-entry',
      'aria-label': translate('archives.title'), title: translate('archives.title'), onClick: manager.showArchives,
    }, h('svg', { width: 20, height: 20, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M2 5h12M3 5l1-2h8l1 2v8H3V5ZM6 8h4', stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round' })),
    wide ? h('span', null, translate('archives.title')) : null)
  }
  return ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action', id: 'archived-conversations', order: -10, locale: 'dsh-ui-enhancements',
  }, ArchiveEntry))
}
