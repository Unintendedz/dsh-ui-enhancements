// Match DSH's visible membership rules. Expansion and pinned row order are
// presentation choices and must not change a workspace's last activity.
export function workspaceGroupOrder(list, workspaces, archivedSessionIds, orderBy = 'updated') {
  const archived = new Set(archivedSessionIds)
  const accounted = new Set()
  const visible = session => session && session.origin !== 'subagent'
    && !archived.has(session.id) && (!session.blank || session.id === list.current)
  const latest = sessions => sessions.reduce((time, session) =>
    Number.isFinite(session.updatedAt) ? Math.max(time, session.updatedAt) : time, -Infinity)
  const groups = workspaces.map(workspace => {
    const members = []
    for (const id of workspace.sessionIds) {
      accounted.add(id)
      if (visible(list.byId[id])) members.push(list.byId[id])
    }
    const activity = latest(members)
    return { key: workspace.workspaceId, time: Number.isFinite(activity) ? activity : Date.parse(workspace.createdAt) || 0 }
  })
  const loose = list.ids.map(id => list.byId[id]).filter(session => visible(session) && !accounted.has(session.id))
  if (loose.length) groups.push({ key: '', time: latest(loose) })
  if (orderBy === 'updated') groups.sort((a, b) => b.time - a.time)
  return groups.map(group => group.key)
}

export function mapElements(React, value, visit, visitArray = items => items) {
  if (Array.isArray(value)) {
    const next = value.map(child => mapElements(React, child, visit, visitArray))
    return visitArray(next.every((child, index) => child === value[index]) ? value : next)
  }
  if (!React.isValidElement(value)) return value
  const children = mapElements(React, value.props.children, visit, visitArray)
  return visit(children === value.props.children ? value : React.cloneElement(value, { children }))
}

export function projectlessIcon(React) {
  const h = React.createElement
  return h('svg', {
    width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none',
    'aria-hidden': true, 'data-dsh-projectless-icon': true,
  }, h('path', {
    d: 'M3.5 2.5h9a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H7L3 14v-2.5A1.5 1.5 0 0 1 1.5 10V4a1.5 1.5 0 0 1 2-1.5Z',
    stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round',
  }), h('path', { d: 'M5 6h6M5 8.5h4', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round' }))
}

function groupHeader(section) {
  const header = section?.props?.children?.[0]
  return header?.props?.group && typeof header.props.onToggle === 'function' ? header : undefined
}

// DSH 0.1.5 does not expose group/row slots. Adapt only the native render
// functions with fixed hook order, keeping their keyed children, handlers,
// stores, search, menus and drag logic. No DOM moves or synthetic workspaces.
export function createWorkspaceSidebar(React, NativeBrowser, t) {
  const { createElement: h, cloneElement, useMemo } = React
  const treeAdapters = new WeakMap()
  const rowAdapters = new WeakMap()

  function rowAdapter(NativeRow) {
    if (!rowAdapters.has(NativeRow)) rowAdapters.set(NativeRow, function WorkspaceGroupRow(props) {
      const rendered = NativeRow(props)
      // Real workspace rows have a native hover card; preserve its anchor and
      // behavior while decorating the same DOM row as the ungrouped variant.
      const row = rendered.props.role === 'treeitem' ? rendered : rendered.props.anchor
      const projectless = props.group.workspaceId === undefined
      const children = [...row.props.children]
      if (projectless) children[0] = cloneElement(children[0], {}, projectlessIcon(React))
      const decorated = cloneElement(row, {
        className: `${row.props.className} dsh-workspace-group-row${projectless ? ' dsh-projectless-group-row' : ''}`,
        'aria-current': props.group.containsCurrent || undefined,
        ...(projectless ? {
          title: t('projectless.groupHint'),
          'aria-label': t('projectless.label'),
          'aria-description': t('projectless.groupHint'),
        } : {}),
        tabIndex: 0,
        onKeyDown: event => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'Enter' || event.key === ' '
            || (event.key === 'ArrowRight' && !props.group.expanded)
            || (event.key === 'ArrowLeft' && props.group.expanded)) {
            event.preventDefault()
            props.onToggle()
          }
        },
      }, children)
      return row === rendered ? decorated : cloneElement(rendered, { anchor: decorated })
    })
    return rowAdapters.get(NativeRow)
  }

  function treeAdapter(NativeTree) {
    if (!treeAdapters.has(NativeTree)) treeAdapters.set(NativeTree, function OrderedWorkspaceTree(props) {
      const list = props.useSessions(state => state)
      const ranks = useMemo(() => new Map(workspaceGroupOrder(list, props.workspaces, props.archivedSessionIds, props.orderBy)
        .map((key, index) => [key, index])), [list, props.workspaces, props.archivedSessionIds, props.orderBy])
      const tree = NativeTree(props)
      return mapElements(React, tree, element => element, items => {
        if (!items.length || !items.every(item => groupHeader(item))) return items
        const sections = items.map(section => {
          const header = groupHeader(section)
          const { group } = header.props
          const children = [...section.props.children]
          children[0] = h(rowAdapter(header.type), {
            ...header.props, key: header.key,
            ...(group.workspaceId === undefined ? {
              onCreate: () => { props.setGroupExpanded('', true); props.startSession() },
            } : {}),
            // Native workspace drag anchors use Host order. In automatic mode,
            // drag would appear to succeed then snap back to the activity order.
            ...(props.orderBy === 'updated' ? { drag: undefined } : {}),
          })
          return cloneElement(section, { 'data-dsh-workspace-group': group.key }, children)
        })
        return sections.sort((a, b) => (ranks.get(groupHeader(a).props.group.key) ?? Infinity)
          - (ranks.get(groupHeader(b).props.group.key) ?? Infinity))
      })
    })
    return treeAdapters.get(NativeTree)
  }

  return function WorkspaceSidebar(props) {
    const tree = NativeBrowser({
      ...props, t: (key, ...args) => key === 'group.ungrouped' ? t('projectless.label') : props.t(key, ...args),
    })
    return mapElements(React, tree, element => {
      if (typeof element.type !== 'function' || !Array.isArray(element.props.workspaces)
        || typeof element.props.setGroupExpanded !== 'function') return element
      return h(treeAdapter(element.type), { ...element.props, key: element.key })
    })
  }
}
