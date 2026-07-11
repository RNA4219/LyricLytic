import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../lib/LanguageContext';
import WorkflowGuide from '../pages/editor/WorkflowGuide';

function renderGuide(overrides: Partial<React.ComponentProps<typeof WorkflowGuide>> = {}) {
  const callbacks = {
    onUseSample: vi.fn(),
    onFocusEditor: vi.fn(),
    onRevealAnalysis: vi.fn(),
    onExport: vi.fn(),
  };
  const result = render(
    <LanguageProvider>
      <WorkflowGuide hasLyrics={false} canUseSample {...callbacks} {...overrides} />
    </LanguageProvider>,
  );
  return { ...result, callbacks };
}

describe('WorkflowGuide', () => {
  it('offers a sample or a blank editor as the first action', () => {
    const { callbacks } = renderGuide();

    fireEvent.click(screen.getByRole('button', { name: 'サンプルを入れる' }));
    fireEvent.click(screen.getByRole('button', { name: '書き始める' }));

    expect(callbacks.onUseSample).toHaveBeenCalledOnce();
    expect(callbacks.onFocusEditor).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: '分析を見つける' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '書き出す' })).toBeDisabled();
  });

  it('unlocks analysis and export once lyrics exist and records both choices in the guide', () => {
    const { rerender, callbacks } = renderGuide({ hasLyrics: true });

    fireEvent.click(screen.getByRole('button', { name: '分析を見つける' }));
    fireEvent.click(screen.getByRole('button', { name: '書き出す' }));

    expect(callbacks.onRevealAnalysis).toHaveBeenCalledOnce();
    expect(callbacks.onExport).toHaveBeenCalledOnce();
    expect(screen.getAllByRole('listitem')[1]).toHaveClass('is-complete');
    expect(screen.getAllByRole('listitem')[2]).toHaveClass('is-complete');

    rerender(
      <LanguageProvider>
        <WorkflowGuide hasLyrics canUseSample={false} {...callbacks} />
      </LanguageProvider>,
    );
    expect(screen.queryByRole('button', { name: 'サンプルを入れる' })).toBeNull();
  });

  it('links to the explicit feedback issue without sending lyric content', () => {
    renderGuide();

    const feedback = screen.getByRole('link', { name: 'この体験を改善するためのフィードバックを送る' });
    expect(feedback).toHaveAttribute('href', expect.stringContaining('first-session-feedback.yml'));
    expect(feedback).toHaveAttribute('target', '_blank');
  });
});
