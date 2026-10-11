// A Session row's "..." menu is a `list` slot declared by the shipped
// WorkspaceBrowser entry (`sidebar.workspaces.session.menu.item`). Pin, rename,
// fork and archive are entries of that same list, so this plugin contributes
// exactly one row of its own there instead of drawing hover buttons beside the
// native ones.
const MENU_SLOT = 'sidebar.workspaces.session.menu.item'
// After the shipped archive row (400), in its own group: a permanent delete
// belongs at the end of the list, behind a separator.
const MENU_ORDER = 500
const DELETE_ICON = 'M3 4h10M6 4V2.5h4V4M4 4l.6 9h6.8l.6-9M6.5 6.5v4M9.5 6.5v4'

export function createDeleteMenuItem(createElement, manager, t) {
  const icon = createElement('svg', {
    width: '14', height: '14', viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
  }, createElement('path', {
    d: DELETE_ICON, stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  }))

  return function DeleteSessionMenuItem(props) {
    const { sessionId, displayTitle, useMenuOpenState } = props
    const label = typeof props.t === 'function' ? props.t : t
    // The slot binds this hook to the open menu so a chosen row closes it. Keep
    // rendering if a future DSH stops supplying it rather than losing the row.
    const setMenuOpen = typeof useMenuOpenState === 'function' ? useMenuOpenState()[1] : () => {}
    return createElement('div', { className: 'dsh-ui-enhancements-menu-row' },
      createElement('div', { className: 'dsh-ui-enhancements-menu-separator', role: 'separator' }),
      createElement('button', {
        type: 'button',
        role: 'menuitem',
        className: 'dsh-ui-enhancements-menu-item',
        onClick: () => {
          setMenuOpen(false)
          manager.confirmDelete({ sessionId, title: displayTitle })
        },
      },
      createElement('span', { className: 'dsh-ui-enhancements-menu-icon' }, icon),
      createElement('span', { className: 'dsh-ui-enhancements-menu-label' }, label('delete.action'))))
  }
}

export function registerSessionDeleteEntry(ctx, manager, t, createElement) {
  const element = createElement ?? require('react').createElement
  return ctx.slots.inject(MENU_SLOT, () => ctx.slots.register({
    name: MENU_SLOT,
    id: 'dsh-ui-enhancements#delete',
    order: MENU_ORDER,
    locale: 'dsh-ui-enhancements',
  }, createDeleteMenuItem(element, manager, t)))
}