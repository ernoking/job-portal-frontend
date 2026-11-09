export const MAX_CV_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export const EXPECTED_MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const ALLOWED_GENERIC_MIME_TYPES = ['', 'application/octet-stream'];

export const ERROR_UNSUPPORTED_TYPE = "That file type isn't supported. Upload a PDF or DOCX.";
export const ERROR_FILE_TOO_LARGE = 'That file is larger than 5MB.';

/**
 * Pure function to validate an uploaded CV file.
 *
 * Rules:
 * 1. Extension: last dot of the file name, lowercased. Must be .pdf or .docx.
 * 2. MIME type: .pdf expects application/pdf; .docx expects the docx MIME.
 *    Empty MIME or application/octet-stream is allowed. Conflicting known types are rejected.
 * 3. Size: <= 5MB.
 *
 * @param {File|{name: string, type?: string, size?: number}} file
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateCvFile(file) {
  if (!file || typeof file !== 'object') {
    return { ok: false, message: ERROR_UNSUPPORTED_TYPE };
  }

  // 1. Extension check
  const name = typeof file.name === 'string' ? file.name : '';
  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { ok: false, message: ERROR_UNSUPPORTED_TYPE };
  }

  const ext = name.slice(lastDotIndex).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, message: ERROR_UNSUPPORTED_TYPE };
  }

  // 2. MIME type check
  const mimeType = (file.type || '').trim().toLowerCase();
  const expectedMime = EXPECTED_MIME_TYPES[ext];
  const isAllowedMime =
    mimeType === expectedMime ||
    ALLOWED_GENERIC_MIME_TYPES.includes(mimeType);

  if (!isAllowedMime) {
    return { ok: false, message: ERROR_UNSUPPORTED_TYPE };
  }

  // 3. File size check
  const size = typeof file.size === 'number' ? file.size : 0;
  if (size > MAX_CV_FILE_SIZE) {
    return { ok: false, message: ERROR_FILE_TOO_LARGE };
  }

  return { ok: true };
}
