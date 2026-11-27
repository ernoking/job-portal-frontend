import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCvFile, MAX_CV_FILE_SIZE } from '../src/utils/validateCvFile.js';
import { uploadErrorMessage } from '../src/utils/uploadErrorMessage.js';

test('CV selection accepts PDF/DOCX up to exactly 5 MiB and rejects invalid choices', () => {
  for (const file of [
    { name: 'cv.PDF', type: 'application/pdf', size: MAX_CV_FILE_SIZE },
    { name: 'cv.docx', type: '', size: 100 },
  ]) assert.equal(validateCvFile(file).ok, true);
  for (const file of [
    { name: 'cv.txt', type: 'text/plain', size: 100 },
    { name: 'cv.pdf', type: 'text/plain', size: 100 },
    { name: 'cv.pdf', type: 'application/pdf', size: MAX_CV_FILE_SIZE + 1 },
  ]) assert.equal(validateCvFile(file).ok, false);
});

test('backend file errors give actionable format, size and unreadable-file feedback', () => {
  const message = (code) => uploadErrorMessage({ status: 422, data: { error: { code } } });
  assert.match(message('UNSUPPORTED_TYPE'), /PDF or DOCX/);
  assert.match(message('FILE_TOO_LARGE'), /5MB/);
  assert.match(message('CORRUPTED_FILE'), /damaged or password-protected/);
  assert.match(message('NO_TEXT'), /scanned images are not supported/);
  assert.match(message('EMPTY_FILE'), /empty/);
  assert.match(uploadErrorMessage({ status: 413 }), /5MB/);
});

test('service, usage and connection errors retain their distinct messages', () => {
  for (const [status, message] of [[503, 'AI unavailable; your CV is saved.'], [429, 'Your allowance resets tomorrow.'], [0, 'Check your connection.']]) {
    assert.equal(uploadErrorMessage({ status, message }), message);
  }
  assert.match(uploadErrorMessage(null), /try again/);
});
