import api from './api';

export const fileService = {
  async upload(fileAsset) {
    const formData = new FormData();
    formData.append('file', {
      uri: fileAsset.uri,
      type: fileAsset.type || 'application/octet-stream',
      name: fileAsset.fileName || fileAsset.name || `file_${Date.now()}`,
    });

    const response = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.file;
  },
};