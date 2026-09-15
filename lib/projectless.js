import { lstat, mkdir, realpath } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join } from 'node:path'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function privateDirectory(path) {
  try { await mkdir(path, { mode: 0o700 }) }
  catch (error) { if (error.code !== 'EEXIST') throw error }
  const entry = await lstat(path)
  if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error('Managed conversation storage must be a real directory, not a symlink')
  return realpath(path)
}

export function createProjectlessStorage(root) {
  if (!isAbsolute(root)) throw new Error('Managed conversation storage must be absolute')
  return {
    info: async () => ({ root: join(await realpath(dirname(root)), basename(root)) }),
    async prepare(requestId) {
      if (typeof requestId !== 'string' || !uuid.test(requestId)) throw new Error('A UUID v4 requestId is required')
      const canonicalRoot = await privateDirectory(root)
      const sessionId = `session-projectless-${requestId.toLowerCase()}`
      const cwd = await privateDirectory(join(canonicalRoot, sessionId))
      return { sessionId, cwd }
    },
  }
}

export class ProjectlessGateway extends TypertRemoteService {
  constructor(ctx, root) {
    super(ctx, 'projectlessConversations')
    this.storage = createProjectlessStorage(root)
    for (const initialize of initializers) initialize.call(this)
  }
  info() { return this.storage.info() }
  prepare(requestId) { return this.storage.prepare(requestId) }
}
const initializers = []
for (const method of ['info', 'prepare']) Remote(method)(ProjectlessGateway.prototype[method], {
  kind: 'method', name: method, static: false, private: false,
  addInitializer(initializer) { initializers.push(initializer) },
})
