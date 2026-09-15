import assert from 'node:assert/strict'
import { test } from 'node:test'

async function loadClient() {
  return import('../src/client.js')
}

function actionElement(tagName = 'span') {
  const attributes = new Map()
  const listeners = new Map()
  const classes = new Set()
  const element = {
    tagName: tagName.toUpperCase(),
    children: [],
    parentElement: null,
    ownerDocument: null,
    dataset: {},
    disabled: false,
    textContent: '',
    focus() {},
    showModal() { element.open = true },
    close() { element.open = false; listeners.get('close')?.({}) },
    remove() {
      if (element.parentElement !== null) element.parentElement.children = element.parentElement.children.filter(child => child !== element)
      element.parentElement = null
    },
    classList: {
      add(...names) { for (const name of names) classes.add(name) },
      contains(name) { return classes.has(name) },
    },
    setAttribute(name, value) { attributes.set(name, String(value)) },
    getAttribute(name) { return attributes.get(name) ?? null },
    hasAttribute(name) { return attributes.has(name) },
    appendChild(child) { child.parentElement = element; element.children.push(child); return child },
    append(...children) { for (const child of children) element.appendChild(child) },
    replaceChildren(...children) {
      for (const child of element.children) child.parentElement = null
      element.children = []
      element.append(...children)
    },
    insertBefore(child, before) {
      child.parentElement = element
      const index = before === null ? -1 : element.children.indexOf(before)
      if (index === -1) element.children.push(child)
      else element.children.splice(index, 0, child)
      return child
    },
    addEventListener(type, listener) { listeners.set(type, listener) },
    querySelector(selector) {
      const matches = (candidate) => {
        if (selector === 'button') return candidate.tagName === 'BUTTON'
        if (selector === '[data-dsh-ui-enhancements-actions]') {
          return candidate.hasAttribute('data-dsh-ui-enhancements-actions')
        }
        if (selector === '[data-dsh-ui-enhancements-plugin-toggle]') {
          return candidate.hasAttribute('data-dsh-ui-enhancements-plugin-toggle')
        }
        return false
      }
      const visit = (candidate) => {
        if (matches(candidate)) return candidate
        for (const child of candidate.children) {
          const found = visit(child)
          if (found !== null) return found
        }
        return null
      }
      for (const child of element.children) {
        const found = visit(child)
        if (found !== null) return found
      }
      return null
    },
    async dispatch(type) {
      const event = {
        defaultPrevented: false,
        propagationStopped: false,
        preventDefault() { this.defaultPrevented = true },
        stopPropagation() { this.propagationStopped = true },
      }
      await listeners.get(type)?.(event)
      return event
    },
  }
  Object.defineProperty(element, 'firstChild', { get: () => element.children[0] ?? null })
  Object.defineProperty(element, 'previousElementSibling', {
    get: () => {
      if (element.parentElement === null) return null
      const index = element.parentElement.children.indexOf(element)
      return index > 0 ? element.parentElement.children[index - 1] : null
    },
  })
  return element
}

function pluginCard() {
  const documentApi = {
    createElement: tag => actionElement(tag),
  }
  const card = actionElement('li')
  card.ownerDocument = documentApi
  card.setAttribute('data-plugin-entry', 'plugin-a-entry')
  const header = actionElement('button')
  card.appendChild(header)
  return { card, header }
}

function quickActionRow() {
  const documentApi = {
    createElement: tag => actionElement(tag),
    createElementNS: (_namespace, tag) => actionElement(tag),
  }
  const row = actionElement('div')
  row.ownerDocument = documentApi
  const time = actionElement('span')
  const actionHost = actionElement('span')
  const menuRoot = actionElement('span')
  menuRoot.appendChild(actionElement('button'))
  actionHost.appendChild(menuRoot)
  row.append(time, actionHost)
  return { row, time, actionHost }
}

test('pinned sessions stay first without disturbing the remaining order', async () => {
  const client = await loadClient()

  assert.equal(typeof client.pinnedSessionOrder, 'function')
  assert.deepEqual(
    client.pinnedSessionOrder(
      ['session-a', 'session-b', 'session-c', 'session-d'],
      ['session-d', 'session-b', 'session-missing'],
    ),
    ['session-d', 'session-b', 'session-a', 'session-c'],
  )
})

test('pin persistence keeps unique non-empty session IDs and reports denied writes', async () => {
  const client = await loadClient()
  const storage = {
    value: JSON.stringify(['session-b', '', 'session-b', 42, 'session-a']),
    getItem() { return this.value },
    setItem(_key, value) { this.value = value },
  }

  assert.equal(typeof client.readPinnedSessionIds, 'function')
  assert.deepEqual(client.readPinnedSessionIds(storage), ['session-b', 'session-a'])
  assert.equal(client.writePinnedSessionIds(storage, ['session-a']), true)
  assert.deepEqual(JSON.parse(storage.value), ['session-a'])
  assert.deepEqual(client.readPinnedSessionIds({ getItem: () => '{' }), [])
  assert.equal(client.writePinnedSessionIds({ setItem() { throw new Error('denied') } }, ['session-a']), false)
})

test('session row context resolves workspace and flat-list ordering owners', async () => {
  const client = await loadClient()
  const archiveSession = async () => {}
  const setSessionOrder = () => {}
  const grouped = {}
  Object.defineProperty(grouped, '__reactFiber$test', {
    value: {
      memoizedProps: { node: { id: 'session-row', title: 'Pinned row' } },
      return: {
        memoizedProps: {
          sessionOrderByAccount: { 'workspace-1': ['session-other', 'session-row'] },
          setSessionOrder,
          workspaces: [{ workspaceId: 'workspace-1', sessionIds: ['session-other', 'session-row'] }],
        },
        return: { memoizedProps: { archiveSession }, return: null },
      },
    },
  })
  const flat = {}
  Object.defineProperty(flat, '__reactFiber$test', {
    value: {
      memoizedProps: { node: { id: 'session-flat', title: 'Flat row' } },
      return: {
        memoizedProps: {
          sessionOrderByAccount: { '__flat_session_order__': ['session-flat'] },
          setSessionOrder,
        },
        return: { memoizedProps: { archiveSession }, return: null },
      },
    },
  })

  assert.equal(typeof client.sessionContextFromElement, 'function')
  assert.deepEqual(client.sessionContextFromElement(grouped), {
    sessionId: 'session-row',
    title: 'Pinned row',
    archiveSession,
    sessionOrderByAccount: { 'workspace-1': ['session-other', 'session-row'] },
    setSessionOrder,
    workspaces: [{ workspaceId: 'workspace-1', sessionIds: ['session-other', 'session-row'] }],
    accountKey: 'workspace-1',
  })
  assert.equal(client.sessionContextFromElement(flat).accountKey, '__flat_session_order__')
})

test('pin sync writes one changed DSH order and skips an already pinned order', async () => {
  const client = await loadClient()
  const writes = []
  const context = {
    accountKey: 'workspace-1',
    sessionOrderByAccount: { 'workspace-1': ['session-a', 'session-b', 'session-c'] },
    setSessionOrder(accountKey, order) { writes.push({ accountKey, order }) },
  }

  assert.equal(typeof client.syncPinnedSessionOrder, 'function')
  assert.equal(client.syncPinnedSessionOrder(context, ['session-b']), true)
  assert.deepEqual(writes, [{
    accountKey: 'workspace-1',
    order: ['session-b', 'session-a', 'session-c'],
  }])
  context.sessionOrderByAccount['workspace-1'] = writes[0].order
  assert.equal(client.syncPinnedSessionOrder(context, ['session-b']), false)
  assert.equal(writes.length, 1)
})

test('row quick actions expose pin state and reuse the native archive action', async () => {
  const client = await loadClient()
  const { row, time, actionHost } = quickActionRow()
  const toggled = []
  const archived = []
  const context = {
    sessionId: 'session-row',
    title: 'Pinned row',
    async archiveSession(sessionId) { archived.push(sessionId) },
  }
  const t = (key, params = {}) => `${key}:${params.title ?? ''}`

  assert.equal(typeof client.mountSessionQuickActions, 'function')
  assert.equal(client.mountSessionQuickActions(
    row,
    context,
    ['session-row'],
    t,
    sessionId => { toggled.push(sessionId) },
  ), true)

  const actions = row.querySelector('[data-dsh-ui-enhancements-actions]')
  const [pin, archive] = actions.children
  assert.equal(pin.getAttribute('aria-pressed'), 'true')
  assert.equal(pin.getAttribute('aria-label'), 'unpin.aria:Pinned row')
  assert.equal(archive.getAttribute('aria-label'), 'archive.aria:Pinned row')
  assert.equal(actionHost.classList.contains('dsh-ui-enhancements-row-actions-host'), true)
  assert.equal(time.classList.contains('dsh-ui-enhancements-row-time'), true)

  const pinEvent = await pin.dispatch('click')
  const archiveEvent = await archive.dispatch('click')
  assert.equal(pinEvent.defaultPrevented, true)
  assert.equal(pinEvent.propagationStopped, true)
  assert.equal(archiveEvent.defaultPrevented, true)
  assert.equal(archiveEvent.propagationStopped, true)
  assert.deepEqual(toggled, ['session-row'])
  assert.deepEqual(archived, ['session-row'])
})

test('immediate delete requests confirmation for the latest row identity without archiving', async () => {
  const client = await loadClient()
  const { row } = quickActionRow()
  const requests = []
  let archives = 0
  const context = { sessionId: 'original', title: 'Original', async archiveSession() { archives++ } }
  const requestDelete = value => requests.push(value)
  client.mountSessionQuickActions(row, context, [], key => key, () => {}, requestDelete)
  const actions = row.querySelector('[data-dsh-ui-enhancements-actions]')
  const deletion = actions.children.find(button => button.getAttribute('data-dsh-ui-enhancements-action') === 'delete')
  assert.ok(deletion, 'an immediate delete action is available beside archive')
  client.mountSessionQuickActions(row, { ...context, sessionId: 'replacement', title: 'New title' }, [], key => key, () => {}, requestDelete)
  const event = await deletion.dispatch('click')
  assert.equal(event.propagationStopped, true)
  assert.deepEqual(requests, [{ sessionId: 'replacement', title: 'New title' }])
  assert.equal(archives, 0)
})

test('delete dialog waits for confirmation, preserves itself on failure, and supports retry', async () => {
  const client = await loadClient()
  const documentApi = { body: actionElement('body'), createElement: tag => actionElement(tag) }
  const deletes = []
  let fail = true
  assert.equal(typeof client.createSessionManager, 'function')
  const manager = client.createSessionManager(key => key, {
    async delete(id, confirmed) { deletes.push({ id, confirmed }); if (fail) throw new Error('offline'); return { deleted: true } },
  }, async () => {}, documentApi)
  manager.confirmDelete({ sessionId: 'target', title: 'Target' })
  const dialog = documentApi.body.children[0]
  const footer = dialog.children.at(-1)
  const [cancel, confirm] = footer.children
  assert.equal(deletes.length, 0)
  await cancel.dispatch('click')
  assert.equal(documentApi.body.children.length, 0)
  manager.confirmDelete({ sessionId: 'target', title: 'Target' })
  const retryDialog = documentApi.body.children[0]
  const retryConfirm = retryDialog.children.at(-1).children[1]
  await retryConfirm.dispatch('click')
  assert.equal(retryDialog.open, true)
  assert.equal(retryConfirm.disabled, false)
  fail = false
  await retryConfirm.dispatch('click')
  assert.equal(documentApi.body.children.some(child => child.tagName === 'DIALOG'), false)
  assert.equal(documentApi.body.children[0].getAttribute('role'), 'status')
  assert.deepEqual(deletes, [{ id: 'target', confirmed: true }, { id: 'target', confirmed: true }])
})

test('plugin card switch exposes state and persists the requested opposite state', async () => {
  const client = await loadClient()
  const { card, header } = pluginCard()
  const requests = []
  const plugin = {
    entryId: 'plugin-a-entry',
    moduleName: 'plugin-a',
    version: '1.2.3',
    enabled: true,
    locked: false,
  }
  const t = (key, params = {}) => `${key}:${params.name ?? ''}`

  assert.equal(typeof client.mountPluginToggle, 'function')
  assert.equal(client.mountPluginToggle(card, plugin, t, async (entryId, enabled) => {
    requests.push({ entryId, enabled })
    return { entryId, enabled }
  }), true)

  const toggle = card.querySelector('[data-dsh-ui-enhancements-plugin-toggle]')
  assert.equal(toggle.getAttribute('role'), 'switch')
  assert.equal(toggle.getAttribute('aria-checked'), 'true')
  assert.equal(toggle.getAttribute('aria-label'), 'plugin.disable:plugin-a')
  assert.equal(header.classList.contains('dsh-ui-enhancements-plugin-card-header'), true)

  const event = await toggle.dispatch('click')
  assert.equal(event.defaultPrevented, true)
  assert.equal(event.propagationStopped, true)
  assert.deepEqual(requests, [{ entryId: 'plugin-a-entry', enabled: false }])
  assert.equal(toggle.getAttribute('aria-checked'), 'false')
  assert.equal(toggle.getAttribute('aria-label'), 'plugin.enable:plugin-a')
  assert.equal(toggle.disabled, false)
})

test('plugin manager keeps its own switch visible but locked', async () => {
  const client = await loadClient()
  const { card } = pluginCard()
  client.mountPluginToggle(card, {
    entryId: 'manager',
    moduleName: 'dsh-ui-enhancements',
    version: '0.2.0',
    enabled: true,
    locked: true,
  }, (key, params = {}) => `${key}:${params.name ?? ''}`, async () => {
    throw new Error('locked switch must not call the host')
  })

  const toggle = card.querySelector('[data-dsh-ui-enhancements-plugin-toggle]')
  assert.equal(toggle.disabled, true)
  assert.equal(toggle.getAttribute('aria-checked'), 'true')
  assert.equal(toggle.getAttribute('aria-label'), 'plugin.locked:dsh-ui-enhancements')
})

test('inventory DOM refresh cannot unlock a plugin switch while its update is pending', async () => {
  const client = await loadClient()
  const { card } = pluginCard()
  const plugin = {
    entryId: 'plugin-a-entry',
    moduleName: 'plugin-a',
    version: '1.2.3',
    enabled: true,
    locked: false,
  }
  let resolveUpdate
  const update = new Promise(resolve => { resolveUpdate = resolve })
  const action = async () => update
  const t = key => key

  client.mountPluginToggle(card, plugin, t, action)
  const toggle = card.querySelector('[data-dsh-ui-enhancements-plugin-toggle]')
  const pending = toggle.dispatch('click')
  assert.equal(toggle.disabled, true)
  assert.equal(toggle.dataset.status, 'pending')

  client.mountPluginToggle(card, plugin, t, action)
  assert.equal(toggle.disabled, true)

  resolveUpdate({ entryId: plugin.entryId, enabled: false })
  await pending
  assert.equal(toggle.disabled, false)
})

test('plugin toggle inventory failure is reported without breaking the page', async () => {
  const client = await loadClient()
  const warnings = []
  const previousWarn = console.warn
  console.warn = (...args) => { warnings.push(args) }
  const documentApi = {
    body: {},
    querySelectorAll: () => [],
  }
  class FakeMutationObserver {
    observe() {}
    disconnect() {}
  }

  try {
    const cleanup = client.installPluginToggles(
      key => key,
      {
        async list() { throw new Error('remote unavailable') },
        async setEnabled() { throw new Error('unexpected toggle') },
      },
      documentApi,
      FakeMutationObserver,
    )
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(warnings.length, 1)
    assert.match(String(warnings[0][0]), /plugin switches unavailable/)
    cleanup()
  } finally {
    console.warn = previousWarn
  }
})

test('refreshing an unchanged row reuses action DOM and updates renamed labels', async () => {
  const client = await loadClient()
  const { row, actionHost } = quickActionRow()
  const t = (key, params = {}) => `${key}:${params.title ?? ''}`
  const context = {
    sessionId: 'session-row',
    title: 'Draft title',
    async archiveSession() {},
  }

  client.mountSessionQuickActions(row, context, [], t, () => {})
  const actions = row.querySelector('[data-dsh-ui-enhancements-actions]')
  const [pin, archive] = actions.children
  const originalPinIcon = pin.children[0]

  client.mountSessionQuickActions(row, { ...context, title: 'Final title' }, [], t, () => {})

  assert.equal(actionHost.children.filter(child => (
    child.hasAttribute('data-dsh-ui-enhancements-actions')
  )).length, 1)
  assert.equal(pin.children[0], originalPinIcon)
  assert.equal(pin.getAttribute('aria-label'), 'pin.aria:Final title')
  assert.equal(archive.getAttribute('aria-label'), 'archive.aria:Final title')
})

test('failed archive restores the button and exposes a retryable error state', async () => {
  const client = await loadClient()
  const { row } = quickActionRow()
  const context = {
    sessionId: 'session-row',
    title: 'Archive failure',
    async archiveSession() { throw new Error('offline') },
  }
  client.mountSessionQuickActions(row, context, [], key => key, () => {})
  const archive = row.querySelector('[data-dsh-ui-enhancements-actions]').children[1]
  let rejection
  try {
    await archive.dispatch('click')
  } catch (reason) {
    rejection = reason
  }

  assert.equal(rejection, undefined)
  assert.equal(archive.disabled, false)
  assert.equal(archive.dataset.status, 'failed')
  assert.equal(archive.getAttribute('title'), 'archive.failed')
})

test('installer restores pinned rows and watches React list changes', async () => {
  const client = await loadClient()
  const { row } = quickActionRow()
  const writes = []
  const setSessionOrder = (accountKey, order) => { writes.push({ accountKey, order }) }
  Object.defineProperty(row, '__reactFiber$test', {
    value: {
      memoizedProps: { node: { id: 'session-row', title: 'Pinned row' } },
      return: {
        memoizedProps: {
          sessionOrderByAccount: { 'workspace-1': ['session-other', 'session-row'] },
          setSessionOrder,
          workspaces: [{ workspaceId: 'workspace-1', sessionIds: ['session-other', 'session-row'] }],
        },
        return: { memoizedProps: { async archiveSession() {} }, return: null },
      },
    },
  })
  const storage = {
    getItem: () => JSON.stringify(['session-row']),
    setItem() {},
  }
  const browser = {
    localStorage: storage,
    addEventListener() {},
    removeEventListener() {},
  }
  const documentApi = {
    body: {},
    querySelectorAll: selector => selector === '[role="treeitem"]' ? [row] : [],
  }
  let observed
  let disconnected = false
  class FakeMutationObserver {
    constructor(callback) { this.callback = callback }
    observe(target, options) { observed = { target, options } }
    disconnect() { disconnected = true }
  }

  assert.equal(typeof client.installSessionQuickActions, 'function')
  const cleanup = client.installSessionQuickActions(
    (key, params = {}) => `${key}:${params.title ?? ''}`,
    browser,
    documentApi,
    FakeMutationObserver,
  )

  assert.ok(row.querySelector('[data-dsh-ui-enhancements-actions]'))
  assert.deepEqual(writes, [{
    accountKey: 'workspace-1',
    order: ['session-row', 'session-other'],
  }])
  assert.deepEqual(observed, {
    target: documentApi.body,
    options: { childList: true, subtree: true },
  })
  cleanup()
  assert.equal(disconnected, true)
})

test('installed styles reveal quick actions on hover, focus, and coarse pointers', async () => {
  const client = await loadClient()
  let appended
  let removed = false
  const documentApi = {
    querySelector: () => null,
    createElement: () => ({ remove() { removed = true } }),
    head: { appendChild(style) { appended = style } },
  }

  assert.equal(typeof client.installStyles, 'function')
  const cleanup = client.installStyles(documentApi)
  assert.match(appended.textContent, /\.dsh-ui-enhancements-row:hover/)
  assert.match(appended.textContent, /focus-within/)
  assert.match(appended.textContent, /@media \(hover: none\) and \(pointer: coarse\)/)
  cleanup()
  assert.equal(removed, true)
})

test('client apply registers bilingual copy and starts the sidebar enhancer', async () => {
  const client = await loadClient()
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    MutationObserver: globalThis.MutationObserver,
    require: globalThis.require,
  }
  const registrations = []
  const effects = []
  const remoteMounts = []
  const serviceLookups = []
  let observed = false
  globalThis.window = {
    localStorage: { getItem: () => null, setItem() {} },
    addEventListener() {},
    removeEventListener() {},
  }
  globalThis.document = {
    body: {},
    head: { appendChild() {} },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ remove() {} }),
  }
  globalThis.MutationObserver = class {
    observe() { observed = true }
    disconnect() {}
  }
  const ctx = {
    inject() {},
    slots: { inject: () => () => {} },
    uiWorkspace: { connectWorkspace() {}, startSession() {} },
    get(service) {
      serviceLookups.push(service)
      if (service === 'remote.projectlessConversations') return { async info() { return { ok: true, value: { root: '/synthetic/projectless' } } } }
      if (service !== 'remote.profilePluginToggles') return undefined
      return {
        async list() { return { ok: true, value: { entries: [] } } },
        async setEnabled() { throw new Error('unexpected toggle') },
      }
    },
    effect(start) {
      const effect = Promise.resolve().then(start)
      effects.push(effect)
      return effect
    },
    locale: {
      bind() { return key => key },
      register(namespace, dictionaries) {
        registrations.push({ namespace, dictionaries })
        return () => {}
      },
    },
    remote: {
      async $mount(contribution) {
        remoteMounts.push(contribution)
        return async () => {}
      },
    },
  }

  try {
    globalThis.require = () => ({ createElement() {} })
    assert.deepEqual(client.inject, ['locale', 'remote', 'slots', 'sessions', 'workspaces', 'layout', 'uiWorkspace'])
    client.apply(ctx)
    await Promise.all(effects)
    assert.equal(registrations[0].namespace, 'dsh-ui-enhancements')
    assert.equal(registrations[0].dictionaries.zh['pin.aria'], '置顶会话“{title}”')
    assert.equal(registrations[0].dictionaries.en['archive.aria'], 'Archive session “{title}”')
    assert.deepEqual(
      remoteMounts[0].descriptors.map(descriptor => descriptor.method),
      ['list', 'setEnabled', 'listArchived', 'resolveArchivedTitles', 'readArchived', 'restore', 'delete', 'info', 'prepare'],
    )
    assert.equal(remoteMounts.length, 1, 'a Remote package must be mounted once')
    const [listDescriptor, setEnabledDescriptor] = remoteMounts[0].descriptors
    assert.equal(listDescriptor.result.mode, 'strict')
    assert.deepEqual(listDescriptor.result.schema.parse({ entries: [] }), { entries: [] })
    assert.throws(() => listDescriptor.result.schema.parse({ entries: 'invalid' }), /entries/)
    for (const parameter of setEnabledDescriptor.parameters) {
      assert.equal(parameter.codec.mode, 'strict')
    }
    assert.equal(setEnabledDescriptor.parameters[0].codec.schema.parse('plugin-entry'), 'plugin-entry')
    assert.throws(() => setEnabledDescriptor.parameters[0].codec.schema.parse(''), /entryId/)
    assert.equal(setEnabledDescriptor.parameters[1].codec.schema.parse(false), false)
    assert.throws(() => setEnabledDescriptor.parameters[1].codec.schema.parse('false'), /enabled/)
    assert.equal(setEnabledDescriptor.result.mode, 'strict')
    assert.deepEqual(
      setEnabledDescriptor.result.schema.parse({ entryId: 'plugin-entry', enabled: false }),
      { entryId: 'plugin-entry', enabled: false },
    )
    assert.throws(
      () => setEnabledDescriptor.result.schema.parse({ entryId: 1, enabled: false }),
      /entryId/,
    )
    assert.deepEqual(serviceLookups.sort(), ['remote.profilePluginToggles', 'remote.projectlessConversations', 'remote.sessionManagement'])
    assert.equal(observed, true)
  } finally {
    globalThis.window = previous.window
    globalThis.document = previous.document
    globalThis.MutationObserver = previous.MutationObserver
    globalThis.require = previous.require
  }
})

test('successful host toggles visibly require an explicit refresh and never reload automatically', async () => {
  const client = await loadClient()
  const { card } = pluginCard()
  let reloads = 0
  card.ownerDocument.defaultView = { location: { reload() { reloads++ } } }
  client.mountPluginToggle(card, { entryId: 'plugin-a-entry', moduleName: 'plugin-a', enabled: true, locked: false },
    key => key, async (entryId, enabled) => ({ entryId, enabled }))
  await card.querySelector('[data-dsh-ui-enhancements-plugin-toggle]').dispatch('click')
  const notice = card.children.find(child => child.getAttribute('role') === 'status')
  assert.ok(notice, 'show browser refresh requirement after host state changes')
  assert.equal(notice.children[0].textContent, 'plugin.refreshRequired')
  assert.equal(reloads, 0, 'keep unsent work intact until user chooses refresh')
  await notice.children[1].dispatch('click')
  assert.equal(reloads, 1)
})
