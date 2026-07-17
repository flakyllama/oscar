// Focus management for modal surfaces (command palette, calendar popover):
// keep Tab within the container, optionally pull focus in on open, and
// return focus to whatever was focused before — the trigger — on close.

import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  { autoFocus = false }: { autoFocus?: boolean } = {},
) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const restoreTo = document.activeElement as HTMLElement | null;

    // Visible, tabbable descendants in DOM order.
    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);

    if (autoFocus && !node.contains(document.activeElement)) {
      (focusables()[0] ?? node).focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (f.length === 0) {
        e.preventDefault();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !node.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      // Return focus to the trigger if it's still on the page.
      if (restoreTo && restoreTo.isConnected) restoreTo.focus();
    };
  }, [ref, autoFocus]);
}
