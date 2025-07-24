import * as cron from 'node-cron';
import { PrismaClient } from "@/generated/prisma";
import { backupService } from './backup-service';

const prisma = new PrismaClient();

interface ScheduledTask {
  scheduleId: number;
  task: cron.ScheduledTask;
}

class SchedulerService {
  private scheduledTasks: Map<number, ScheduledTask> = new Map();

  async initialize() {
    console.log('\x1b[36m🚀 Initializing backup scheduler...\x1b[0m');
    
    try {
      // Load all enabled schedules from database
      const schedules = await prisma.backupSchedule.findMany({
        where: { enabled: true },
        include: {
          databases: true // Get all databases that use this schedule
        }
      });

      console.log(`\x1b[33m📋 Found ${schedules.length} enabled schedules\x1b[0m`);

      // Schedule each backup
      for (const schedule of schedules) {
        this.scheduleBackup(schedule);
      }

      console.log(`\x1b[32m✅ Successfully initialized ${schedules.length} backup schedules\x1b[0m`);
    } catch (error) {
      console.error('\x1b[31m❌ Failed to initialize scheduler:\x1b[0m', error);
      throw error;
    }
  }

  scheduleBackup(schedule: any) {
    try {
      // Validate CRON expression
      if (!cron.validate(schedule.cron)) {
        console.error(`\x1b[31m❌ Invalid CRON expression for schedule ${schedule.id}: ${schedule.cron}\x1b[0m`);
        return;
      }

      // Remove existing task if it exists
      this.unscheduleBackup(schedule.id);

      // Get databases that use this schedule
      const databasesUsingSchedule = schedule.databases || [];
      
      if (databasesUsingSchedule.length === 0) {
        console.log(`\x1b[33m⚠️  No databases assigned to schedule "${schedule.name}" (${schedule.cron})\x1b[0m`);
        return;
      }

      // Create new scheduled task
      const task = cron.schedule(schedule.cron, async () => {
        console.log(`\x1b[36m⏰ Running scheduled backup: "${schedule.name}" (${schedule.cron})\x1b[0m`);
        console.log(`\x1b[36m📊 Backing up ${databasesUsingSchedule.length} database(s)\x1b[0m`);
        
        // Run backup for each database using this schedule
        for (const database of databasesUsingSchedule) {
          try {
            console.log(`\x1b[34m🔄 Starting backup for database: ${database.name}\x1b[0m`);
            
            const result = await backupService.createBackup({
              databaseId: database.id,
              storageId: database.storageId
            });

            if (result.success) {
              console.log(`\x1b[32m✅ Backup completed successfully for ${database.name}\x1b[0m`);
              console.log(`\x1b[32m   📁 File: ${result.filePath}\x1b[0m`);
              console.log(`\x1b[32m   📦 Size: ${this.formatFileSize(result.size || 0)}\x1b[0m`);
            } else {
              console.error(`\x1b[31m❌ Backup failed for ${database.name}: ${result.error}\x1b[0m`);
            }
          } catch (error) {
            console.error(`\x1b[31m💥 Backup error for ${database.name}:\x1b[0m`, error);
          }
        }
      }, {
        timezone: "UTC"
      });

      // Store the task
      this.scheduledTasks.set(schedule.id, {
        scheduleId: schedule.id,
        task
      });

      console.log(`\x1b[32m📅 Scheduled "${schedule.name}" with CRON: ${schedule.cron}\x1b[0m`);
                     console.log(`\x1b[32m   💾 Will backup ${databasesUsingSchedule.length} database(s): ${databasesUsingSchedule.map((db: any) => db.name).join(', ')}\x1b[0m`);
    } catch (error) {
      console.error(`\x1b[31m❌ Failed to schedule backup for schedule ${schedule.id}:\x1b[0m`, error);
    }
  }

  unscheduleBackup(scheduleId: number) {
    const scheduledTask = this.scheduledTasks.get(scheduleId);
    if (scheduledTask) {
      scheduledTask.task.stop();
      scheduledTask.task.destroy();
      this.scheduledTasks.delete(scheduleId);
      console.log(`\x1b[33m🗑️  Unscheduled backup for schedule ${scheduleId}\x1b[0m`);
    }
  }

  async refreshSchedule(scheduleId: number) {
    const schedule = await prisma.backupSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        databases: true
      }
    });

    if (!schedule) {
      this.unscheduleBackup(scheduleId);
      return;
    }

    if (schedule.enabled) {
      this.scheduleBackup(schedule);
    } else {
      this.unscheduleBackup(scheduleId);
    }
  }

  async refreshAllSchedules() {
    console.log('\x1b[36m🔄 Refreshing all backup schedules...\x1b[0m');
    
    // Stop all current tasks
    for (const [scheduleId] of this.scheduledTasks) {
      this.unscheduleBackup(scheduleId);
    }

    // Reinitialize
    await this.initialize();
  }

  getScheduledTasks() {
    return Array.from(this.scheduledTasks.values()).map(task => ({
      scheduleId: task.scheduleId,
      isRunning: task.task.getStatus() === 'scheduled'
    }));
  }

  validateCronExpression(cronExpression: string): boolean {
    return cron.validate(cronExpression);
  }

  getNextRun(cronExpression: string): Date | null {
    try {
      if (!cron.validate(cronExpression)) {
        return null;
      }

      // Parse cron expression: "minute hour day month dayOfWeek"
      const parts = cronExpression.split(' ');
      if (parts.length !== 5) return null;

      const [minute, hour, day, month, dayOfWeek] = parts;
      const now = new Date();
      
      // Simple calculation for common patterns
      if (minute !== '*' && hour !== '*') {
        const targetMinute = parseInt(minute);
        const targetHour = parseInt(hour);
        
        const nextRun = new Date(now);
        nextRun.setHours(targetHour, targetMinute, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        
        return nextRun;
      }

      // Fallback for complex expressions
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      return nextHour;
    } catch {
      return null;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = Math.round(bytes / Math.pow(1024, i) * 100) / 100;
    return size + ' ' + sizes[i];
  }
}

export const scheduler = new SchedulerService();

// Initialize scheduler on module load
scheduler.initialize().catch((error) => {
  console.error('\x1b[31m❌ Failed to initialize scheduler:\x1b[0m', error);
}); 