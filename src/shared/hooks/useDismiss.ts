import { useEffect, type RefObject } from 'react'

type Options = {
  /** The open panel; a press inside it does not close it. */
  panelRef: RefObject<HTMLElement | null>
  /** Selector for the control that opens the panel: a press on it is left to its own toggle, and focus returns to it on Escape. */
  trigger: string
  /** A role="menu" panel: focus its checked item (else the first) on open, move with ArrowUp/ArrowDown, Home and End. */
  menu?: boolean
}

const ITEM = ':is([role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]):not([disabled])'

/** Closes a popup on a press outside it or on Escape (focus back on its trigger), with menu keys. */
export function useDismiss(open: boolean, close: () => void, { panelRef, trigger, menu = false }: Options): void {
  useEffect(() => {
    if (!open) {
      return
    }
    const items = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(ITEM) ?? [])
    if (menu) {
      const list = items()
      ;(list.find((item) => item.getAttribute('aria-checked') === 'true') ?? list[0])?.focus()
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) {
        return
      }
      if (target instanceof Element && target.closest(trigger)) {
        return
      }
      close()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        document.querySelector<HTMLElement>(trigger)?.focus()
        return
      }
      if (!menu || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        return
      }
      const list = items()
      if (list.length === 0) {
        return
      }
      event.preventDefault()
      const at = list.indexOf(document.activeElement as HTMLElement)
      const next =
        event.key === 'Home' ? 0
        : event.key === 'End' ? list.length - 1
        : event.key === 'ArrowDown' ? (at + 1) % list.length
        : (at - 1 + list.length) % list.length
      list[next]!.focus()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close, panelRef, trigger, menu])
}
