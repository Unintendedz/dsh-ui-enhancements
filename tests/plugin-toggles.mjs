import assert from 'node:assert/strict'
import { parse } from 'yaml'
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, after } from 'node:test'
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

const fixturePaths = []
after(async () => {
  await Promise.all(fixturePaths.map(path => rm(path, { recursive: true, force: true })))
})

async function profileFixture() {
  const profileDir = await mkdtemp(join(tmpdir(), 'dsh-ui-enhancements-toggle-'))
  fixturePaths.push(profileDir)
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

for (const source of ['[] # keep empty comment\n', '[{id: existing, disabled: false}] # keep flow comment\n', '---\n- id: existing # keep item comment\n  disabled: false\n...\n']) {
  test(`toggle produces a valid sequence and preserves comments for ${JSON.stringify(source)}`, () => {
    const output = updateManagedToggleSource(source, 'plugin-a', false)
    assert.deepEqual(parse(output), source.includes('existing')
      ? [{ id: 'existing', disabled: false }, { id: 'plugin-a', disabled: true }]
      : [{ id: 'plugin-a', disabled: true }])
    assert.match(output, /keep .* comment/)
    assert.equal(updateManagedToggleSource(output, 'plugin-a', false), output)
    assert.equal(parse(updateManagedToggleSource(output, 'plugin-a', true)).at(-1).disabled, false)
  })
}
for (const source of ['[broken', 'settings: true\n', '- id: 123\n', '- id: existing\n  disabled: nope\n', '- id: x\n  id: y\n']) {
  test(`invalid patch is rejected without changing disk or runtime: ${JSON.stringify(source)}`, async () => {
    const profileDir = await profileFixture()
    const path = join(profileDir, 'cordis.patch.yml')
    await writeFile(path, source)
    let updated = false
    const entry = { id: 'plugin-a', options: { id: 'plugin-a', name: 'plugin-a' }, disabled: false,
      async update() { updated = true } }
    const gateway = new PluginToggleGateway(new Context(), profileDir, () => [entry])
    await assert.rejects(gateway.setEnabled('plugin-a', false))
    assert.equal(await readFile(path, 'utf8'), source)
    assert.equal(updated, false)
  })
}

test('preserves DSH expression tags and insert-only patches without executing expressions', () => {
  const source = '- insert:\n  - id: added\n    name: plugin-a\n- id: existing\n  disabled: !!js false # expression comment\n'
  const output = updateManagedToggleSource(source, 'plugin-a', false)
  assert.ok(output.startsWith(source))
  assert.match(output, /expression comment/)
})

for (const source of [
  '- insert:\n  - name: plugin-a # generated id\n',
  '- id: group-a\n  group: true\n  config:\n  - name: plugin-a # generated id\n',
]) {
  test(`ordinary entries can omit loader-generated IDs: ${JSON.stringify(source)}`, () => {
    const output = updateManagedToggleSource(source, 'plugin-b', false)
    assert.ok(output.startsWith(source))
    assert.deepEqual(parse(output), [...parse(source), { id: 'plugin-b', disabled: true }])
    assert.equal(updateManagedToggleSource(output, 'plugin-b', false), output)
  })
}
