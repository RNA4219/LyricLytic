import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../lib/LanguageContext';
import Home from '../pages/Home';

const mockNavigate = vi.fn();
const api = vi.hoisted(() => ({
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  getDraftSections: vi.fn(),
  getProjects: vi.fn(),
  getStyleProfile: vi.fn(),
  getWorkingDraft: vi.fn(),
  saveDraft: vi.fn(),
  updateProject: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../lib/api', () => api);
vi.mock('../components/TrashPanel', () => ({
  default: ({ onClose }: { onClose: () => void }) => <button type="button" onClick={onClose}>Trash mock</button>,
}));

describe('Home first session', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    api.getProjects.mockResolvedValue([]);
    api.createProject.mockResolvedValue({ project_id: 'starter-project', title: 'はじまりのサンプル' });
    api.saveDraft.mockResolvedValue(undefined);
  });

  it('creates and persists the sample project before opening the editor', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <Home />
        </LanguageProvider>
      </BrowserRouter>,
    );

    const openSample = await screen.findByRole('button', { name: 'サンプル曲を開く' });
    fireEvent.click(openSample);

    await waitFor(() => expect(api.createProject).toHaveBeenCalledWith({ title: 'はじまりのサンプル' }));
    await waitFor(() => expect(api.saveDraft).toHaveBeenCalledWith(expect.objectContaining({
      project_id: 'starter-project',
      bpm: 124,
      style_text: expect.stringContaining('synth pop'),
      sections: expect.arrayContaining([
        expect.objectContaining({ display_name: 'Chorus', body_text: expect.stringContaining('明日へ飛び出せ') }),
      ]),
    })));
    expect(mockNavigate).toHaveBeenCalledWith('/project/starter-project');
  });

  it('keeps a deliberate blank-project path beside the sample', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <Home />
        </LanguageProvider>
      </BrowserRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'まっさらな歌詞を書く' }));
    expect(screen.getByPlaceholderText('プロジェクト名')).toBeVisible();
  });
});

describe('Home project management', () => {
  const project = {
    project_id: 'project-1',
    title: '夜明けの歌',
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    api.getProjects.mockReset();
    api.createProject.mockReset();
    api.deleteProject.mockReset();
    api.getDraftSections.mockReset();
    api.getStyleProfile.mockReset();
    api.getWorkingDraft.mockReset();
    api.saveDraft.mockReset();
    api.updateProject.mockReset();
    api.createProject.mockResolvedValue({ project_id: 'new-project', title: '新規プロジェクト' });
    api.deleteProject.mockResolvedValue(undefined);
    api.getStyleProfile.mockResolvedValue(null);
    api.getWorkingDraft.mockResolvedValue(null);
    api.getDraftSections.mockResolvedValue([]);
    api.updateProject.mockResolvedValue({ ...project, title: '夜明けの改稿' });
  });

  function renderHome() {
    return render(
      <BrowserRouter>
        <LanguageProvider>
          <Home />
        </LanguageProvider>
      </BrowserRouter>,
    );
  }

  it('loads a saved project, shows its lyric preview, and opens it', async () => {
    api.getProjects.mockResolvedValue([project]);
    api.getStyleProfile.mockResolvedValue({ project_id: project.project_id, memo: 'bright synth pop' });
    api.getWorkingDraft.mockResolvedValue({
      working_draft_id: 'draft-1',
      project_id: project.project_id,
      latest_body_text: '[Verse]\n朝の光',
    });
    api.getDraftSections.mockResolvedValue([
      { draft_section_id: 'section-1', display_name: 'Verse', body_text: '朝の光' },
    ]);

    renderHome();

    expect(await screen.findByText('夜明けの歌')).toBeVisible();
    expect(screen.getByText(/朝の光/)).toBeVisible();
    fireEvent.click(screen.getByText('夜明けの歌'));
    expect(mockNavigate).toHaveBeenCalledWith('/project/project-1');
  });

  it('renames and deletes an existing project through explicit controls', async () => {
    api.getProjects.mockResolvedValue([project]);
    renderHome();
    await screen.findByText('夜明けの歌');

    fireEvent.click(screen.getByTitle('タイトルを編集'));
    const titleInput = screen.getByDisplayValue('夜明けの歌');
    fireEvent.change(titleInput, { target: { value: '夜明けの改稿' } });
    fireEvent.blur(titleInput);
    await waitFor(() => expect(api.updateProject).toHaveBeenCalledWith('project-1', { title: '夜明けの改稿' }));

    fireEvent.click(screen.getByTitle('プロジェクトを削除'));
    expect(screen.getByText('このプロジェクトを削除しますか？削除済みアイテムから復元できます。')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '削除' }));
    await waitFor(() => expect(api.deleteProject).toHaveBeenCalledWith('project-1'));
  });

  it('creates a named blank project and reports a project-list load failure', async () => {
    api.getProjects.mockResolvedValue([]);
    renderHome();

    fireEvent.click(screen.getByText('新規プロジェクト').closest('button')!);
    fireEvent.change(screen.getByPlaceholderText('プロジェクト名'), { target: { value: '新しい歌' } });
    fireEvent.click(screen.getByRole('button', { name: '作成' }));
    await waitFor(() => expect(api.createProject).toHaveBeenCalledWith({ title: '新しい歌' }));
    expect(mockNavigate).toHaveBeenCalledWith('/project/new-project');
  });

  it('shows a localized error when the project list cannot load', async () => {
    api.getProjects.mockRejectedValue(new Error('database unavailable'));
    renderHome();

    expect(await screen.findByText('プロジェクトの読み込みに失敗しました')).toBeVisible();
  });
});
describe('Home first-session edge cases', () => {
  const project = {
    project_id: 'edge-project',
    title: '境界の歌',
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    api.getProjects.mockReset();
    api.createProject.mockReset();
    api.deleteProject.mockReset();
    api.getDraftSections.mockReset();
    api.getStyleProfile.mockReset();
    api.getWorkingDraft.mockReset();
    api.saveDraft.mockReset();
    api.updateProject.mockReset();
    api.getStyleProfile.mockResolvedValue(null);
    api.getWorkingDraft.mockResolvedValue(null);
    api.getDraftSections.mockResolvedValue([]);
  });

  function renderHome() {
    return render(
      <BrowserRouter>
        <LanguageProvider>
          <Home />
        </LanguageProvider>
      </BrowserRouter>,
    );
  }

  it('keeps errors local when sample or blank project creation fails', async () => {
    api.getProjects.mockResolvedValue([]);
    api.createProject.mockRejectedValue(new Error('write failed'));
    renderHome();

    fireEvent.click(await screen.findByRole('button', { name: 'サンプル曲を開く' }));
    expect(await screen.findByText('サンプルプロジェクトの作成に失敗しました')).toBeVisible();

    fireEvent.click(screen.getByText('新規プロジェクト').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: '作成' }));
    expect(await screen.findByText('プロジェクトの作成に失敗しました')).toBeVisible();
  });

  it('supports empty-title cancellation, Escape, and error recovery while editing a saved project', async () => {
    api.getProjects.mockResolvedValue([project]);
    api.updateProject.mockRejectedValue(new Error('write failed'));
    renderHome();
    await screen.findByText('境界の歌');

    fireEvent.click(screen.getByTitle('タイトルを編集'));
    const emptyInput = screen.getByDisplayValue('境界の歌');
    fireEvent.change(emptyInput, { target: { value: '   ' } });
    fireEvent.blur(emptyInput);
    expect(api.updateProject).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('タイトルを編集'));
    const escapeInput = screen.getByDisplayValue('境界の歌');
    fireEvent.keyDown(escapeInput, { key: 'Escape' });
    expect(screen.queryByDisplayValue('境界の歌')).toBeNull();

    fireEvent.click(screen.getByTitle('タイトルを編集'));
    const failingInput = screen.getByDisplayValue('境界の歌');
    fireEvent.change(failingInput, { target: { value: '失敗する改題' } });
    fireEvent.keyDown(failingInput, { key: 'Enter' });
    expect(await screen.findByText('プロジェクト名の保存に失敗しました')).toBeVisible();
  });

  it('allows closing trash and reports a delete failure without hiding the project', async () => {
    api.getProjects.mockResolvedValue([project]);
    api.deleteProject.mockRejectedValue(new Error('write failed'));
    renderHome();
    await screen.findByText('境界の歌');

    fireEvent.click(screen.getByText('削除済みアイテム'));
    fireEvent.click(await screen.findByRole('button', { name: 'Trash mock' }));
    expect(screen.queryByRole('button', { name: 'Trash mock' })).toBeNull();

    fireEvent.click(screen.getByTitle('プロジェクトを削除'));
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(screen.queryByText('このプロジェクトを削除しますか？削除済みアイテムから復元できます。')).toBeNull();

    fireEvent.click(screen.getByTitle('プロジェクトを削除'));
    fireEvent.click(screen.getByRole('button', { name: '削除' }));
    expect(await screen.findByText('プロジェクトの削除に失敗しました')).toBeVisible();
    expect(screen.getByRole('heading', { name: '境界の歌' })).toBeVisible();
  });

  it('renders the first-session and trash paths in English', async () => {
    localStorage.setItem('lyriclytic_language', 'en');
    api.getProjects.mockResolvedValue([]);
    renderHome();

    expect(await screen.findByText('No projects yet. Create one to get started.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Open the sample song' })).toBeVisible();
    fireEvent.click(screen.getByText('Deleted Items'));
    expect(await screen.findByRole('button', { name: 'Trash mock' })).toBeVisible();
  });
});
describe('Home project ordering and preview fallbacks', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    api.getProjects.mockReset();
    api.getDraftSections.mockReset();
    api.getStyleProfile.mockReset();
    api.getWorkingDraft.mockReset();
    api.getDraftSections.mockResolvedValue([]);
  });

  it('uses local recency, ordering, profile fallbacks, and tolerates preview lookup failures', async () => {
    const first = {
      project_id: 'first',
      title: 'First',
      theme: 'first theme',
      created_at: '2026-07-01T00:00:00.000Z',
      updated_at: '2026-07-01T00:00:00.000Z',
    };
    const recent = {
      project_id: 'recent',
      title: 'Recent',
      theme: 'recent theme',
      created_at: '2026-07-02T00:00:00.000Z',
      updated_at: '2026-07-02T00:00:00.000Z',
    };
    localStorage.setItem('lyriclytic_last_project', 'recent');
    localStorage.setItem('lyriclytic_project_order', JSON.stringify(['recent']));
    api.getProjects.mockResolvedValue([first, recent]);
    api.getStyleProfile.mockImplementation((projectId: string) => (
      projectId === 'first'
        ? Promise.reject(new Error('profile unavailable'))
        : Promise.resolve({ project_id: 'recent', memo: 'bright synth pop' })
    ));
    api.getWorkingDraft.mockImplementation((projectId: string) => (
      projectId === 'first'
        ? Promise.reject(new Error('draft unavailable'))
        : Promise.resolve(null)
    ));

    render(
      <BrowserRouter>
        <LanguageProvider>
          <Home />
        </LanguageProvider>
      </BrowserRouter>,
    );

    expect(await screen.findByText('Recent')).toBeVisible();
    expect(screen.getByText('bright synth pop')).toBeVisible();
    expect(screen.getByText('first theme')).toBeVisible();
    expect(screen.getByText('Recent').closest('article')).toHaveClass('is-recent');
  });
});
