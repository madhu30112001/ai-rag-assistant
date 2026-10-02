const API_URL = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.message || 'Request failed. Check the server and try again.'
    );
  return data;
}

export function listDocuments() {
  return request('/documents');
}

export function uploadDocuments(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  console.log('Uploading files:', files); // Log the files being uploaded
  return request('/documents/upload', { method: 'POST', body: formData });
}

export function askChat(message, history) {
  return request('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
}

export function deleteDocument(id) {
  return request(`/documents/${id}`, { method: 'DELETE' });
}
