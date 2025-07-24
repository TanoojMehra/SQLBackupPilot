import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

interface SftpConfig {
  host: string;
  username: string;
  password?: string;
  port?: number;
  privateKey?: string;
  remotePath?: string;
}

interface SftpResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class SystemSftp {
  private config: SftpConfig;

  constructor(config: SftpConfig) {
    this.config = config;
  }

  /**
   * Check if SSH/SFTP is available on the system
   */
  static async checkSshAvailability(): Promise<{ available: boolean; error?: string; installInstructions?: string }> {
    try {
      // Try to run ssh command to check if it exists
      await execAsync('ssh -V');
      
      // Check for sshpass if password authentication is needed
      try {
        await execAsync('sshpass -V');
        return { available: true };
      } catch {
        const platform = process.platform;
        let installInstructions = '';
        
        switch (platform) {
          case 'darwin': // macOS
            installInstructions = `SSH is available but sshpass is missing for password authentication.
Install using Homebrew:
  brew install hudochenkov/sshpass/sshpass

Or use key-based authentication instead.`;
            break;
          case 'linux':
            installInstructions = `SSH is available but sshpass is missing for password authentication.
Install using your package manager:
  # Ubuntu/Debian:
  sudo apt-get install sshpass
  
  # CentOS/RHEL/Fedora:
  sudo yum install sshpass
  # or
  sudo dnf install sshpass

Or use key-based authentication instead.`;
            break;
          case 'win32':
            installInstructions = `SSH is available but sshpass is not available on Windows.
Please use key-based authentication or consider using WSL:
  1. Install WSL: https://docs.microsoft.com/en-us/windows/wsl/install
  2. Install sshpass in WSL: sudo apt-get install sshpass

Alternatively, use PowerShell with SSH keys.`;
            break;
        }
        
        return { 
          available: true, // SSH is available, just missing sshpass
          error: 'Password authentication requires sshpass',
          installInstructions 
        };
      }
    } catch (error) {
      const platform = process.platform;
      let installInstructions = '';
      
      switch (platform) {
        case 'darwin': // macOS
          installInstructions = `SSH is not installed. Install using:
1. Xcode Command Line Tools:
   xcode-select --install

2. Or using Homebrew:
   brew install openssh`;
          break;
        case 'linux':
          installInstructions = `SSH is not installed. Install using your package manager:
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install openssh-client sshpass

# CentOS/RHEL/Fedora:
sudo yum install openssh-clients sshpass
# or
sudo dnf install openssh-clients sshpass`;
          break;
        case 'win32':
          installInstructions = `SSH is not available. Install using:
1. Windows 10/11 (recommended):
   - Open Settings > Apps > Optional Features
   - Add "OpenSSH Client"
   
2. Or install Git for Windows (includes SSH):
   https://git-scm.com/download/win
   
3. Or use PowerShell:
   Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0`;
          break;
      }
      
      return {
        available: false,
        error: 'SSH is not installed on this system',
        installInstructions
      };
    }
  }

  /**
   * Test SFTP connection
   */
  async testConnection(): Promise<SftpResult> {
    try {
      const sshCheck = await SystemSftp.checkSshAvailability();
      if (!sshCheck.available) {
        return {
          success: false,
          error: `${sshCheck.error}\n\n${sshCheck.installInstructions}`
        };
      }

      const { host, username, password, port = 22 } = this.config;
      let command = '';

      if (password) {
        // Check if sshpass is available
        try {
          await execAsync('sshpass -V');
          command = `sshpass -p '${password}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p ${port} ${username}@${host} 'pwd'`;
        } catch {
          return {
            success: false,
            error: `Password authentication requires sshpass. ${sshCheck.installInstructions || 'Please install sshpass or use key-based authentication.'}`
          };
        }
      } else {
        // Key-based authentication
        command = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p ${port} ${username}@${host} 'pwd'`;
      }

      const result = await execAsync(command);
      return {
        success: true,
        data: { workingDirectory: result.stdout.trim() }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * List directories on remote server
   */
  async listDirectories(remotePath: string = '/'): Promise<SftpResult> {
    try {
      const { host, username, password, port = 22 } = this.config;
      let command = '';

      // Use a more specific command to list only directories
      const listCommand = `find '${remotePath}' -maxdepth 1 -type d -exec basename {} \\; 2>/dev/null | grep -v '^\\.$' | head -20`;

      if (password) {
        command = `sshpass -p '${password}' ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "${listCommand}"`;
      } else {
        command = `ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "${listCommand}"`;
      }

      const result = await execAsync(command);
      const directories = result.stdout
        .split('\n')
        .filter(line => line.trim())
        .filter(dirName => dirName !== '.' && dirName !== '..')
        .map(dirName => {
          const fullPath = remotePath.endsWith('/') ? `${remotePath}${dirName}` : `${remotePath}/${dirName}`;
          return fullPath.replace(/\/+/g, '/');
        });

      // Add parent directory if not at root
      const paths = [];
      if (remotePath !== '/' && remotePath !== '') {
        const parentPath = remotePath.substring(0, remotePath.lastIndexOf('/')) || '/';
        paths.push(`${parentPath} (parent)`);
      }
      
      // Add current directory subdirectories
      paths.push(...directories);

      return {
        success: true,
        data: { paths }
      };
    } catch (error: any) {
      // Fallback to simpler ls command if find doesn't work
      try {
        const { host, username, password, port = 22 } = this.config;
        let command = '';

        const fallbackCommand = `ls -1 '${remotePath}' 2>/dev/null | head -10`;

        if (password) {
          command = `sshpass -p '${password}' ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "${fallbackCommand}"`;
        } else {
          command = `ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "${fallbackCommand}"`;
        }

        const result = await execAsync(command);
        const items = result.stdout
          .split('\n')
          .filter(line => line.trim())
          .map(item => {
            const fullPath = remotePath.endsWith('/') ? `${remotePath}${item}` : `${remotePath}/${item}`;
            return fullPath.replace(/\/+/g, '/');
          });

        // Add parent directory if not at root
        const paths = [];
        if (remotePath !== '/' && remotePath !== '') {
          const parentPath = remotePath.substring(0, remotePath.lastIndexOf('/')) || '/';
          paths.push(`${parentPath} (parent)`);
        }
        paths.push(...items);

        return {
          success: true,
          data: { paths }
        };
      } catch (fallbackError: any) {
        return {
          success: false,
          error: `Browse failed: ${fallbackError.message}`
        };
      }
    }
  }

  /**
   * Upload file to SFTP server
   */
  async uploadFile(filename: string, fileBuffer: Buffer, remotePath: string = '/'): Promise<SftpResult> {
    let tempFilePath = '';
    
    try {
      const { host, username, password, port = 22 } = this.config;
      
      // Create temporary file
      const tempDir = await mkdir(join(tmpdir(), 'sftp-upload'), { recursive: true });
      tempFilePath = join(tmpdir(), 'sftp-upload', filename);
      await writeFile(tempFilePath, fileBuffer);

      // Ensure remote directory exists
      const remoteDir = remotePath.endsWith('/') ? remotePath : `${remotePath}/`;
      let mkdirCommand = '';
      
      if (password) {
        mkdirCommand = `sshpass -p '${password}' ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "mkdir -p '${remoteDir}'"`;
      } else {
        mkdirCommand = `ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "mkdir -p '${remoteDir}'"`;
      }

      try {
        await execAsync(mkdirCommand);
      } catch (error) {
        console.log('[SFTP] Directory creation might have failed (may already exist):', error);
      }

      // Upload file using scp
      const remoteFilePath = `${remoteDir}${filename}`.replace(/\/+/g, '/');
      let uploadCommand = '';

      if (password) {
        uploadCommand = `sshpass -p '${password}' scp -o StrictHostKeyChecking=no -P ${port} '${tempFilePath}' ${username}@${host}:'${remoteFilePath}'`;
      } else {
        uploadCommand = `scp -o StrictHostKeyChecking=no -P ${port} '${tempFilePath}' ${username}@${host}:'${remoteFilePath}'`;
      }

      await execAsync(uploadCommand);

      console.log(`[SFTP] Successfully uploaded ${filename} to ${remoteFilePath}`);

      return {
        success: true,
        data: { 
          remoteFilePath,
          size: fileBuffer.length
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }
} 