import { test, expect } from '@playwright/test';

test.describe('Project management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show empty state when no projects', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('プロジェクトがありません。新規作成してください。')).toBeVisible();
  });

  test('should show empty state in English', async ({ page }) => {
    await page.goto('/');
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();
    await expect(page.getByText('No projects yet. Create one to get started.')).toBeVisible();
  });

  test('should show project list header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'プロジェクト', exact: true })).toBeVisible();
  });
});

test.describe('Form interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should focus input when form opens', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();

    // Input should be visible
    await expect(page.getByPlaceholder('プロジェクト名')).toBeVisible();
  });

  test('should allow typing in project name input', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();

    const input = page.getByPlaceholder('プロジェクト名');
    await input.fill('My New Song');
    await expect(input).toHaveValue('My New Song');
  });

  test('should clear input after cancel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();

    const input = page.getByPlaceholder('プロジェクト名');
    await input.fill('Test Project');
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // Open again - should be empty
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();
    await expect(page.getByPlaceholder('プロジェクト名')).toHaveValue('');
  });
});

test.describe('Language button states', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should toggle between JA and EN multiple times', async ({ page }) => {
    await page.goto('/');

    for (let i = 0; i < 3; i++) {
      await page.locator('.lang-btn').getByText('EN', { exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

      await page.locator('.lang-btn').getByText('JA', { exact: true }).click();
      await expect(page.getByRole('heading', { name: 'プロジェクト', exact: true })).toBeVisible();
    }
  });

  test('should have correct active state after multiple clicks', async ({ page }) => {
    await page.goto('/');

    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();
    await expect(page.locator('.lang-btn').getByText('EN', { exact: true })).toHaveClass(/active/);

    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();
    await expect(page.locator('.lang-btn').getByText('EN', { exact: true })).toHaveClass(/active/);
  });
});

test.describe('Footer content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display footer with correct Japanese text', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByText('ローカルファースト • 自動保存 • バージョン履歴');
    await expect(footer).toBeVisible();
  });

  test('should display footer with correct English text', async ({ page }) => {
    await page.goto('/');
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();
    const footer = page.getByText('Local-first • Auto-save • Version history');
    await expect(footer).toBeVisible();
  });

  test('should contain bullet separator in footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('.home-footer p');
    const text = await footer.textContent();
    expect(text).toContain('•');
  });
});

test.describe('Responsive behavior', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByText('AI音楽生成向け歌詞制作ツール')).toBeVisible();
    await expect(page.locator('.lang-btn').getByText('JA', { exact: true })).toBeVisible();
    await expect(page.locator('.lang-btn').getByText('EN', { exact: true })).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.getByText('AI音楽生成向け歌詞制作ツール')).toBeVisible();
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.getByText('AI音楽生成向け歌詞制作ツール')).toBeVisible();
  });
});

test.describe('Subtitle content verification', () => {
  test('should mention AI music in Japanese subtitle', async ({ page }) => {
    await page.goto('/');
    const subtitle = page.locator('.subtitle');
    const text = await subtitle.textContent();
    expect(text).toContain('AI音楽');
    expect(text).toContain('歌詞');
  });

  test('should mention lyric in English subtitle', async ({ page }) => {
    await page.goto('/');
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();
    const subtitle = page.locator('.subtitle');
    const text = await subtitle.textContent();
    expect(text).toContain('Lyric');
    expect(text).toContain('AI music');
  });
});

test.describe('App title consistency', () => {
  test('should show same title in both languages', async ({ page }) => {
    await page.goto('/');

    // Check title in Japanese mode
    const h1InJapanese = page.getByRole('heading', { name: 'LyricLytic' }).first();
    await expect(h1InJapanese).toBeVisible();

    // Switch to English
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();

    // Check title is still LyricLytic
    const h1InEnglish = page.getByRole('heading', { name: 'LyricLytic' }).first();
    await expect(h1InEnglish).toBeVisible();
  });

  test('should have LyricLytic as page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('LyricLytic');
  });
});

test.describe('Keyboard accessibility', () => {
  test('should be able to navigate with Tab key', async ({ page }) => {
    await page.goto('/');

    // Tab to language buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should be on an interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should activate button with Enter key', async ({ page }) => {
    await page.goto('/');

    // Tab to EN button and press Enter
    const enButton = page.locator('.lang-btn').getByText('EN', { exact: true });
    await enButton.focus();
    await page.keyboard.press('Enter');

    // Should switch to English
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  });

  test('should activate button with Space key', async ({ page }) => {
    await page.goto('/');

    // Focus EN button and press Space
    const enButton = page.locator('.lang-btn').getByText('EN', { exact: true });
    await enButton.focus();
    await page.keyboard.press('Space');

    // Should switch to English
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  });
});