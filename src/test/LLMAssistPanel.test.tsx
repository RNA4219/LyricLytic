import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LanguageProvider } from '../lib/LanguageContext';
import LLMAssistPanel from '../components/LLMAssistPanel';

const mockProps = {
  runtime: 'openai_compatible' as const,
  baseUrl: 'http://localhost:8080',
  model: 'test-model',
  modelPath: '',
  enabled: true,
  timeoutMs: 60000,
  maxTokens: 1024,
  temperature: 0.7,
  currentLyrics: 'First line\nSecond line\nThird line',
  currentStyle: 'Pop style',
  currentVocal: 'Soft vocal',
};

function renderWithProvider(ui: React.ReactNode) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe('LLMAssistPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should render when enabled', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      expect(screen.getByText('✨ AI補助')).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} enabled={false} />);
      expect(screen.queryByText('✨ AI補助')).not.toBeInTheDocument();
    });

    it('should have lyrics as default target', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const lyricsTab = screen.getByRole('tab', { name: 'Lyrics' });
      expect(lyricsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have generate as default mode', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateTab = screen.getByRole('tab', { name: '生成' });
      expect(generateTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have neutral as default emotion', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const emotionSelect = screen.getByLabelText('感情/トーン');
      expect(emotionSelect).toHaveValue('neutral');
    });
  });

  describe('target tabs', () => {
    it('should switch to style target', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const styleTab = screen.getByRole('tab', { name: 'Style' });
      fireEvent.click(styleTab);
      expect(styleTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch to vocal target', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const vocalTab = screen.getByRole('tab', { name: 'Vocal' });
      fireEvent.click(vocalTab);
      expect(vocalTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should hide mode tabs when target is not lyrics', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const styleTab = screen.getByRole('tab', { name: 'Style' });
      fireEvent.click(styleTab);
      expect(screen.queryByRole('tab', { name: '生成' })).not.toBeInTheDocument();
    });
  });

  describe('mode tabs (lyrics only)', () => {
    it('should switch to continue mode', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const continueTab = screen.getByRole('tab', { name: '続きを書いて' });
      fireEvent.click(continueTab);
      expect(continueTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch to paraphrase mode', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const paraphraseTab = screen.getByRole('tab', { name: '言い換え' });
      fireEvent.click(paraphraseTab);
      expect(paraphraseTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should change placeholder in continue mode', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const continueTab = screen.getByRole('tab', { name: '続きを書いて' });
      fireEvent.click(continueTab);
      const textarea = screen.getByPlaceholderText('現在の歌詞の続きを生成します...');
      expect(textarea).toBeInTheDocument();
    });

    it('should change placeholder in paraphrase mode', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const paraphraseTab = screen.getByRole('tab', { name: '言い換え' });
      fireEvent.click(paraphraseTab);
      const textarea = screen.getByPlaceholderText('言い換えたいテキストを入力...');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('emotion/tone selector', () => {
    it('should have all emotion options', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const emotionSelect = screen.getByLabelText('感情/トーン');
      const options = emotionSelect.querySelectorAll('option');
      expect(options.length).toBe(10);
    });

    it('should change emotion value', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const emotionSelect = screen.getByLabelText('感情/トーン');
      fireEvent.change(emotionSelect, { target: { value: 'happy' } });
      expect(emotionSelect).toHaveValue('happy');
    });

    it('should display emotion options in Japanese', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      expect(screen.getByText('指定なし')).toBeInTheDocument();
      expect(screen.getByText('明るい/楽しい')).toBeInTheDocument();
      expect(screen.getByText('悲しい/切ない')).toBeInTheDocument();
    });

    it('should include strong emotion instructions in generated prompt', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ candidates: [{ id: 1, title: 'Bright', text: 'line1\\nline2\\nline3\\nline4' }] }) } }],
        }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      fireEvent.change(screen.getByLabelText('感情/トーン'), { target: { value: 'happy' } });
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '夜明けに向かう歌詞' } });

      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      const promptText = requestBody.messages[0].content as string;
      expect(promptText).toContain('Emotion/Tone priority: bright, joyful, uplifting tone.');
      expect(promptText).toContain('Make this mood unmistakable in imagery, word choice, rhythm, momentum, and line endings.');
      expect(promptText).toContain('Every candidate must clearly reflect this emotion/tone: bright, joyful, uplifting tone.');
    });
  });

  describe('candidate count', () => {
    it('should have default candidate count of 3', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const candidateSelect = screen.getByLabelText('候補数');
      expect(candidateSelect).toHaveValue('3');
    });

    it('should change candidate count', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const candidateSelect = screen.getByLabelText('候補数');
      fireEvent.change(candidateSelect, { target: { value: '5' } });
      expect(candidateSelect).toHaveValue('5');
    });

    it('should show custom input when custom is selected', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const candidateSelect = screen.getByLabelText('候補数');
      fireEvent.change(candidateSelect, { target: { value: 'custom' } });
      const textboxes = screen.getAllByRole('textbox');
      const customInput = textboxes.find(tb => tb.classList.contains('llm-candidate-count-input'));
      expect(customInput).toBeDefined();
    });
  });

  describe('line count (lyrics only)', () => {
    it('should have default line count of 4', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const lineSelect = screen.getByLabelText('行数');
      expect(lineSelect).toHaveValue('4');
    });

    it('should change line count', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const lineSelect = screen.getByLabelText('行数');
      fireEvent.change(lineSelect, { target: { value: '6' } });
      expect(lineSelect).toHaveValue('6');
    });

    it('should hide line count when target is style', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const styleTab = screen.getByRole('tab', { name: 'Style' });
      fireEvent.click(styleTab);
      expect(screen.queryByLabelText('行数')).not.toBeInTheDocument();
    });
  });

  describe('prompt input', () => {
    it('should have textarea for prompt', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should update prompt value', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test prompt' } });
      expect(textarea).toHaveValue('test prompt');
    });
  });

  describe('generate button', () => {
    it('should show generate button', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateBtn = screen.getByRole('button', { name: '生成' });
      expect(generateBtn).toHaveClass('generate-btn');
    });

    it('should disable generate button while generating', async () => {
      vi.useFakeTimers();
      const mockFetch = vi.fn().mockImplementation(() => new Promise(() => {}));
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(screen.getByText('生成中...')).toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('generation flow', () => {
    it('should include Suno prompt references for style generation', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ candidates: [{ id: 1, title: 'Style', text: 'city pop, electric piano, future funk' }] }) } }],
        }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      fireEvent.click(screen.getByRole('tab', { name: 'Style' }));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '80年代のシティポップ' } });

      const generateBtn = screen.getByRole('button', { name: '生成' });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      const promptText = requestBody.messages[0].content as string;
      expect(promptText).toContain('Suno prompt references:');
      expect(promptText).toContain('offline catalog facets');
      expect(promptText).toMatch(/City Pop|Future Funk|J-POP 80年代セット1/);
    });

    it('should include Suno prompt references for vocal generation', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ candidates: [{ id: 1, title: 'Vocal', text: 'female vocals, breathy, intimate' }] }) } }],
        }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      fireEvent.click(screen.getByRole('tab', { name: 'Vocal' }));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '女性ボーカルでささやく感じ' } });

      const generateBtn = screen.getByRole('button', { name: '生成' });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      const promptText = requestBody.messages[0].content as string;
      expect(promptText).toContain('Suno prompt references:');
      expect(promptText).toContain('offline catalog facets');
      expect(promptText).toMatch(/Female Vocals|Vocal|Voice|ボーカル/);
    });

    it('should send continue prompt with recent lyrics context', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ candidates: [{ id: 1, title: 'Next', text: 'line1\\nline2\\nline3\\nline4' }] }) } }],
        }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      fireEvent.click(screen.getByRole('tab', { name: '続きを書いて' }));

      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      const promptText = requestBody.messages[0].content as string;
      expect(promptText).toContain('Continue writing from the existing lyrics.');
      expect(promptText).toContain('Request: 現在の歌詞から続きを書いてください。');
      expect(promptText).toContain('Reference recentLyrics:');
      expect(promptText).toContain('First line');
      expect(promptText).toContain('Third line');
    });

    it('should block paraphrase generation when input is empty', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      fireEvent.click(screen.getByRole('tab', { name: '言い換え' }));

      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(screen.getByText('言い換えたいテキストを入力してください')).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should send paraphrase prompt as a single line for single-line input', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ candidates: [{ id: 1, title: 'Alt', text: '別表現' }] }) } }],
        }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      fireEvent.click(screen.getByRole('tab', { name: '言い換え' }));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '君の声がまだ残ってる' } });

      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      const promptText = requestBody.messages[0].content as string;
      expect(promptText).toContain('Paraphrase or rephrase the input text.');
      expect(promptText).toContain('君の声がまだ残ってる');
      expect(promptText).toContain('For paraphrase: keep each candidate as a single short line');
      expect(promptText).not.toContain('For lyrics: use exactly 4 short lines per candidate');
    });

    it('should preserve multi-line structure in paraphrase prompts', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ candidates: [{ id: 1, title: 'Alt', text: '一行目\\n二行目' }] }) } }],
        }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      fireEvent.click(screen.getByRole('tab', { name: '言い換え' }));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '君の声が\nまだ残ってる' } });

      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      const promptText = requestBody.messages[0].content as string;
      expect(promptText).toContain('For paraphrase: keep each candidate to exactly 2 short lines');
      expect(promptText).not.toContain('For lyrics: use exactly 4 short lines per candidate');
    });

    it('should show candidates on successful generation', async () => {
      const mockResponse = {
        candidates: [
          { id: 1, title: 'Option 1', text: 'Generated text 1' },
          { id: 2, title: 'Option 2', text: 'Generated text 2' },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify(mockResponse) } }] }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(screen.getByText('生成候補 (2)')).toBeInTheDocument();
      });
    });

    it('should show error on failed generation', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should allow selecting a candidate', async () => {
      const mockResponse = {
        candidates: [
          { id: 1, title: 'Option 1', text: 'Generated text 1' },
          { id: 2, title: 'Option 2', text: 'Generated text 2' },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify(mockResponse) } }] }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Option 1'));
      expect(screen.getByText('Option 1').closest('.candidate-item')).toHaveClass('selected');
    });

    it('should discard candidates', async () => {
      const mockResponse = {
        candidates: [{ id: 1, title: 'Option 1', text: 'Generated text 1' }],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify(mockResponse) } }] }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(screen.getByText('すべて破棄')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('すべて破棄'));
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });
  });

  describe('clipboard operations', () => {
    it('should copy candidate text', async () => {
      const mockResponse = {
        candidates: [{ id: 1, title: 'Option 1', text: 'Generated text' }],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify(mockResponse) } }] }),
      });
      global.fetch = mockFetch;

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
      });

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(screen.getByTitle('選択をコピー')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('選択をコピー'));
    });
  });

  describe('error handling', () => {
    it('should show error when LLM not configured', async () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} enabled={false} />);
      expect(screen.queryByText('✨ AI補助')).not.toBeInTheDocument();
    });

    it('should show error when baseUrl is not localhost', async () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} baseUrl="https://external.com" />);
      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(screen.getByText('LLM の Base URL は localhost または 127.0.0.1 を指定してください')).toBeInTheDocument();
      });
    });
  });

  describe('runtime display', () => {
    it('should show model path for openai_compatible runtime', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} modelPath="/path/to/model.gguf" />);
      expect(screen.getByText('model.gguf')).toBeInTheDocument();
    });

    it('should not show runtime note when modelPath empty', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} modelPath="" />);
      const runtimeNote = screen.queryByText('.gguf');
      expect(runtimeNote).not.toBeInTheDocument();
    });
  });

  describe('line count custom input', () => {
    it('should show custom line count input when custom is selected', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const lineSelect = screen.getByLabelText('行数');
      fireEvent.change(lineSelect, { target: { value: 'custom' } });
      const textboxes = screen.getAllByRole('textbox');
      const customInput = textboxes.find(tb => tb.classList.contains('llm-candidate-count-input'));
      expect(customInput).toBeDefined();
    });

    it('should update line count from custom input', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const lineSelect = screen.getByLabelText('行数');
      fireEvent.change(lineSelect, { target: { value: 'custom' } });
      const textboxes = screen.getAllByRole('textbox');
      const customInput = textboxes.find(tb => tb.classList.contains('llm-candidate-count-input'));
      if (customInput) {
        fireEvent.change(customInput, { target: { value: '10' } });
        expect(customInput).toHaveValue('10');
      }
    });

    it('should clamp line count to valid range', () => {
      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const lineSelect = screen.getByLabelText('行数');
      fireEvent.change(lineSelect, { target: { value: 'custom' } });
      const textboxes = screen.getAllByRole('textbox');
      const customInput = textboxes.find(tb => tb.classList.contains('llm-candidate-count-input'));
      if (customInput) {
        fireEvent.change(customInput, { target: { value: '100' } });
        fireEvent.blur(customInput);
        // Should be clamped to max 16
        expect(customInput).toHaveValue('16');
      }
    });
  });

  describe('raw response handling', () => {
    it('should handle non-JSON response as single candidate', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'Plain text response' } }] }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        // Plain text is treated as a single candidate with default title
        expect(screen.getByText('生成された歌詞')).toBeInTheDocument();
      });
    });
  });

  describe('copy all candidates', () => {
    it('should copy all candidates with titles', async () => {
      const mockResponse = {
        candidates: [
          { id: 1, title: 'Option 1', text: 'Text 1' },
          { id: 2, title: 'Option 2', text: 'Text 2' },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify(mockResponse) } }] }),
      });
      global.fetch = mockFetch;

      const clipboardMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: clipboardMock },
        writable: true,
      });

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(screen.getByText('すべてコピー')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('すべてコピー'));
      expect(clipboardMock).toHaveBeenCalled();
    });
  });

  describe('candidate preview', () => {
    it('should truncate long candidate text', async () => {
      const longText = 'A'.repeat(300);
      const mockResponse = {
        candidates: [{ id: 1, title: 'Long', text: longText }],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify(mockResponse) } }] }),
      });
      global.fetch = mockFetch;

      renderWithProvider(<LLMAssistPanel {...mockProps} />);
      const generateBtns = screen.getAllByRole('button', { name: '生成' });
      const actionBtn = generateBtns.find(b => b.classList.contains('generate-btn'));
      if (actionBtn) fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(screen.getByText(/AAA\.\.\./)).toBeInTheDocument();
      });
    });
  });
});
