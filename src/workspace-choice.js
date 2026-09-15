import { mapElements, projectlessIcon } from './workspace-sidebar.js'

export const VIRTUAL_WORKSPACE = '::dsh-no-workspace'

// Keep the native picker, directory flow, pending selection, and draft transfer.
// DSH 0.1.5 exposes the picker slot but not its chip or menu item icons.
export function createWorkspaceChoice(React, t) {
  const { createElement: h, cloneElement } = React
  const chips = new WeakMap()
  const flows = new WeakMap()
  function chipAdapter(NativeChip) {
    if (!chips.has(NativeChip)) chips.set(NativeChip, function WorkspaceChoiceChip({ projectless, onClear, ...props }) {
      const button = NativeChip(props)
      const children = [...button.props.children]
      if (projectless) children[0] = projectlessIcon(React)
      return h('span', { className: 'dsh-workspace-choice' },
        cloneElement(button, {}, children),
        onClear && h('button', {
          type: 'button', className: 'dsh-workspace-clear',
          'aria-label': t('projectless.clear'), title: t('projectless.clear'),
          onClick: onClear,
        }, h('svg', { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
          h('path', { d: 'm4 4 8 8M12 4l-8 8', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }))))
    })
    return chips.get(NativeChip)
  }
  return {
    composer(tree, owner) {
      if (!owner) return tree
      return mapElements(React, tree, element => {
        if (typeof element.type !== 'function' || element.props.buttonRef !== owner.anchorRef) return element
        const projectless = owner.selectedId === VIRTUAL_WORKSPACE
        return h(chipAdapter(element.type), {
          ...element.props, key: element.key, projectless,
          onClear: owner.selectedId && !projectless ? () => {
            owner.anchorRef.current?.focus()
            owner.onPick(VIRTUAL_WORKSPACE)
          } : undefined,
        })
      })
    },
    picker(NativePicker) {
      return function WorkspaceChoicePicker(props) {
        const flow = NativePicker(props)
        const NativeFlow = flow.type
        if (!flows.has(NativeFlow)) flows.set(NativeFlow, function WorkspaceChoiceFlow(flowProps) {
          return mapElements(React, NativeFlow(flowProps), element => {
            if (!Array.isArray(element.props.items) || !element.props.items.some(item => item.id === VIRTUAL_WORKSPACE)) return element
            return cloneElement(element, { items: element.props.items.map(item => item.id === VIRTUAL_WORKSPACE
              ? { ...item, icon: projectlessIcon(React) } : item) })
          })
        })
        return h(flows.get(NativeFlow), { ...flow.props, key: flow.key })
      }
    },
  }
}
