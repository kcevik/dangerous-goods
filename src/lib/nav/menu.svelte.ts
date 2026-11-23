/**
 * Open/close state of a burger menu. The component only wires events to
 * these methods, so every rule here is testable without mounting.
 */
export class MenuState {
  open = $state(false)

  /** German label of the burger button for the current state. */
  readonly buttonLabel = $derived(this.open ? 'Menü schließen' : 'Menü öffnen')

  toggle(): void {
    this.open = !this.open
  }

  close(): void {
    this.open = false
  }

  /**
   * Escape closes an open menu. Returns true when it did, so the caller can
   * move focus back to the burger button.
   */
  handleKeydown(event: Pick<KeyboardEvent, 'key'>): boolean {
    if (!this.open || event.key !== 'Escape') return false
    this.close()
    return true
  }

  /**
   * A pointer press outside the menu root (burger + panel) closes it.
   * Presses inside are left alone — the button toggles on its own.
   */
  handleOutsidePress(target: EventTarget | null, root: Element | undefined): void {
    if (!this.open || !root) return
    if (target instanceof Node && root.contains(target)) return
    this.close()
  }

  /** A click on a link inside the panel closes the menu (in-page anchors don't navigate). */
  handlePanelClick(target: EventTarget | null): void {
    if (!this.open) return
    if (target instanceof Element && target.closest('a')) this.close()
  }
}
