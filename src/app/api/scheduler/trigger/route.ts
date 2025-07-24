import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { backupService } from "@/lib/backup-service";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { scheduleId } = await req.json();
    
    if (!scheduleId) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }

    console.log(`\x1b[36m🔧 Manual backup trigger for schedule ID: ${scheduleId}\x1b[0m`);

    // Get the schedule and its databases
    const schedule = await prisma.backupSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        databases: true
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    if (!schedule.enabled) {
      return NextResponse.json({ error: "Schedule is disabled" }, { status: 400 });
    }

    const results = [];

    // Run backup for each database using this schedule
    for (const database of schedule.databases) {
      try {
        console.log(`\x1b[34m🔄 Triggering backup for database: ${database.name}\x1b[0m`);
        
        const result = await backupService.createBackup({
          databaseId: database.id,
          storageId: database.storageId || undefined
        });

        results.push({
          databaseId: database.id,
          databaseName: database.name,
          success: result.success,
          error: result.error,
          filePath: result.filePath,
          size: result.size
        });

        if (result.success) {
          console.log(`\x1b[32m✅ Manual backup completed for ${database.name}\x1b[0m`);
        } else {
          console.error(`\x1b[31m❌ Manual backup failed for ${database.name}: ${result.error}\x1b[0m`);
        }
      } catch (error) {
        console.error(`\x1b[31m💥 Manual backup error for ${database.name}:\x1b[0m`, error);
        results.push({
          databaseId: database.id,
          databaseName: database.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Manual backup completed: ${successCount}/${totalCount} successful`,
      results
    });
  } catch (error) {
    console.error('\x1b[31m💥 Manual backup trigger failed:\x1b[0m', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to trigger backup" 
    }, { status: 500 });
  }
} 