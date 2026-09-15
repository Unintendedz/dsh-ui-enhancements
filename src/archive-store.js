// A mounted page and subsequent visits share one inventory. RPC refreshes keep
// rows visible; row mutations and late reads reconcile by identity.
export function createArchiveStore(api, onChanged) {
  let state = { items: [], loaded: false, loading: false, hydrating: false, error: '', query: '', selectedId: null, preview: null, pending: new Set() }
  const listeners = new Set()
  const removed = new Set()
  const previews = new Map()
  let request, generation = 0, disposed = false
  const publish = patch => {
    if (disposed) return
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  }
  const errorText = error => error instanceof Error ? error.message : String(error)
  const hydrate = async version => {
    const ids = state.items.filter(item => item.titlePending).map(item => item.sessionId)
    if (!ids.length) return
    publish({ hydrating: true })
    try {
      for (let offset = 0; offset < ids.length; offset += 8) {
        if (disposed || version !== generation) return
        const batch = ids.slice(offset, offset + 8).filter(id => !removed.has(id))
        if (!batch.length) continue
        const result = await api.resolveArchivedTitles(batch)
        if (disposed || version !== generation) return
        const titles = new Map(result.items.map(item => [item.sessionId, item]))
        publish({ items: state.items.map(item => titles.get(item.sessionId) ?? item) })
      }
    } catch (error) {
      if (version === generation) publish({ error: errorText(error) })
    } finally {
      if (version === generation) publish({ hydrating: false })
    }
  }
  const load = () => {
    if (request) return request
    const version = ++generation
    publish({ loading: true, error: '', hydrating: false })
    request = (async () => {
      try {
        const result = await api.listArchived()
        if (disposed) return
        const ids = new Set(result.items.map(item => item.sessionId))
        for (const id of removed) if (!ids.has(id)) removed.delete(id)
        const previous = new Map(state.items.map(item => [item.sessionId, item]))
        const items = result.items.filter(item => !removed.has(item.sessionId)).map(item => {
          const known = previous.get(item.sessionId)
          return item.titlePending && item.title === item.sessionId && known?.createdAt === item.createdAt
            ? { ...item, title: known.title } : item
        })
        const selected = items.some(item => item.sessionId === state.selectedId)
        publish({ items, loaded: true, ...(selected ? {} : {selectedId:null,preview:null}) })
        void hydrate(version)
      } catch (error) { publish({ error: errorText(error) }) }
      finally { request = undefined; publish({ loading: false }) }
    })()
    return request
  }
  const mutate = async (id, action) => {
    if (state.pending.has(id)) return
    publish({ pending: new Set([...state.pending, id]), error: '' })
    try {
      const result = await (action === 'delete' ? api.delete(id, true) : api.restore(id))
      removed.add(id)
      previews.delete(id)
      publish({ items: state.items.filter(item => item.sessionId !== id), ...(state.selectedId === id ? {selectedId:null,preview:null} : {}) })
      // The native removal event updates session state. Never refetch all sessions.
      await onChanged(result)
      return result
    } finally {
      const pending = new Set(state.pending); pending.delete(id); publish({ pending })
    }
  }
  const select = async id => {
    if (id === null) { publish({selectedId:null,preview:null}); return }
    publish({ selectedId: id, preview: previews.get(id) ?? { loading: true } })
    if (previews.has(id)) return
    try {
      const result = await api.readArchived(id)
      if (removed.has(id) || disposed) return
      // Keep only the most recent previews; histories can be large.
      if (previews.size >= 3) previews.delete(previews.keys().next().value)
      previews.set(id, result)
      if (state.selectedId === id) publish({ preview: result })
    } catch (error) {
      if (state.selectedId === id) publish({ preview: {error:errorText(error)} })
    }
  }
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    setQuery(query) { publish({query}) },
    load, select,
    restore: id => mutate(id, 'restore'), remove: id => mutate(id, 'delete'),
    dispose() { disposed = true; generation++; listeners.clear(); previews.clear() },
  }
}
