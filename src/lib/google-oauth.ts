import { google } from 'googleapis';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GoogleOAuthService {
  private oauth2Client: any;

  constructor(config: GoogleOAuthConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  getAuthUrl(scopes: string[] = ['https://www.googleapis.com/auth/drive.file']): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getTokens(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      return tokens;
    } catch (error) {
      throw new Error(`Failed to get tokens: ${error}`);
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error}`);
    }
  }

  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  getDriveClient() {
    return google.drive({ version: 'v3', auth: this.oauth2Client });
  }
}

// Default configuration - in production, these should come from environment variables
const defaultConfig: GoogleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  redirectUri: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com/api/auth/google/callback'
    : 'http://localhost:3001/api/auth/google/callback'
};

export const googleOAuth = new GoogleOAuthService(defaultConfig);

export async function uploadToGoogleDrive(
  filename: string,
  fileBuffer: Buffer,
  tokens: any,
  folderId?: string
) {
  try {
    const oauth = new GoogleOAuthService(defaultConfig);
    oauth.setCredentials(tokens);
    const drive = oauth.getDriveClient();

    const fileMetadata: any = {
      name: filename,
    };

    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    const media = {
      mimeType: 'application/sql',
      body: fileBuffer,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,size',
    });

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      size: response.data.size
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
} 