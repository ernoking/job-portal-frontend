// TODO(AJSP-5): confirm endpoints, request/response shape, file upload format (multipart) and error format with the backend team

export async function uploadCv(file) {
  try {
    const formData = new FormData();
    formData.append('cv', file);
    const res = await fetch('/api/cv/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch {
    // Until backend endpoint is ready, simulate network delay and return success
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      fileName: file.name,
      fileSize: file.size,
    };
  }
}
