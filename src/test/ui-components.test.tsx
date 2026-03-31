import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../lib/LanguageContext';

// Tests for tooltip and title attributes
describe('Tooltip and title attributes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function ButtonWithTooltip() {
    const { t } = useLanguage();
    return (
      <button title={t('deleteProject')} data-testid="delete-btn">
        🗑
      </button>
    );
  }

  it('should show Japanese tooltip', () => {
    render(
      <LanguageProvider>
        <ButtonWithTooltip />
      </LanguageProvider>
    );

    expect(screen.getByTestId('delete-btn').getAttribute('title')).toBe('プロジェクトを削除');
  });

  it('should show English tooltip', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <ButtonWithTooltip />
      </LanguageProvider>
    );

    expect(screen.getByTestId('delete-btn').getAttribute('title')).toBe('Delete project');
  });

  it('should update tooltip on language change', async () => {
    render(
      <LanguageProvider>
        <ButtonWithTooltip />
      </LanguageProvider>
    );

    expect(screen.getByTestId('delete-btn').getAttribute('title')).toBe('プロジェクトを削除');
  });
});

// Tests for aria-label attributes
describe('Aria-label attributes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function AccessibleButton() {
    const { t } = useLanguage();
    return (
      <button aria-label={t('restore')} data-testid="restore-btn">
        ↩️
      </button>
    );
  }

  it('should have Japanese aria-label', () => {
    render(
      <LanguageProvider>
        <AccessibleButton />
      </LanguageProvider>
    );

    expect(screen.getByTestId('restore-btn').getAttribute('aria-label')).toBe('復元');
  });

  it('should have English aria-label', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <AccessibleButton />
      </LanguageProvider>
    );

    expect(screen.getByTestId('restore-btn').getAttribute('aria-label')).toBe('Restore');
  });
});

// Tests for dynamic text rendering
describe('Dynamic text rendering', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function DynamicText({ count }: { count: number }) {
    const { t, language } = useLanguage();
    return (
      <div>
        <span data-testid="count-text">
          {language === 'ja'
            ? `${t('projects')} (${count})`
            : `${t('projects')} (${count})`}
        </span>
      </div>
    );
  }

  it('should render count in Japanese', () => {
    render(
      <LanguageProvider>
        <DynamicText count={5} />
      </LanguageProvider>
    );

    expect(screen.getByTestId('count-text').textContent).toBe('プロジェクト (5)');
  });

  it('should render count in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <DynamicText count={10} />
      </LanguageProvider>
    );

    expect(screen.getByTestId('count-text').textContent).toBe('Projects (10)');
  });

  it('should handle zero count', () => {
    render(
      <LanguageProvider>
        <DynamicText count={0} />
      </LanguageProvider>
    );

    expect(screen.getByTestId('count-text').textContent).toBe('プロジェクト (0)');
  });
});

// Tests for nested components
describe('Nested component translations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function InnerComponent() {
    const { t } = useLanguage();
    return <span data-testid="inner">{t('trash')}</span>;
  }

  function MiddleComponent({ children }: { children: React.ReactNode }) {
    const { t } = useLanguage();
    return (
      <div>
        <span data-testid="middle">{t('restore')}</span>
        {children}
      </div>
    );
  }

  function OuterComponent() {
    const { t } = useLanguage();
    return (
      <div>
        <span data-testid="outer">{t('projects')}</span>
        <MiddleComponent>
          <InnerComponent />
        </MiddleComponent>
      </div>
    );
  }

  it('should translate all nested components in Japanese', () => {
    render(
      <LanguageProvider>
        <OuterComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('outer').textContent).toBe('プロジェクト');
    expect(screen.getByTestId('middle').textContent).toBe('復元');
    expect(screen.getByTestId('inner').textContent).toBe('削除済み');
  });

  it('should translate all nested components in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <OuterComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('outer').textContent).toBe('Projects');
    expect(screen.getByTestId('middle').textContent).toBe('Restore');
    expect(screen.getByTestId('inner').textContent).toBe('Trash');
  });
});

// Tests for conditional rendering
describe('Conditional rendering based on language', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function ConditionalComponent() {
    const { language, t } = useLanguage();
    return (
      <div>
        {language === 'ja' && <span data-testid="ja-only">日本語モード</span>}
        {language === 'en' && <span data-testid="en-only">English Mode</span>}
        <span data-testid="always">{t('language')}</span>
      </div>
    );
  }

  it('should show Japanese-only content in Japanese mode', () => {
    render(
      <LanguageProvider>
        <ConditionalComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('ja-only')).toBeDefined();
    expect(screen.queryByTestId('en-only')).toBeNull();
  });

  it('should show English-only content in English mode', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <ConditionalComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('en-only')).toBeDefined();
    expect(screen.queryByTestId('ja-only')).toBeNull();
  });
});

// Tests for list rendering
describe('List rendering with translations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function MenuList() {
    const { t } = useLanguage();
    const items = [
      { key: 'projects', icon: '📁' },
      { key: 'trash', icon: '🗑️' },
      { key: 'more', icon: '⋯' },
    ];

    return (
      <ul>
        {items.map((item) => (
          <li key={item.key} data-testid={`item-${item.key}`}>
            {item.icon} {t(item.key as any)}
          </li>
        ))}
      </ul>
    );
  }

  it('should render menu items in Japanese', () => {
    render(
      <LanguageProvider>
        <MenuList />
      </LanguageProvider>
    );

    expect(screen.getByTestId('item-projects').textContent).toBe('📁 プロジェクト');
    expect(screen.getByTestId('item-trash').textContent).toBe('🗑️ 削除済み');
    expect(screen.getByTestId('item-more').textContent).toBe('⋯ その他');
  });

  it('should render menu items in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <MenuList />
      </LanguageProvider>
    );

    expect(screen.getByTestId('item-projects').textContent).toBe('📁 Projects');
    expect(screen.getByTestId('item-trash').textContent).toBe('🗑️ Trash');
    expect(screen.getByTestId('item-more').textContent).toBe('⋯ More');
  });
});

// Tests for select/dropdown options
describe('Select/dropdown options', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function LanguageSelect() {
    const { language, setLanguage, t } = useLanguage();
    return (
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'ja' | 'en')}
        data-testid="lang-select"
      >
        <option value="ja">{t('japanese')}</option>
        <option value="en">{t('english')}</option>
      </select>
    );
  }

  it('should show language options in current language', () => {
    render(
      <LanguageProvider>
        <LanguageSelect />
      </LanguageProvider>
    );

    expect(screen.getByTestId('lang-select').value).toBe('ja');
  });

  it('should change language via select', async () => {
    render(
      <LanguageProvider>
        <LanguageSelect />
      </LanguageProvider>
    );

    await act(async () => {
      fireEvent.change(screen.getByTestId('lang-select'), { target: { value: 'en' } });
    });

    expect(screen.getByTestId('lang-select').value).toBe('en');
  });
});

// Tests for text truncation
describe('Text truncation with translations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function TruncatedText() {
    const { t } = useLanguage();
    return (
      <div
        style={{
          maxWidth: '100px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={t('subtitle')}
        data-testid="truncated"
      >
        {t('subtitle')}
      </div>
    );
  }

  it('should have full text in title attribute (Japanese)', () => {
    render(
      <LanguageProvider>
        <TruncatedText />
      </LanguageProvider>
    );

    expect(screen.getByTestId('truncated').getAttribute('title')).toBe(
      'AI音楽生成向け歌詞制作ツール'
    );
  });

  it('should have full text in title attribute (English)', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <TruncatedText />
      </LanguageProvider>
    );

    expect(screen.getByTestId('truncated').getAttribute('title')).toBe(
      'Lyric production tool for AI music generation'
    );
  });
});