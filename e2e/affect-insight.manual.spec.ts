import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'project-affect-manual';
const DRAFT_ID = 'draft-affect-manual';
const EVIDENCE_DIR = resolve('.five-tool-validation/affect-insight-v2/manual-bb/screenshots');

const VERSE_TEXT = [
  '怖くて不安で震える鼓動が止まらない！',
  '怒りと涙と希望が胸の奥でぶつかり続ける！',
].join('\n');

const CHORUS_TEXT = [
  '君を呼ぶ',
  '空を見る',
].join('\n');

const CURRENT_BODY = [
  '[Verse]',
  VERSE_TEXT,
  '',
  '[Chorus]',
  CHORUS_TEXT,
].join('\n');

const BRIGHT_BODY = [
  '[Verse]',
  '希望の光が笑う',
  '君と夢を抱いて楽しく歌う',
  '',
  '[Chorus]',
  '最高の愛を抱いて',
  'ありがとうを空へ歌う',
].join('\n');

const DARK_BODY = [
  '[Verse]',
  '闇の影が近づく',
  '怖くて不安で息が震える',
  '',
  '[Chorus]',
  'さよならの涙が落ちる',
  '孤独な夜に沈む',
].join('\n');

async function setupManualBbMock(page: Page) {
  await page.addInitScript(({ projectId, draftId, currentBody, verseText, chorusText, brightBody, darkBody }) => {
    localStorage.setItem('lyriclytic_language', 'ja');

    const project = {
      project_id: projectId,
      title: '感情インサイト 手動BB',
      theme: '歌詞感情と密度の確認',
      memo: '',
      created_at: '2026-07-03T01:00:00.000Z',
      updated_at: '2026-07-03T01:10:00.000Z',
    };

    const draft = {
      working_draft_id: draftId,
      project_id: projectId,
      latest_body_text: currentBody,
      bpm: 124,
      style_text: 'J-pop, emotional, layered chorus',
      vocal_text: 'clear female vocal',
      updated_at: '2026-07-03T01:10:00.000Z',
    };

    const sections = [
      {
        draft_section_id: 'manual-verse',
        working_draft_id: draftId,
        section_type: 'Verse',
        display_name: 'Verse',
        sort_order: 0,
        body_text: verseText,
      },
      {
        draft_section_id: 'manual-chorus',
        working_draft_id: draftId,
        section_type: 'Chorus',
        display_name: 'Chorus',
        sort_order: 1,
        body_text: chorusText,
      },
    ];

    const versions = [
      {
        lyric_version_id: 'version-dark',
        project_id: projectId,
        snapshot_name: '暗い改稿',
        body_text: darkBody,
        bpm: 124,
        style_text: 'dark pop',
        vocal_text: 'fragile vocal',
        note: '不安と孤独を強めた版',
        created_at: '2026-07-03T01:20:00.000Z',
      },
      {
        lyric_version_id: 'version-bright',
        project_id: projectId,
        snapshot_name: '明るい初稿',
        body_text: brightBody,
        bpm: 124,
        style_text: 'bright pop',
        vocal_text: 'warm vocal',
        note: '希望と感謝を中心にした版',
        created_at: '2026-07-02T23:30:00.000Z',
      },
    ];

    (window as any).__TAURI_MOCK__ = async (command: string, args?: Record<string, any>) => {
      switch (command) {
        case 'get_project':
          return args?.projectId === projectId ? project : null;
        case 'get_working_draft':
          return args?.projectId === projectId ? draft : null;
        case 'get_draft_sections':
          return args?.workingDraftId === draftId ? sections : [];
        case 'get_versions':
          return args?.projectId === projectId ? versions : [];
        case 'get_fragments':
        case 'get_song_artifacts':
        case 'get_revision_notes':
          return [];
        case 'get_style_profile':
          return null;
        case 'get_llama_cpp_runtime_status':
          return { running: false, base_url: 'http://127.0.0.1:11434', message: 'manual-bb mock' };
        case 'analyze_rhyme_text':
          return String(args?.text ?? '')
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => ({
              line,
              romanizedText: line,
              vowelText: line,
              consonantText: '',
              source: 'fallback',
            }));
        case 'save_draft':
        case 'restore_version':
        case 'delete_version':
        case 'delete_project':
          return undefined;
        case 'create_version':
          return {
            lyric_version_id: 'version-created-manual',
            created_at: '2026-07-03T01:30:00.000Z',
            ...args?.input,
          };
        case 'create_fragment':
          return {
            collected_fragment_id: 'fragment-created-manual',
            project_id: projectId,
            text: args?.input?.text ?? '',
            source: args?.input?.source,
            tags: args?.input?.tags ?? [],
            status: 'unused',
            created_at: '2026-07-03T01:30:00.000Z',
            updated_at: '2026-07-03T01:30:00.000Z',
          };
        default:
          return undefined;
      }
    };
  }, {
    projectId: PROJECT_ID,
    draftId: DRAFT_ID,
    currentBody: CURRENT_BODY,
    verseText: VERSE_TEXT,
    chorusText: CHORUS_TEXT,
    brightBody: BRIGHT_BODY,
    darkBody: DARK_BODY,
  });
}

test.describe('Manual BB - 歌詞感情インサイト v2', () => {
  test.beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await setupManualBbMock(page);
  });

  test('TC-AFFECT-001..003: 感情メトリクス、差分、根拠表示を確認できる', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    await page.goto(`/project/${PROJECT_ID}`);

    await expect(page.getByRole('heading', { name: '感情メトリクス' })).toBeVisible();
    await expect(page.getByText('セクション別')).toBeVisible();
    await expect(page.locator('.affect-section-row').filter({ hasText: 'Verse' })).toContainText('密度');
    await expect(page.locator('.affect-section-row').filter({ hasText: 'Verse' })).toContainText('緊張');
    await expect(page.locator('.affect-section-row').filter({ hasText: 'Chorus' })).toContainText('密度');
    await expect(page.locator('.affect-section-row').filter({ hasText: 'Chorus' })).toContainText('緊張');
    await expect(page.getByText(/Chorus の密度が Verse より低めです/)).toBeVisible();

    await expect(page.getByText('根拠')).toBeVisible();
    await expect(page.locator('.affect-evidence-row').filter({ hasText: '怖' }).first()).toBeVisible();
    await expect(page.getByText('制作メモ')).toBeVisible();
    await expect(page.getByText(/参考値です。歌詞の良し悪しではなく/)).toBeVisible();
    await expect(page.locator('.editor-container')).toBeVisible();
    await page.screenshot({
      path: resolve(EVIDENCE_DIR, 'TC-AFFECT-001-003-affect-panel.png'),
      fullPage: true,
    });

    await page.getByRole('button', { name: /バージョン比較/ }).click();
    await expect(page.getByText('感情差分')).toBeVisible();
    await expect(page.getByText('変化メモ')).toBeVisible();
    await expect(page.getByText(/明るさが下がりました/)).toBeVisible();
    await expect(page.getByText(/緊張度が上がりました/)).toBeVisible();
    await page.screenshot({
      path: resolve(EVIDENCE_DIR, 'TC-AFFECT-002-diff-viewer.png'),
      fullPage: true,
    });
  });
});
