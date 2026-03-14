import { baseRequestClient } from '#/api/request';

export namespace BackupApi {
  export interface ImportResult {
    code: number;
    data: null;
    message: string;
  }
}

export async function exportBackupApi() {
  const response = await baseRequestClient.get('/backup/export', {
    responseType: 'blob',
  });
  return response.data;
}

export async function importBackupApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return baseRequestClient.post<BackupApi.ImportResult>('/backup/import', formData);
}
