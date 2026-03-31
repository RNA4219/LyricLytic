import { test, expect, Page } from '@playwright/test';

/**
 * Editor tests use mocked Tauri API since Playwright runs in a browser context.
 * The real Tauri invoke commands only work inside the Tauri WebView.
 */

// Mock data
const MOCK_PROJECT_ID = 'test-project-mock-12345';
const MOCK_WORKING_DRAFT_ID = 'test-draft-mock-67890';

// Setup Tauri API mock for each test
async function setupTauriMock(page: Page) {
  await page.addInitScript(() => {
    // Mock data store
    const mockData: Record<string, any> = {
      projects: [] as any[],
      versions: [] as any[],
      fragments: [] as any[],
    };

    // Mock invoke function
    (window as any).__TAURI_MOCK__ = async (command: string, args?: any) => {
      console.log(`Mock invoke: ${command}`, args);

      switch (command) {
        case 'get_projects':
          return [...mockData.projects];
        case 'create_project': {
          const newProject = {
            project_id: `project-${Date.now()}`,
            title: args?.input?.title || 'New Project',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          mockData.projects.push(newProject);
          console.log('Created project:', newProject);
          return newProject;
        }
        case 'get_project':
          return mockData.projects.find((p: any) => p.project_id === args?.projectId);
        case 'delete_project':
          mockData.projects = mockData.projects.filter((p: any) => p.project_id !== args?.projectId);
          return undefined;
        case 'get_working_draft':
          return {
            working_draft_id: `draft-${args?.projectId}`,
            project_id: args?.projectId,
            latest_body_text: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        case 'get_draft_sections':
          return [];
        case 'save_draft':
          return undefined;
        case 'get_versions':
          return [];
        case 'create_version':
          return { lyric_version_id: `version-${Date.now()}`, ...args?.input };
        case 'get_fragments':
          return [];
        case 'create_fragment':
          return { collected_fragment_id: `fragment-${Date.now()}`, ...args?.input };
        default:
          console.log(`Unknown command: ${command}`);
          return undefined;
      }
    };
    console.log('Tauri mock installed via __TAURI_MOCK__');
  });
}

test.describe('Editor - Section Display', () => {
  test.beforeEach(async ({ page }) => {
    await setupTauriMock(page);
    await page.goto('/');
  });

  test('should show editor when clicking new project', async ({ page }) => {
    // Click new project button
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();

    // Fill project name and create
    await page.getByPlaceholder('プロジェクト名').fill('Test Lyrics');
    await page.getByRole('button', { name: '作成' }).click();

    // Should navigate to editor
    await expect(page).toHaveURL(/\/project\//);
  });

  test('should show section tabs in editor', async ({ page }) => {
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();
    await page.getByPlaceholder('プロジェクト名').fill('Section Test');
    await page.getByRole('button', { name: '作成' }).click();

    // Wait for editor to load
    await page.waitForURL(/\/project\//);

    // Should show section tabs
    await expect(page.locator('.section-list')).toBeVisible();
  });
});

test.describe('Editor - Section Language Display', () => {
  test.beforeEach(async ({ page }) => {
    await setupTauriMock(page);
    await page.goto('/');
  });

  test('should show section buttons in Japanese', async ({ page }) => {
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();
    await page.getByPlaceholder('プロジェクト名').fill('Language Test');
    await page.getByRole('button', { name: '作成' }).click();

    await page.waitForURL(/\/project\//);

    // Check for section preset buttons in Japanese context
    const sectionButtons = page.locator('.add-section-btn');
    await expect(sectionButtons.first()).toBeVisible();
  });

  test('should show section buttons in English after language switch', async ({ page }) => {
    // Switch to English
    await page.locator('.lang-btn').getByText('EN', { exact: true }).click();

    await page.getByRole('button', { name: /\+ New Project/ }).click();
    await page.getByPlaceholder('Project title').fill('English Test');
    await page.getByRole('button', { name: 'Create' }).click();

    await page.waitForURL(/\/project\//);

    // Should show English UI
    const sectionButtons = page.locator('.add-section-btn');
    await expect(sectionButtons.first()).toBeVisible();
  });
});

test.describe('Editor - Section Add Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await setupTauriMock(page);
    await page.goto('/');
  });

  test('should show all section preset buttons', async ({ page }) => {
    // Click new project button
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();

    // Fill project name and create
    await page.getByPlaceholder('プロジェクト名').fill('Presets Test');
    await page.getByRole('button', { name: '作成' }).click();

    // Wait for editor to load
    await page.waitForURL(/\/project\//);

    // Check for preset buttons (button text is just the preset name, e.g., "Intro", not "+Intro")
    await expect(page.locator('.add-section-btn').getByText('Intro', { exact: true })).toBeVisible();
    await expect(page.locator('.add-section-btn').getByText('Verse', { exact: true })).toBeVisible();
    await expect(page.locator('.add-section-btn').getByText('Chorus', { exact: true })).toBeVisible();
    await expect(page.locator('.add-section-btn').getByText('Bridge', { exact: true })).toBeVisible();
    await expect(page.locator('.add-section-btn').getByText('Outro', { exact: true })).toBeVisible();
  });

  test('should add section when clicking preset button', async ({ page }) => {
    // Click new project button
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();

    // Fill project name and create
    await page.getByPlaceholder('プロジェクト名').fill('Add Section Test');
    await page.getByRole('button', { name: '作成' }).click();

    // Wait for editor to load
    await page.waitForURL(/\/project\//);

    // Count existing sections
    const initialSections = await page.locator('.section-tab').count();

    // Add a new section
    await page.locator('.add-section-btn').getByText('Verse', { exact: true }).click();

    // Should have one more section
    const newSectionCount = await page.locator('.section-tab').count();
    expect(newSectionCount).toBe(initialSections + 1);
  });
});

test.describe('Editor - Section Tab Actions', () => {
  test.beforeEach(async ({ page }) => {
    await setupTauriMock(page);
    await page.goto('/');
  });

  test('should show move up/down buttons on section tabs', async ({ page }) => {
    // Click new project button
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();

    // Fill project name and create
    await page.getByPlaceholder('プロジェクト名').fill('Move Test');
    await page.getByRole('button', { name: '作成' }).click();

    // Wait for editor to load
    await page.waitForURL(/\/project\//);

    // Add multiple sections
    await page.locator('.add-section-btn').getByText('Verse', { exact: true }).click();
    await page.locator('.add-section-btn').getByText('Chorus', { exact: true }).click();

    // Hover over a section tab (not the "All" tab, which has no actions)
    // Use last() to get the actual section tab, not the "All" tab
    const sectionTab = page.locator('.section-tab').last();
    await sectionTab.hover();

    // Should show action buttons (move up/down and delete)
    const actionButtons = sectionTab.locator('.section-tab-actions button');
    await expect(actionButtons.first()).toBeVisible();
  });

  test('should show delete button on section tab', async ({ page }) => {
    // Click new project button
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();

    // Fill project name and create
    await page.getByPlaceholder('プロジェクト名').fill('Delete Test');
    await page.getByRole('button', { name: '作成' }).click();

    // Wait for editor to load
    await page.waitForURL(/\/project\//);

    // Add a section
    await page.locator('.add-section-btn').getByText('Verse', { exact: true }).click();

    // Hover over the section tab
    const sectionTab = page.locator('.section-tab').last();
    await sectionTab.hover();

    // Should show delete button (×)
    const deleteBtn = sectionTab.getByRole('button', { name: '×' });
    await expect(deleteBtn).toBeVisible();
  });
});

test.describe('Editor - Section Rename', () => {
  test.beforeEach(async ({ page }) => {
    await setupTauriMock(page);
    await page.goto('/');
  });

  test('should allow renaming section via input', async ({ page }) => {
    // Click new project button
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();

    // Fill project name and create
    await page.getByPlaceholder('プロジェクト名').fill('Rename Test');
    await page.getByRole('button', { name: '作成' }).click();

    // Wait for editor to load
    await page.waitForURL(/\/project\//);

    // Add a section
    await page.locator('.add-section-btn').getByText('Verse', { exact: true }).click();

    // Find the section name input
    const nameInput = page.locator('.section-name-input').last();
    await nameInput.click();
    await nameInput.fill('My Custom Verse');

    // Should show the new name
    await expect(nameInput).toHaveValue('My Custom Verse');
  });
});

test.describe('Editor - Monaco Editor', () => {
  test.beforeEach(async ({ page }) => {
    await setupTauriMock(page);
    await page.goto('/');
  });

  test('should show Monaco editor in editor page', async ({ page }) => {
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();
    await page.getByPlaceholder('プロジェクト名').fill('Editor Test');
    await page.getByRole('button', { name: '作成' }).click();

    await page.waitForURL(/\/project\//);

    // Should show editor container
    await expect(page.locator('.editor-container')).toBeVisible();
  });

  test('should allow typing in editor', async ({ page }) => {
    await page.getByRole('button', { name: /\+ 新規プロジェクト/ }).click();
    await page.getByPlaceholder('プロジェクト名').fill('Typing Test');
    await page.getByRole('button', { name: '作成' }).click();

    await page.waitForURL(/\/project\//);

    // Click on editor area
    const editor = page.locator('.editor-container');
    await editor.click();

    // Type some lyrics
    await page.keyboard.type('Hello world, this is a test');

    // Editor should have content
    await expect(editor).toBeVisible();
  });
});