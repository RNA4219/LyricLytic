/**
 * LLM prompt building utilities
 */

export interface LanguageInstructionOptions {
  language?: 'ja' | 'en';
  forceEnglish?: boolean;
}

/**
 * Build language instruction for LLM prompts
 */
export function buildLanguageInstruction(options: LanguageInstructionOptions = {}): string {
  const { language = 'en', forceEnglish = false } = options;

  if (forceEnglish) {
    return 'Generate all output text in English.';
  }

  return language === 'ja'
    ? 'Generate all output text in Japanese.'
    : 'Generate all output text in English.';
}

export interface JsonFieldSpec {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description?: string;
  optional?: boolean;
}

export interface JsonResponseFormatOptions {
  arrayName: string;
  fields: JsonFieldSpec[];
  exampleCount?: number;
}

/**
 * Build JSON response format instruction for LLM prompts
 */
export function buildJsonResponseFormat(options: JsonResponseFormatOptions): string {
  const { arrayName, fields, exampleCount = 2 } = options;

  const fieldLines = fields.map((field) => {
    const exampleValue = field.type === 'string'
      ? `"${field.description || field.name}"`
      : field.type === 'number'
        ? '1'
        : 'true';
    return `      "${field.name}": ${exampleValue}`;
  });

  const examples = Array.from({ length: exampleCount }, (_, i) => {
    return `    {
${fieldLines.join(',\n')}
    }`;
  }).join(',\n');

  return `Respond ONLY with valid JSON in this exact format:
{
  "${arrayName}": [
${examples}
  ]
}`;
}