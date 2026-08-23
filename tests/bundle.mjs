import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'

test('built browser artifact registers the standalone DSH client plugin', async () => {
  const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  let registration
  vm.runInNewContext(source, {
    window: { __ModuleLoader__: { load(value) { registration = value } } },
    console,
    setTimeout,
    clearTimeout,
  })

  assert.equal(registration.id, 'dsh-ui-enhancements')
  const plugin = registration.factory(() => { throw new Error('unexpected browser dependency') })
  assert.equal(typeof plugin.apply, 'function')
  assert.deepEqual(Array.from(plugin.inject), ['locale'])
})
