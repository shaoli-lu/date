/**
 * Print utility — marks a specific DOM element for printing, triggers
 * window.print(), then cleans up.  Everything outside the target element
 * is hidden by the @media print rules in globals.css that key off
 * `[data-print-active]` on the <html> element and `[data-print-target]`
 * on the content element.
 */
export function printElement(el: HTMLElement | null) {
  if (!el) {
    window.print();
    return;
  }

  // Mark what should be printed
  document.documentElement.setAttribute('data-print-active', 'true');
  el.setAttribute('data-print-target', 'true');

  window.print();

  // Clean up after the print dialog closes (sync in most browsers)
  document.documentElement.removeAttribute('data-print-active');
  el.removeAttribute('data-print-target');
}
