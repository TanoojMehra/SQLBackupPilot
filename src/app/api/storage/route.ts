import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const adapters = await prisma.storageAdapter.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Add real backup counts and storage usage for each adapter
    const adaptersWithStats = await Promise.all(
      adapters.map(async (adapter) => {
        // Get backup count for this storage adapter
        const backupCount = await prisma.backupJob.count({
          where: { storageId: adapter.id }
        });
        
        let totalBytes = 0;
        let status = "disconnected";
        let totalSize = "0 B";
        
        if (adapter.type === "LOCAL") {
          // Check if directory is writable
          let dirPath = "/public/backups";
          if (adapter.config && typeof adapter.config === 'object' && 'path' in adapter.config) {
            dirPath = String((adapter.config as any).path);
          }
          const fullPath = path.join(process.cwd(), dirPath);
          try {
            await fs.access(fullPath, fs.constants.W_OK);
            status = "connected";
            // Sum all file sizes in the directory
            const files = await fs.readdir(fullPath);
            for (const file of files) {
              const stat = await fs.stat(path.join(fullPath, file));
              if (stat.isFile()) totalBytes += stat.size;
            }
          } catch {
            status = "disconnected";
          }
          totalSize = formatFileSize(totalBytes);
          console.log('[LOCAL STORAGE SIZE]', { totalBytes, totalSize });
        } else {
          // Handle SFTP, S3, Google Drive, etc.
          // Get total size of backups for this storage adapter from backup jobs
          const backupSizes = await prisma.backupJob.findMany({
            where: { 
              storageId: adapter.id,
              status: "SUCCESS",
              size: { not: null }
            },
            select: { size: true }
          });
          totalBytes = backupSizes.reduce((sum, backup) => sum + (backup.size || 0), 0);
          totalSize = formatFileSize(totalBytes);
          
          // Test connection for SFTP
          if (adapter.type === "SFTP") {
            try {
              const config = adapter.config as any;
              if (config.host && config.username) {
                const { SystemSftp } = await import('@/lib/system-sftp');
                
                // Check if SSH is available
                const sshCheck = await SystemSftp.checkSshAvailability();
                if (!sshCheck.available) {
                  status = "disconnected";
                } else if (config.password && sshCheck.error) {
                  // SSH available but sshpass missing for password auth
                  status = "disconnected";
                } else {
                  // Try to connect
                  const sftp = new SystemSftp({
                    host: config.host,
                    port: config.port || 22,
                    username: config.username,
                    password: config.password
                  });
                  
                  const result = await sftp.testConnection();
                  status = result.success ? "connected" : "disconnected";
                }
              } else {
                status = "disconnected";
              }
            } catch (error) {
              console.error(`[SFTP STATUS] Connection failed for ${adapter.name}:`, error);
              status = "disconnected";
            }
          } else {
            // Determine connection status based on recent successful backups for other types
            const recentSuccessfulBackup = await prisma.backupJob.findFirst({
              where: {
                storageId: adapter.id,
                status: "SUCCESS",
                finishedAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              }
            });
            status = recentSuccessfulBackup ? 'connected' : 'disconnected';
          }
        }
        return {
          ...adapter,
          backupCount,
          totalSize,
          status
        };
      })
    );

    return NextResponse.json({ adapters: adaptersWithStats });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = Math.round(bytes / Math.pow(1024, i) * 100) / 100;
  return size + ' ' + sizes[i];
}

export async function POST(req: NextRequest) {
  try {
    const { name, type, config } = await req.json();
    
    // Check for duplicate local paths
    if (type === "LOCAL" && config.path) {
      const existingAdapters = await prisma.storageAdapter.findMany({
        where: { type: "LOCAL" }
      });
      
      const duplicateAdapter = existingAdapters.find(adapter => {
        const adapterConfig = adapter.config as any;
        return adapterConfig && adapterConfig.path === config.path;
      });
      
      if (duplicateAdapter) {
        return NextResponse.json({ 
          error: `A local storage adapter already exists for path: ${config.path}` 
        }, { status: 400 });
      }
    }
    
    const adapter = await prisma.storageAdapter.create({
      data: { name, type, config },
    });
    return NextResponse.json({ adapter });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 