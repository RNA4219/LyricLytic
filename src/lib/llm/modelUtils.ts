const MODEL_FILE_PATTERN = /\.(gguf|ggml|safetensors)$/i;

/**
 * Check if a file is an auxiliary model file (mmproj, clip, vision, projector)
 * These files are not main model files and should be excluded from model listings.
 */
export function isAuxiliaryModelFile(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes('mmproj') ||
    lower.includes('clip') ||
    lower.includes('vision') ||
    lower.includes('projector')
  );
}

/**
 * Check if a path looks like a model file based on extension.
 */
export function isLikelyModelFile(value: string): boolean {
  return MODEL_FILE_PATTERN.test(value.trim());
}

/**
 * Extract the model name from a file path, removing the extension.
 */
export function getModelFileName(path: string): string {
  const trimmedPath = path.trim();
  const fileName = trimmedPath.split(/[\\/]/).filter(Boolean).pop() || trimmedPath;
  return fileName.replace(/\.(gguf|ggml|safetensors)$/i, '');
}