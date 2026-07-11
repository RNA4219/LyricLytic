import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AffectMetricsPanel from '../components/AffectMetricsPanel';
import DiffViewer from '../components/DiffViewer';
import { LanguageProvider } from '../lib/LanguageContext';
import { affectGoldenLyrics } from './fixtures/affectGoldenLyrics';

vi.mock('@monaco-editor/react', () => ({
  DiffEditor: ({ original, modified }: { original: string; modified: string }) => (
    <div data-testid="diff-editor">
      <span>{original}</span>
      <span>{modified}</span>
    </div>
  ),
}));

const lowChorusSections = [
  {
    id: 'verse-1',
    type: 'Verse',
    displayName: 'Verse',
    sortOrder: 0,
    bodyText: '怖くて不安で震える鼓動が止まらない！\n怒りと涙と希望が胸の奥でぶつかり続ける！',
  },
  {
    id: 'chorus-1',
    type: 'Chorus',
    displayName: 'Chorus',
    sortOrder: 1,
    bodyText: '君を呼ぶ\n空を見る',
  },
];

describe('Affect insight UI', () => {
  it('renders section metrics, wave, evidence, and production notes', () => {
    render(
      <LanguageProvider>
        <AffectMetricsPanel text={affectGoldenLyrics.lowChorusDensity} sections={lowChorusSections} />
      </LanguageProvider>,
    );

    expect(screen.getByText('感情メトリクス')).toBeInTheDocument();
    expect(screen.getByText('セクション別')).toBeInTheDocument();
    expect(screen.getByText('感情波形')).toBeInTheDocument();
    expect(screen.getByText('根拠')).toBeInTheDocument();
    expect(screen.getByText('制作メモ')).toBeInTheDocument();
    expect(screen.getByText(/Chorus の密度が Verse より低めです/)).toBeInTheDocument();
  });

  it('renders affect deltas inside the version diff viewer', () => {
    render(
      <LanguageProvider>
        <DiffViewer
          versions={[
            {
              lyric_version_id: 'dark',
              project_id: 'project-1',
              snapshot_name: 'Dark',
              body_text: affectGoldenLyrics.dark,
              created_at: '2026-07-03T00:00:00.000Z',
            },
            {
              lyric_version_id: 'bright',
              project_id: 'project-1',
              snapshot_name: 'Bright',
              body_text: affectGoldenLyrics.bright,
              created_at: '2026-07-02T00:00:00.000Z',
            },
          ]}
          onClose={() => {}}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText('感情差分')).toBeInTheDocument();
    expect(screen.getByText('変化メモ')).toBeInTheDocument();
    expect(screen.getByText(/明るさが下がりました/)).toBeInTheDocument();
  });

  it('renders the empty metrics panel in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <AffectMetricsPanel text="" />
      </LanguageProvider>,
    );
    expect(screen.getByText('Affect Metrics')).toBeInTheDocument();
    expect(screen.getByText(/Lyric lines:/)).toBeInTheDocument();
  });

  it('switches diff fields, swaps sides, and restores either version', () => {
    const onRestore = vi.fn();
    render(
      <LanguageProvider>
        <DiffViewer
          versions={[
            { lyric_version_id: 'left', project_id: 'p', snapshot_name: 'Left', body_text: 'L1', style_text: 'left style', vocal_text: 'left vocal', note: 'left note', created_at: '2026-07-01T00:00:00.000Z' },
            { lyric_version_id: 'right', project_id: 'p', snapshot_name: 'Right', body_text: 'R1\nR2', style_text: 'right style', vocal_text: 'right vocal', created_at: '2026-07-02T00:00:00.000Z' },
          ]}
          onClose={vi.fn()}
          onRestore={onRestore}
        />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Style' }));
    expect(screen.getByTestId('diff-editor')).toHaveTextContent('left style');
    fireEvent.click(screen.getByRole('tab', { name: 'Vocal' }));
    expect(screen.getByTestId('diff-editor')).toHaveTextContent('right vocal');
    fireEvent.click(screen.getByTitle('Swap Sides'));
    fireEvent.click(screen.getByRole('button', { name: 'Restore from Left' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restore from Right' }));
    expect(onRestore).toHaveBeenCalledTimes(2);
  });

  it('shows the diff placeholder when two versions are not selected', () => {
    const onClose = vi.fn();
    render(
      <LanguageProvider>
        <DiffViewer versions={[]} onClose={onClose} />
      </LanguageProvider>,
    );
    expect(screen.getByText('Select two versions to compare.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
