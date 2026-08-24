import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { remoteMethods } from '@deepseek-ai/dsh-typert-protocol'

import {
  PluginToggleGateway,
  profileDirFromContext,
  updateManagedToggleSource,
} from '../lib/index.js'

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

async function profileFixture() {
  const profileDir = await mkdtemp(join(tmpdir(), 'dsh-ui-enhancements-toggle-'))
  await writeJson(join(profileDir, 'package.json'), {
    name: 'dsh-profile-test',
    private: true,
    dependencies: {
      'dsh-ui-enhancements': 'file:/plugin-manager',
      'plugin-a': 'file:/plugin-a',
      'plain-library': '1.0.0',
    },
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'dsh-ui-enhancements', 'plugin-a'] } },
  })
  for (const [name, manifest] of Object.entries({
    'dsh-ui-enhancements': {
      name: 'dsh-ui-enhancements', version: '0.2.0', dsh: { bundle: { patch: './cordis.patch.yml' } },
    },
    'plugin-a': {
      name: 'plugin-a', version: '1.2.3', dsh: { bundle: { patch: './cordis.patch.yml' } },
    },
    'plain-library': { name: 'plain-library', version: '1.0.0' },
  })) {
    const directory = join(profileDir, 'node_modules', name)
    await mkdir(directory, { recursive: true })
    await writeJson(join(directory, 'package.json'), manifest)
  }
  await writeFile(join(profileDir, 'cordis.patch.yml'), '# user preference\n- id: existing\n  disabled: true\n')
  return profileDir
}

test('profile directory is resolved from the isolated root include', () => {
  assert.equal(profileDirFromContext({
    fiber: { entry: { parent: { tree: { filename: '/tmp/dsh-test/profiles/toggle/cordis.yml' } } } },
  }), '/tmp/dsh-test/profiles/toggle')
  assert.throws(() => profileDirFromContext({}), /profile root/)
})

test('managed toggle patches preserve user YAML and replace an empty list document', () => {
  const initial = '# user patch layer\n[]\n'
  const disabled = updateManagedToggleSource(initial, 'plugin-a', false)

  assert.match(disabled, /^# user patch layer/m)
  assert.doesNotMatch(disabled, /^\[\]$/m)
  assert.match(disabled, /- id: "plugin-a"\n  disabled: true/)

  const enabled = updateManagedToggleSource(disabled, 'plugin-a', true)
  assert.equal((enabled.match(/- id: "plugin-a"/g) ?? []).length, 1)
  assert.match(enabled, /- id: "plugin-a"\n  disabled: false/)
})

test('gateway is a discoverable Cordis Remote service', async () => {
  const profileDir = await profileFixture()
  const ctx = new Context()
  const gateway = new PluginToggleGateway(ctx, profileDir, () => [])

  assert.equal(ctx.reflect.props.profilePluginToggles?.type, 'service')
  assert.ok(ctx.get('profilePluginToggles'))
  assert.deepEqual(remoteMethods(gateway).map(method => method.method), ['list', 'setEnabled'])
})

test('gateway lists only installed profile plugins and locks its own entry', async () => {
  const profileDir = await profileFixture()
  const entries = [
    { id: 'core', options: { name: '@deepseek-ai/dsh-settings' }, disabled: false },
    {
      id: 'include:dsh-ui-enhancements',
      options: { id: 'dsh-ui-enhancements', name: 'dsh-ui-enhancements' },
      disabled: false,
    },
    {
      id: 'include:plugin-a-entry',
      options: { id: 'plugin-a-entry', name: 'plugin-a' },
      disabled: false,
    },
    { id: 'library-entry', options: { name: 'plain-library' }, disabled: false },
  ]
  const gateway = new PluginToggleGateway(new Context(), profileDir, () => entries)

  assert.deepEqual(await gateway.list(), {
    entries: [
      {
        entryId: 'include:dsh-ui-enhancements',
        moduleName: 'dsh-ui-enhancements',
        version: '0.2.0',
        enabled: true,
        locked: true,
      },
      {
        entryId: 'include:plugin-a-entry',
        moduleName: 'plugin-a',
        version: '1.2.3',
        enabled: true,
        locked: false,
      },
    ],
  })
})

test('gateway persists a real Loader disable patch and rejects unsafe targets', async () => {
  const profileDir = await profileFixture()
  const updates = []
  const entries = [
    {
      id: 'include:dsh-ui-enhancements',
      options: { id: 'dsh-ui-enhancements', name: 'dsh-ui-enhancements' },
      disabled: false,
    },
    {
      id: 'include:plugin-a-entry',
      options: { id: 'plugin-a-entry', name: 'plugin-a' },
      disabled: false,
      async update(options) {
        updates.push(options)
        this.disabled = options.disabled
      },
    },
    { id: 'core', options: { name: '@deepseek-ai/dsh-settings' }, disabled: false },
  ]
  const gateway = new PluginToggleGateway(new Context(), profileDir, () => entries)

  assert.deepEqual(await gateway.setEnabled('include:plugin-a-entry', false), {
    entryId: 'include:plugin-a-entry',
    enabled: false,
  })
  const source = await readFile(join(profileDir, 'cordis.patch.yml'), 'utf8')
  assert.match(source, /# user preference/)
  assert.match(source, /- id: existing\n  disabled: true/)
  assert.match(source, /- id: "plugin-a-entry"\n  disabled: true/)
  assert.doesNotMatch(source, /- id: "include:plugin-a-entry"/)
  assert.deepEqual(updates, [{ disabled: true }])
  assert.equal(entries[1].disabled, true)

  await assert.rejects(gateway.setEnabled('include:dsh-ui-enhancements', false), /always enabled/)
  await assert.rejects(gateway.setEnabled('core', false), /not an installed profile plugin/)
  await assert.rejects(gateway.setEnabled('include:plugin-a-entry', 'false'), /boolean/)
})

test('runtime update failure restores the previous persistent state', async () => {
  const profileDir = await profileFixture()
  const entry = {
    id: 'include:plugin-a-entry',
    options: { id: 'plugin-a-entry', name: 'plugin-a' },
    disabled: false,
    async update() { throw new Error('dispose failed') },
  }
  const gateway = new PluginToggleGateway(new Context(), profileDir, () => [entry])

  await assert.rejects(gateway.setEnabled('include:plugin-a-entry', false), /dispose failed/)
  const source = await readFile(join(profileDir, 'cordis.patch.yml'), 'utf8')
  assert.match(source, /- id: "plugin-a-entry"\n  disabled: false/)
})
