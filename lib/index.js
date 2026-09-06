import { isSeq, parseDocument } from 'yaml'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

export const name = 'dsh-ui-enhancements'
export const inject = ['loader']

const SERVICE = 'profilePluginToggles'
const MANAGED_START = '# dsh-ui-enhancements plugin toggles: start'
const MANAGED_END = '# dsh-ui-enhancements plugin toggles: end'

function safePackageSegments(packageName) {
  const segments = packageName.split('/')
  return segments.length <= 2
    && segments.every(segment => segment !== '' && segment !== '.' && segment !== '..')
    ? segments
    : undefined
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function installedBundleVersions(profileDir) {
  const profile = await readJson(join(profileDir, 'package.json'))
  const result = new Map()
  for (const packageName of Object.keys(profile.dependencies ?? {})) {
    const segments = safePackageSegments(packageName)
    if (segments === undefined) continue
    try {
      const manifest = await readJson(join(profileDir, 'node_modules', ...segments, 'package.json'))
      if (typeof manifest.dsh?.bundle?.patch !== 'string') continue
      result.set(packageName, typeof manifest.version === 'string' ? manifest.version : '')
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
  return result
}

function managedBlock(source) {
  const start = source.indexOf(MANAGED_START)
  const end = source.indexOf(MANAGED_END)
  if ((start === -1) !== (end === -1) || (start !== -1 && end < start)) {
    throw new Error('dsh-ui-enhancements plugin toggle block is malformed')
  }
  if (start === -1) return { source, toggles: new Map() }
  if (source.indexOf(MANAGED_START, start + MANAGED_START.length) !== -1
    || source.indexOf(MANAGED_END, end + MANAGED_END.length) !== -1) {
    throw new Error('dsh-ui-enhancements plugin toggle block is duplicated')
  }

  const body = source.slice(start + MANAGED_START.length, end).trim()
  const toggles = new Map()
  if (body !== '') {
    const rows = body.split('\n')
    if (rows.length % 2 !== 0) throw new Error('dsh-ui-enhancements plugin toggle block is malformed')
    for (let index = 0; index < rows.length; index += 2) {
      const id = /^- id: (.+)$/.exec(rows[index])
      const disabled = /^  disabled: (true|false)$/.exec(rows[index + 1])
      if (id === null || disabled === null) {
        throw new Error('dsh-ui-enhancements plugin toggle block is malformed')
      }
      let entryId
      try {
        entryId = JSON.parse(id[1])
      } catch {
        throw new Error('dsh-ui-enhancements plugin toggle block is malformed')
      }
      if (typeof entryId !== 'string' || entryId === '') {
        throw new Error('dsh-ui-enhancements plugin toggle block is malformed')
      }
      toggles.set(entryId, disabled[1] === 'true')
    }
  }
  return {
    source: `${source.slice(0, start).trimEnd()}\n${source.slice(end + MANAGED_END.length).trimStart()}`,
    toggles,
  }
}

function validatedPatch(source) {
  const document = parseDocument(source, {
    uniqueKeys: true,
    customTags: [{
      tag: 'tag:yaml.org,2002:js',
      resolve: value => ({ __jsExpr: value }),
      stringify: item => JSON.stringify(item.value.__jsExpr),
    }],
  })
  if (document.errors.length || document.warnings.length) {
    throw new Error('invalid plugin patch YAML', { cause: document.errors[0] ?? document.warnings[0] })
  }
  const value = document.toJS({ maxAliasCount: 100 })
  if (value !== null && !Array.isArray(value)) throw new Error('plugin patch must be a sequence')
  function validate(entries, patchRows = true) {
    for (const entry of entries) {
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)
        || (entry.id !== undefined && (typeof entry.id !== 'string' || entry.id === ''))
        || (patchRows && entry.id === undefined && !Array.isArray(entry.insert))) throw new Error('invalid plugin patch entry')
      if (entry.name != null && typeof entry.name !== 'string') throw new Error('invalid plugin patch name')
      for (const field of ['disabled', 'group']) {
        if (entry[field] != null && typeof entry[field] !== 'boolean'
          && !(field === 'disabled' && typeof entry[field]?.__jsExpr === 'string')) throw new Error(`invalid plugin patch ${field}`)
      }
      if (entry.insert !== undefined) {
        if (!Array.isArray(entry.insert)) throw new Error('invalid plugin patch insert')
        validate(entry.insert, false)
      }
      if (entry.group && Array.isArray(entry.config)) validate(entry.config, false)
    }
  }
  validate(value ?? [])
  return document
}

function normalizeOutside(source) {
  const document = validatedPatch(source)
  if (!document.directives.docEnd && (!isSeq(document.contents) || (!document.contents.flow && document.contents.items.length > 0))) return source.trimEnd()
  document.directives.docEnd = false
  if (isSeq(document.contents)) {
    document.contents.flow = false
    if (document.contents.items.length === 0) {
      const comments = [document.commentBefore, document.contents.commentBefore, document.contents.comment, document.comment]
      return comments.filter(Boolean).map(comment => comment.split('\n').map(line => `#${line}`).join('\n')).join('\n')
    }
  }
  return document.toString().trimEnd()
}

export function updateManagedToggleSource(source, entryId, enabled) {
  if (typeof entryId !== 'string' || entryId === '') throw new TypeError('entryId must be a non-empty string')
  if (typeof enabled !== 'boolean') throw new TypeError('enabled must be a boolean')
  validatedPatch(source)
  const managed = managedBlock(source)
  managed.toggles.set(entryId, !enabled)
  const rows = [...managed.toggles]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([id, disabled]) => [`- id: ${JSON.stringify(id)}`, `  disabled: ${disabled}`])
  const outside = normalizeOutside(managed.source)
  const output = `${outside}${outside === '' ? '' : '\n\n'}${MANAGED_START}\n${rows.join('\n')}\n${MANAGED_END}\n`
  validatedPatch(output)
  return output
}

export function profileDirFromContext(ctx) {
  const filename = ctx?.fiber?.entry?.parent?.tree?.filename
  if (typeof filename !== 'string' || basename(filename) !== 'cordis.yml') {
    throw new Error('dsh-ui-enhancements could not resolve the DSH profile root')
  }
  return dirname(filename)
}

async function writeTogglePatch(profileDir, entryId, enabled) {
  const path = join(profileDir, 'cordis.patch.yml')
  let source = ''
  let mode
  try {
    source = await readFile(path, 'utf8')
    mode = (await stat(path)).mode
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  const next = updateManagedToggleSource(source, entryId, enabled)
  const temporary = `${path}.${process.pid}.tmp`
  try {
    await writeFile(temporary, next, mode === undefined ? undefined : { mode })
    await rename(temporary, path)
  } catch (error) {
    await unlink(temporary).catch(() => {})
    throw error
  }
}

export class PluginToggleGateway extends TypertRemoteService {
  constructor(ctx, profileDir, entries) {
    super(ctx, SERVICE)
    this.profileDir = profileDir
    this.entries = entries
    this.queue = Promise.resolve()
    for (const initialize of remoteInitializers) initialize.call(this)
  }

  async list() {
    const bundles = await installedBundleVersions(this.profileDir)
    const entries = []
    for (const entry of this.entries()) {
      const moduleName = entry?.options?.name
      if (typeof entry?.id !== 'string' || !bundles.has(moduleName)) continue
      entries.push({
        entryId: entry.id,
        moduleName,
        version: bundles.get(moduleName),
        enabled: !entry.disabled,
        locked: moduleName === name,
      })
    }
    return { entries }
  }

  setEnabled(entryId, enabled) {
    const task = this.queue.then(async () => {
      if (typeof entryId !== 'string' || entryId === '') throw new TypeError('entryId must be a non-empty string')
      if (typeof enabled !== 'boolean') throw new TypeError('enabled must be a boolean')
      const bundles = await installedBundleVersions(this.profileDir)
      const entry = [...this.entries()].find(candidate => candidate?.id === entryId)
      if (entry === undefined || !bundles.has(entry.options?.name)) {
        throw new Error(`${entryId} is not an installed profile plugin`)
      }
      if (entry.options.name === name) throw new Error(`${name} must remain always enabled`)
      const persistentEntryId = entry.options.id
      if (typeof persistentEntryId !== 'string' || persistentEntryId === '') {
        throw new Error(`${entryId} has no persistent profile entry id`)
      }
      const previousEnabled = !entry.disabled
      await writeTogglePatch(this.profileDir, persistentEntryId, enabled)
      try {
        if (typeof entry.update !== 'function') {
          throw new Error(`${entryId} does not support runtime updates`)
        }
        await entry.update({ disabled: !enabled })
      } catch (error) {
        try {
          await writeTogglePatch(this.profileDir, persistentEntryId, previousEnabled)
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            `failed to roll back the ${entryId} plugin toggle`,
          )
        }
        throw error
      }
      return { entryId, enabled }
    })
    this.queue = task.catch(() => {})
    return task
  }
}

const remoteInitializers = []
for (const method of ['list', 'setEnabled']) {
  Remote(method)(PluginToggleGateway.prototype[method], {
    kind: 'method',
    name: method,
    static: false,
    private: false,
    addInitializer(initializer) { remoteInitializers.push(initializer) },
  })
}

export function apply(ctx) {
  new PluginToggleGateway(ctx, profileDirFromContext(ctx), () => ctx.loader.entries())
}
