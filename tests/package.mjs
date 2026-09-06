import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import * as host from '../lib/index.js'

test('package exposes the Host toggle gateway and browser enhancer with a dedicated YAML parser and external DSH runtime', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')

  assert.equal(host.name, 'dsh-ui-enhancements')
  assert.deepEqual(host.inject, ['loader'])
  assert.equal(typeof host.apply, 'function')
  assert.equal(manifest.main, 'lib/index.js')
  assert.equal(manifest.exports['./client'], './lib/client.js')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.deepEqual(Object.keys(manifest.dependencies), ['yaml'])
  assert.equal(manifest.peerDependencies['@deepseek-ai/dsh-typert-protocol'], '^0.1.1-rc.2')
  assert.match(patch, /name: dsh-ui-enhancements/)
})
