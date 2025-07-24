import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);
      if (stat.isFile()) {
        totalSize += stat.size;
      } else if (stat.isDirectory()) {
        totalSize += await calculateDirectorySize(itemPath);
      }
    }
  } catch (error) {
    // Directory might not exist or be accessible
  }
  return totalSize;
}

export async function GET() {
  try {
    // Get basic counts
    const [
      totalDatabases,
      totalBackups,
      successfulBackups,
      failedBackups,
      activeSchedules,
      totalStorageAdapters,
      recentSuccessfulBackups,
      failedBackupIncidents,
      connectionIncidents
    ] = await Promise.all([
      // Total databases
      prisma.database.count(),
      
      // Total backups
      prisma.backupJob.count(),
      
      // Successful backups
      prisma.backupJob.count({
        where: { status: "SUCCESS" }
      }),
      
      // Failed backups
      prisma.backupJob.count({
        where: { status: "FAILED" }
      }),
      
      // Active schedules
      prisma.backupSchedule.count({
        where: { enabled: true }
      }),
      
      // Total storage adapters
      prisma.storageAdapter.count(),
      
      // Recent successful backups only (last 10)
      prisma.backupJob.findMany({
        take: 10,
        where: { status: "SUCCESS" },
        orderBy: { startedAt: "desc" },
        include: {
          database: { select: { name: true } }
        }
      }),
      
      // Failed backup incidents
      prisma.backupJob.findMany({
        take: 5,
        where: { status: "FAILED" },
        orderBy: { startedAt: "desc" },
        include: {
          database: { select: { name: true } }
        }
      }),
      
      // Connection incidents from audit logs (errors and warnings)
      prisma.auditLog.findMany({
        take: 5,
        where: {
          OR: [
            { action: { contains: "connection" } },
            { action: { contains: "error" } },
            { action: { contains: "fail" } },
            { details: { contains: "connection" } },
            { details: { contains: "timeout" } },
            { details: { contains: "refused" } }
          ]
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true } }
        }
      })
    ]);

    // Calculate storage used with proper unit formatting
    let totalStorageBytes = 0;
    const adapters = await prisma.storageAdapter.findMany();
    
    for (const adapter of adapters) {
      if (adapter.type === "LOCAL") {
        // Sum all files recursively in /public/backups for LOCAL storage
        try {
          let dirPath = "/public/backups";
          if (adapter.config && typeof adapter.config === 'object' && 'path' in adapter.config) {
            dirPath = String((adapter.config as any).path);
          }
          const localPath = path.join(process.cwd(), dirPath);
          totalStorageBytes += await calculateDirectorySize(localPath);
        } catch (error) {
          console.log(`[DASHBOARD] Could not calculate size for local storage ${adapter.name}:`, error);
        }
      } else {
        // Sum backupJob sizes for this storageId
        const backupSizes = await prisma.backupJob.findMany({
          where: {
            storageId: adapter.id,
            status: "SUCCESS",
            size: { not: null }
          },
          select: { size: true }
        });
        totalStorageBytes += backupSizes.reduce((sum, backup) => sum + (backup.size || 0), 0);
      }
    }
    const storageUsed = formatFileSize(totalStorageBytes);
    console.log('[DASHBOARD STORAGE USED]', { totalStorageBytes, storageUsed });

    // Get next scheduled backup
    const nextSchedule = await prisma.backupSchedule.findFirst({
      where: { enabled: true },
      include: { database: { select: { name: true } } },
      orderBy: { id: "asc" } // In a real app, you'd calculate actual next run time
    });

    // Format recent successful backups
    const formattedRecentBackups = recentSuccessfulBackups.map(backup => ({
      id: backup.id,
      database: backup.database.name,
      status: backup.status.toLowerCase(),
      startTime: backup.startedAt.toISOString(),
      duration: backup.finishedAt 
        ? formatDuration(backup.finishedAt.getTime() - backup.startedAt.getTime())
        : "Running...",
      size: formatFileSize(backup.size || 0)
    }));

    // Format incidents (failed backups and connection issues)
    const incidents: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: string;
      status: string;
    }> = [];
    
    // Add failed backup incidents
    failedBackupIncidents.forEach(backup => {
      incidents.push({
        id: `backup-${backup.id}`,
        type: 'backup',
        message: `Backup failed for ${backup.database.name}${backup.log ? ': ' + backup.log.substring(0, 100) : ''}`,
        timestamp: formatTimeAgo(backup.startedAt),
        status: 'error'
      });
    });
    
    // Add connection incidents
    connectionIncidents.forEach(log => {
      incidents.push({
        id: `connection-${log.id}`,
        type: 'alert',
        message: log.details || log.action,
        timestamp: formatTimeAgo(log.createdAt),
        status: 'warning'
      });
    });
    
    // Sort incidents by timestamp (most recent first)
    incidents.sort((a, b) => {
      // This is a simple sort, in production you'd want to sort by actual date
      return b.id.localeCompare(a.id);
    });

    // Calculate next scheduled backup time (simplified)
    const nextScheduled = nextSchedule 
      ? `Next: ${nextSchedule.database?.name || 'Unknown'} backup`
      : "No schedules active";

    const stats = {
      totalDatabases,
      totalBackups,
      successfulBackups,
      failedBackups,
      storageUsed,
      nextScheduled,
      activeSchedules,
      totalStorageAdapters
    };

    return NextResponse.json({
      stats,
      recentBackups: formattedRecentBackups,
      recentActivity: incidents.slice(0, 10) // Show top 10 incidents
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
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

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

function determineActivityType(action: string): string {
  if (action.includes('backup')) return 'backup';
  if (action.includes('restore')) return 'restore';
  if (action.includes('schedule')) return 'schedule';
  if (action.includes('error') || action.includes('fail')) return 'alert';
  return 'info';
} 