// Server-side only SFTP operations
// This file should never be imported by client-side code

interface SftpConfig {
  host: string;
  username: string;
  password?: string;
  port?: number;
  privateKey?: string;
  passphrase?: string;
}

interface UploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export async function uploadToSftpServer(
  filename: string,
  fileBuffer: Buffer,
  config: SftpConfig,
  remotePath: string = '/'
): Promise<UploadResult> {
  try {
    // Use the SystemSftp implementation which uses system commands
    const { SystemSftp } = await import('./system-sftp');
    const sftp = new SystemSftp({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password
    });

    const uploadResult = await sftp.uploadFile(filename, fileBuffer, remotePath);
    
    if (uploadResult.success) {
      return {
        success: true,
        fileId: uploadResult.data?.remoteFilePath
      };
    } else {
      return {
        success: false,
        error: uploadResult.error || "SFTP upload failed"
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown SFTP error"
    };
  }
}