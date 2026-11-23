/**
 * jsdom has <dialog> but no showModal()/close(). This minimal stand-in toggles `open`
 * and fires `close` like a browser does; focus trapping and Escape are browser-checked.
 */
export function polyfillDialog(): void {
  const proto = HTMLDialogElement.prototype
  if (typeof proto.showModal === 'function') return
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  proto.close = function (this: HTMLDialogElement) {
    if (!this.open) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
