export type Language = 'ja' | 'en';

export const translations = {
  ja: {
    // Layout
    appTitle: 'LyricLytic',

    // Home
    subtitle: 'AI音楽生成向け歌詞制作ツール',
    projects: 'プロジェクト',
    newProject: '新規プロジェクト',
    projectTitle: 'プロジェクト名',
    create: '作成',
    cancel: 'キャンセル',
    loading: '読み込み中...',
    noProjects: 'プロジェクトがありません。新規作成してください。',
    deleteProject: 'プロジェクトを削除',
    deleteConfirm: 'このプロジェクトを削除しますか？削除済みアイテムから復元できます。',
    deleteFailed: 'プロジェクトの削除に失敗しました',
    createFailed: 'プロジェクトの作成に失敗しました',
    loadFailed: 'プロジェクトの読み込みに失敗しました',

    // Trash
    trash: '削除済み',
    deletedProjects: '削除済みプロジェクト',
    deletedItems: '削除済みアイテム',
    noDeleted: '削除済みプロジェクトはありません',
    noDeletedItems: '削除済みアイテムはありません',
    restore: '復元',
    deletedLabel: '削除日:',
    close: '閉じる',
    more: 'その他',

    // Footer
    footerText: 'ローカルファースト • 自動保存 • バージョン履歴',

    // Editor
    loadingProject: '読み込み中...',
    projectNotFound: 'プロジェクトが見つかりません',
    autoSaveFailed: '自動保存に失敗しました',
    saveSnapshotFailed: 'スナップショットの保存に失敗しました',

    // Language
    language: '言語',
    japanese: '日本語',
    english: 'English',
  },
  en: {
    // Layout
    appTitle: 'LyricLytic',

    // Home
    subtitle: 'Lyric production tool for AI music generation',
    projects: 'Projects',
    newProject: 'New Project',
    projectTitle: 'Project title',
    create: 'Create',
    cancel: 'Cancel',
    loading: 'Loading...',
    noProjects: 'No projects yet. Create one to get started.',
    deleteProject: 'Delete project',
    deleteConfirm: 'Delete this project? It can be restored from deleted items.',
    deleteFailed: 'Failed to delete project',
    createFailed: 'Failed to create project',
    loadFailed: 'Failed to load projects',

    // Trash
    trash: 'Trash',
    deletedProjects: 'Deleted Projects',
    deletedItems: 'Deleted Items',
    noDeleted: 'No deleted projects',
    noDeletedItems: 'No deleted items',
    restore: 'Restore',
    deletedLabel: 'Deleted:',
    close: 'Close',
    more: 'More',

    // Footer
    footerText: 'Local-first • Auto-save • Version history',

    // Editor
    loadingProject: 'Loading...',
    projectNotFound: 'Project not found',
    autoSaveFailed: 'Auto-save failed',
    saveSnapshotFailed: 'Failed to save snapshot',

    // Language
    language: 'Language',
    japanese: '日本語',
    english: 'English',
  },
} as const;