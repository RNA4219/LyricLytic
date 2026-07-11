import { type ReactNode, useEffect, useId, useRef } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Modal({
  title,
  onClose,
  children,
  className = '',
  overlayClassName = 'dialog-overlay',
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE);
    (focusable?.[0] ?? dialog)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(item => !item.hasAttribute('disabled'));
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className={overlayClassName}>
      <div
        ref={dialogRef}
        className={`dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h3 id={titleId}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
