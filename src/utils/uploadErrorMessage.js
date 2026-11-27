import { ERROR_FILE_TOO_LARGE, ERROR_UNSUPPORTED_TYPE } from './validateCvFile.js';

// Prefer actionable file feedback over a generic HTTP error, even if an older API
// omits its message. Service failures must not tell users their CV is invalid.
export function uploadErrorMessage(error) {
  const code = error?.data?.error?.code;
  if (code === 'UNSUPPORTED_TYPE') return ERROR_UNSUPPORTED_TYPE;
  if (code === 'FILE_TOO_LARGE' || error?.status === 413) return ERROR_FILE_TOO_LARGE;
  if (code === 'EMPTY_FILE') return 'The file is empty. Choose a text-based PDF or DOCX CV.';
  if (code === 'CORRUPTED_FILE') return 'This file could not be read. It may be damaged or password-protected. Upload another PDF or DOCX CV.';
  if (code === 'NO_TEXT') return 'No readable text was found. Upload a text-based PDF or DOCX CV; scanned images are not supported.';
  return error?.message || 'Failed to upload CV. Please try again.';
}
