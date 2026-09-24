import { useEffect, useRef } from 'react';

export default function useDialogFocus(open) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      const rememberFocus = (event) => {
        if (!event.target.closest('[role="dialog"]')) triggerRef.current = event.target;
      };
      const rememberPointer = (event) => {
        if (event.target.closest('[role="dialog"]')) return;
        const control = event.target.closest('button, a[href], input, textarea, select, [tabindex="0"]');
        if (control) triggerRef.current = control;
      };
      document.addEventListener('focusin', rememberFocus);
      document.addEventListener('pointerdown', rememberPointer, true);
      return () => {
        document.removeEventListener('focusin', rememberFocus);
        document.removeEventListener('pointerdown', rememberPointer, true);
      };
    }

    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    const focusable = () => [...(dialog?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]',
    ) ?? [])].filter((element) => element.getClientRects().length);

    if (!dialog?.contains(document.activeElement)) focusable()[0]?.focus();

    function containFocus(event) {
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      const outside = !dialog?.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outside)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || outside)) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', containFocus);
    return () => {
      document.removeEventListener('keydown', containFocus);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  return dialogRef;
}
