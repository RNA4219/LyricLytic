import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Modal from '../components/Modal';

describe('Modal accessibility', () => {
  it('sets dialog semantics, restores focus, and closes on Escape', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const { unmount } = render(
      <Modal title="Confirm" onClose={onClose}>
        <button type="button">First</button>
        <button type="button">Last</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Confirm' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'First' }));

    const last = screen.getByRole('button', { name: 'Last' });
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'First' }));
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('focuses the dialog and traps Tab when there are no controls', () => {
    render(<Modal title="Info" onClose={vi.fn()}><p>Text</p></Modal>);
    const dialog = screen.getByRole('dialog', { name: 'Info' });
    expect(document.activeElement).toBe(dialog);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(dialog);
  });
});
