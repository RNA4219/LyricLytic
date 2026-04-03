import { ja } from './ja';
import { en } from './en';

export type Language = 'ja' | 'en';

export const translations = {
  ja,
  en,
} as const;