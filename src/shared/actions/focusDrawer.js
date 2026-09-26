export default function focusDrawer(node) {
  const previous = document.activeElement;
  node.focus();
  const trap = (event) => {
    if (event.key !== 'Tab') return;
    const items = node.querySelectorAll(
      'button, a, input, textarea, select, [tabindex="0"]',
    );
    const first = items[0],
      last = items[items.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === node)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  node.addEventListener('keydown', trap);
  const old = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return {
    destroy() {
      node.removeEventListener('keydown', trap);
      document.body.style.overflow = old;
      previous?.focus();
    },
  };
}
