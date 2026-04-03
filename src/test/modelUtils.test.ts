import { describe, it, expect } from 'vitest';
import {
  isAuxiliaryModelFile,
  isLikelyModelFile,
  getModelFileName,
} from '../lib/llm/modelUtils';

describe('modelUtils', () => {
  describe('isAuxiliaryModelFile', () => {
    it('should identify mmproj files as auxiliary', () => {
      expect(isAuxiliaryModelFile('model-mmproj-f16.gguf')).toBe(true);
      expect(isAuxiliaryModelFile('mmproj-model.gguf')).toBe(true);
    });

    it('should identify clip files as auxiliary', () => {
      expect(isAuxiliaryModelFile('clip-vit.gguf')).toBe(true);
      expect(isAuxiliaryModelFile('CLIP-model.gguf')).toBe(true);
    });

    it('should identify vision files as auxiliary', () => {
      expect(isAuxiliaryModelFile('vision-projector.gguf')).toBe(true);
    });

    it('should identify projector files as auxiliary', () => {
      expect(isAuxiliaryModelFile('projector.gguf')).toBe(true);
    });

    it('should not identify regular model files as auxiliary', () => {
      expect(isAuxiliaryModelFile('llama-7b.gguf')).toBe(false);
      expect(isAuxiliaryModelFile('mistral.ggml')).toBe(false);
      expect(isAuxiliaryModelFile('gpt-neox.safetensors')).toBe(false);
    });
  });

  describe('isLikelyModelFile', () => {
    it('should identify .gguf files', () => {
      expect(isLikelyModelFile('model.gguf')).toBe(true);
      expect(isLikelyModelFile('/path/to/model.gguf')).toBe(true);
    });

    it('should identify .ggml files', () => {
      expect(isLikelyModelFile('model.ggml')).toBe(true);
    });

    it('should identify .safetensors files', () => {
      expect(isLikelyModelFile('model.safetensors')).toBe(true);
    });

    it('should not identify other files', () => {
      expect(isLikelyModelFile('model.bin')).toBe(false);
      expect(isLikelyModelFile('model.pt')).toBe(false);
      expect(isLikelyModelFile('config.json')).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isLikelyModelFile('  model.gguf  ')).toBe(true);
      expect(isLikelyModelFile('')).toBe(false);
    });
  });

  describe('getModelFileName', () => {
    it('should extract model name from path', () => {
      expect(getModelFileName('C:\\models\\llama-7b.gguf')).toBe('llama-7b');
      expect(getModelFileName('/home/user/models/mistral.gguf')).toBe('mistral');
    });

    it('should remove extension', () => {
      expect(getModelFileName('model.gguf')).toBe('model');
      expect(getModelFileName('model.ggml')).toBe('model');
      expect(getModelFileName('model.safetensors')).toBe('model');
    });

    it('should handle path without directory', () => {
      expect(getModelFileName('llama-7b.gguf')).toBe('llama-7b');
    });

    it('should return input if not a model file', () => {
      expect(getModelFileName('config.json')).toBe('config.json');
    });
  });
});