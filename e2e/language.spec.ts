import { test, expect } from '@playwright/test';

test.describe('Language switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display Japanese by default', async ({ page }) => {
    await page.goto('/');

    // Check Japanese text is displayed
    await expect(page.getByText('AI音楽生成向け歌詞制作ツール')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'プロジェクト', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ 新規プロジェクト/ })).toBeVisible();
  });

  test('should have language switch buttons', async ({ page }) => {
    await page.goto('/');

    // Check language buttons exist (use specific selector for lang-btn class)
    const jaButton = page.locator('.lang-btn').getByText('JA', { exact: true });
    const enButton = page.locator('.lang-btn').getByText('EN', { exact: true });

    await expect(jaButton).toBeVisible();
    await expect(enButton).toBeVisible();
  });

  test('should switch to English when EN button is clicked', async ({ page }) => {
    await page.goto('/');

    // Click EN button (use specific selector)
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();

    // Wait for English text to appear
    await expect(page.getByText('Lyric production tool for AI music generation')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ New Project/ })).toBeVisible();
  });

  test('should switch back to Japanese when JA button is clicked', async ({ page }) => {
    await page.goto('/');

    // Switch to English
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

    // Switch back to Japanese
    await page.locator('.lang-btn').getByText('JA', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'プロジェクト', exact: true })).toBeVisible();
  });

  test('should persist language choice after page reload', async ({ page }) => {
    await page.goto('/');

    // Switch to English
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

    // Reload page
    await page.reload();

    // Should still be in English
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  });

  test('should update all text elements when language changes', async ({ page }) => {
    await page.goto('/');

    // Check Japanese elements
    await expect(page.getByText('AI音楽生成向け歌詞制作ツール')).toBeVisible();
    await expect(page.getByText('ローカルファースト • 自動保存 • バージョン履歴')).toBeVisible();

    // Switch to English
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();

    // Check all elements are in English
    await expect(page.getByText('Lyric production tool for AI music generation')).toBeVisible();
    await expect(page.getByText('Local-first • Auto-save • Version history')).toBeVisible();
  });

  test('should highlight active language button', async ({ page }) => {
    await page.goto('/');

    // JA should be active by default
    const jaButton = page.locator('.lang-btn').getByText('JA', { exact: true });
    const enButton = page.locator('.lang-btn').getByText('EN', { exact: true });

    await expect(jaButton).toHaveClass(/active/);
    await expect(enButton).not.toHaveClass(/active/);

    // Click EN
    await enButton.click();

    await expect(enButton).toHaveClass(/active/);
    await expect(jaButton).not.toHaveClass(/active/);
  });

  test('should set document lang attribute correctly', async ({ page }) => {
    await page.goto('/');

    // Should be ja by default
    expect(await page.locator('html').getAttribute('lang')).toBe('ja');

    // Switch to English
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();

    // Wait for lang attribute to change
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display app title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'LyricLytic' }).first()).toBeVisible();
  });

  test('should display subtitle', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('AI音楽生成向け歌詞制作ツール')).toBeVisible();
  });

  test('should have new project button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /\+ 新規プロジェクト/ })).toBeVisible();
  });

  test('should show project list header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'プロジェクト', exact: true })).toBeVisible();
  });

  test('should display footer text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ローカルファースト • 自動保存 • バージョン履歴')).toBeVisible();
  });
});

test.describe('New project form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show input form when new project button is clicked', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();

    await expect(page.getByPlaceholder('プロジェクト名')).toBeVisible();
    await expect(page.getByRole('button', { name: '作成' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
  });

  test('should show English form when language is English', async ({ page }) => {
    await page.goto('/');

    // Switch to English
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();

    // Click new project button
    await page.getByRole('button', { name: /\+ New Project/ }).click();

    await expect(page.getByPlaceholder('Project title')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should hide form when cancel is clicked', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();
    await expect(page.getByPlaceholder('プロジェクト名')).toBeVisible();

    await page.getByRole('button', { name: 'キャンセル' }).click();

    await expect(page.getByPlaceholder('プロジェクト名')).not.toBeVisible();
  });
});

test.describe('More button and trash panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have More button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /その他/ })).toBeVisible();
  });

  test('should show English More button when language is English', async ({ page }) => {
    await page.goto('/');

    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();
    await expect(page.getByRole('button', { name: /More/ })).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1.first()).toBeVisible();
  });

  test('should have accessible language buttons', async ({ page }) => {
    await page.goto('/');

    const jaButton = page.locator('.lang-btn').getByText('JA', { exact: true });
    const enButton = page.locator('.lang-btn').getByText('EN', { exact: true });

    await expect(jaButton).toBeVisible();
    await expect(enButton).toBeVisible();
  });
});

test.describe('Language persistence', () => {
  test('should remember language after browser restart', async ({ page }) => {
    await page.goto('/');

    // Switch to English
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

    // Check localStorage
    const lang = await page.evaluate(() => localStorage.getItem('lyriclytic_language'));
    expect(lang).toBe('en');
  });

  test('should start in Japanese for new users', async ({ page }) => {
    await page.goto('/');

    // Should be in Japanese by default
    await expect(page.getByRole('heading', { name: 'プロジェクト', exact: true })).toBeVisible();
  });
});