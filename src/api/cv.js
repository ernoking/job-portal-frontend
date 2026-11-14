import { USE_MOCK_API } from './config';
import { request } from './http';

// TODO(AJSP-5): confirm endpoints, request/response shape, file upload format (multipart) and error format with the backend team

export async function uploadCv(file) {
  if (USE_MOCK_API) {
    // In mock mode, simulate network delay and return fixture without making any network request
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      fileName: file.name,
      fileSize: file.size,
    };
  }

  const formData = new FormData();
  formData.append('cv', file);
  return await request('/api/cv/upload', {
    method: 'POST',
    body: formData,
  });
}


export async function listCvFiles() {
  if (USE_MOCK_API) return [];
  const result = await request('/api/cv');
  return result.files.map((file) => ({ id: file.id, fileName: file.original_name }));
}

export async function getCvDownloadUrl(cvId) {
  const result = await request(`/api/cv/${encodeURIComponent(cvId)}/download`);
  return result.url;
}
