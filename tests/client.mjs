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

// The menu row renders through React, so these tests drive it with a plain
// element tree instead of a DOM: createElement returns inspectable nodes.
function fakeCreateElement(type, props, ...children) {
  return { type, props: props ?? {}, children }
}

test('the row menu carries one delete entry that closes the menu before asking', async () => {
  const client = await loadClient()
  const requests = []
  const menuState = []
  const t = (key, params = {}) => `${key}:${params.title ?? ''}`
  const component = client.createDeleteMenuItem(
    fakeCreateElement,
    { confirmDelete: target => requests.push(target) },
    t,
  )
  const row = component({
    sessionId: 'session-row',
    displayTitle: 'Row title',
    useMenuOpenState: () => [true, open => menuState.push(open)],
  })
  const [separator, button] = row.children

  assert.equal(row.type, 'div')
  assert.equal(separator.props.role, 'separator')
  assert.equal(button.type, 'button')
  assert.equal(button.props.role, 'menuitem')
  assert.equal(button.props.className, 'dsh-ui-enhancements-menu-item')
  assert.equal(button.children.at(-1).children[0], 'delete.action:')

  button.props.onClick()
  assert.deepEqual(menuState, [false])
  assert.deepEqual(requests, [{ sessionId: 'session-row', title: 'Row title' }])
})

test('the delete entry still renders when the slot omits the menu hook', async () => {
  const client = await loadClient()
  const component = client.createDeleteMenuItem(fakeCreateElement, { confirmDelete() {} }, key => key)
  const row = component({ sessionId: 'session-row', displayTitle: 'Row title' })
  const button = row.children.find(child => child.props.role === 'menuitem')

  assert.equal(typeof button.props.onClick, 'function')
  assert.doesNotThrow(() => button.props.onClick())
})

test('the delete entry registers into the shipped session menu list', async () => {
  const client = await loadClient()
  const injected = []
  const registered = []
  const ctx = {
    slots: {
      inject(key, setup) { injected.push(key); return setup() },
      register(options, component) { registered.push({ options, component }); return () => {} },
    },
  }

  const cleanup = client.registerSessionDeleteEntry(ctx, { confirmDelete() {} }, key => key, fakeCreateElement)

  assert.deepEqual(injected, ['sidebar.workspaces.session.menu.item'])
  assert.deepEqual(registered[0].options, {
    name: 'sidebar.workspaces.session.menu.item',
    id: 'dsh-ui-enhancements#delete',
    order: 500,
    locale: 'dsh-ui-enhancements',
  })
  assert.equal(typeof registered[0].component, 'function')
  cleanup()
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
  assert.match(appended.textContent, /\.dsh-ui-enhancements-menu-item/)
  assert.match(appended.textContent, /\.dsh-ui-enhancements-menu-separator/)
  assert.match(appended.textContent, /var\(--dsw-alias-interactive-bg-hover-danger\)/)
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
  const slotKeys = []
  const slotRegistrations = []
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
    slots: {
      // Only the session menu is mounted here: the other registrations in
      // `apply` need the fuller slot registry the browser provides.
      inject(key, setup) {
        slotKeys.push(key)
        return key === 'sidebar.workspaces.session.menu.item' ? setup() : () => {}
      },
      register(options) { slotRegistrations.push(options); return () => {} },
    },
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
    assert.equal(registrations[0].dictionaries.zh['delete.action'], '立即删除')
    assert.equal(registrations[0].dictionaries.en['delete.action'], 'Delete now')
    assert.ok(slotKeys.includes('sidebar.workspaces.session.menu.item'), 'the delete entry targets the shipped row menu')
    assert.ok(
      slotRegistrations.some(options => options.id === 'dsh-ui-enhancements#delete'),
      'the delete entry is registered while the plugin is applied',
    )
    assert.deepEqual(
      remoteMounts[0].descriptors.map(descriptor => descriptor.method),
      ['list', 'setEnabled', 'listArchived', 'resolveArchivedTitles', 'readArchived', 'restore', 'delete', 'info', 'prepare'],
    )
    assert.equal(remoteMounts.length, 1, 'a Remote package must be mounted once')
    const [listDescriptor, setEnabledDescriptor] = remoteMounts[0].descriptors
    assert.equal(listDescriptor.result.mode, 'strict')
    // DSH 0.2.0 requires a `create()` factory instead of a bare `schema` field.
    assert.equal(typeof listDescriptor.result.create, 'function')
    assert.equal(listDescriptor.result.create(), listDescriptor.result.create(), 'the codec factory memoizes its schema')
    assert.deepEqual(listDescriptor.result.create().parse({ entries: [] }), { entries: [] })
    assert.throws(() => listDescriptor.result.create().parse({ entries: 'invalid' }), /entries/)
    for (const parameter of setEnabledDescriptor.parameters) {
      assert.equal(parameter.codec.mode, 'strict')
    }
    assert.equal(setEnabledDescriptor.parameters[0].codec.create().parse('plugin-entry'), 'plugin-entry')
    assert.throws(() => setEnabledDescriptor.parameters[0].codec.create().parse(''), /entryId/)
    assert.equal(setEnabledDescriptor.parameters[1].codec.create().parse(false), false)
    assert.throws(() => setEnabledDescriptor.parameters[1].codec.create().parse('false'), /enabled/)
    assert.equal(setEnabledDescriptor.result.mode, 'strict')
    assert.deepEqual(
      setEnabledDescriptor.result.create().parse({ entryId: 'plugin-entry', enabled: false }),
      { entryId: 'plugin-entry', enabled: false },
    )
    assert.throws(
      () => setEnabledDescriptor.result.create().parse({ entryId: 1, enabled: false }),
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
