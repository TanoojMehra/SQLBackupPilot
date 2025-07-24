import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { scheduler } from "@/lib/scheduler";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const schedules = await prisma.backupSchedule.findMany({
      include: { 
        databases: { select: { id: true, name: true, type: true } }
      },
      orderBy: { id: "asc" },
    });
    
    // Add real backup data for each schedule
    const schedulesWithRealData = await Promise.all(
      schedules.map(async (schedule) => {
        // Get real backup count for databases using this schedule
        const backupCount = await prisma.backupJob.count({
          where: {
            database: {
              scheduleId: schedule.id
            }
          }
        });
        
        // Get last backup run for databases using this schedule
        const lastBackupJob = await prisma.backupJob.findFirst({
          where: {
            database: {
              scheduleId: schedule.id
            }
          },
          orderBy: { startedAt: "desc" }
        });
        
        const lastRun = lastBackupJob?.startedAt?.toISOString() || null;
        
        // Calculate next run using scheduler's method
        const nextRunDate = schedule.enabled 
          ? scheduler.getNextRun(schedule.cron)
          : null;
        const nextRun = nextRunDate?.toISOString() || null;
        
        return {
          ...schedule,
          databaseCount: schedule.databases.length,
          nextRun,
          lastRun,
          status: schedule.enabled ? 'active' : 'paused',
          backupCount
        };
      })
    );
    
    return NextResponse.json({ schedules: schedulesWithRealData });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, cron, retention, enabled } = await req.json();
    
    if (!name || !cron || retention === undefined) {
      return NextResponse.json(
        { error: "All fields are required." }, 
        { status: 400 }
      );
    }
    
    const schedule = await prisma.backupSchedule.create({
      data: {
        name,
        cron,
        retention,
        enabled: enabled !== undefined ? enabled : true,
      },
      include: {
        database: { select: { name: true, type: true } }
      }
    });

    // Refresh the scheduler to include the new schedule
    await scheduler.refreshSchedule(schedule.id);
    
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Schedule creation error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 