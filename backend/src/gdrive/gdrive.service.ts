import { Injectable } from '@nestjs/common';

@Injectable()
export class GdriveService {
  private clientId = process.env.GDRIVE_CLIENT_ID || '';
  private clientSecret = process.env.GDRIVE_CLIENT_SECRET || '';
  private redirectUri = process.env.GDRIVE_REDIRECT_URI || 'http://localhost:3001/api/gdrive/callback';
  private folderId = process.env.GDRIVE_ACTIVITIES_FOLDER_ID || '';

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      access_type: 'offline',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<any> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    const data = await response.json() as any;
    if (data.error) throw new Error(data.error_description || data.error);
    return data;
  }

  async listActivityBooks(accessToken: string): Promise<any[]> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${this.folderId}'+in+parents&fields=files(id,name,size,modifiedTime,webViewLink)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json() as any;
    return data.files || [];
  }

  async listFolderContents(folderId: string, accessToken: string): Promise<any> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size,webViewLink)&orderBy=name`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json() as any;
    const files = data.files || [];
    return {
      folders: files.filter((f: any) => f.mimeType === 'application/vnd.google-apps.folder'),
      files: files.filter((f: any) => f.mimeType !== 'application/vnd.google-apps.folder'),
    };
  }

  getDirectLink(fileId: string): string { return `https://drive.google.com/file/d/${fileId}/view`; }
  getEmbedLink(fileId: string): string { return `https://drive.google.com/file/d/${fileId}/preview`; }
}
