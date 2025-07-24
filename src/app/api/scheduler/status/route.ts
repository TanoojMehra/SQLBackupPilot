import { NextResponse } from "next/server";
import { scheduler } from "@/lib/scheduler";

export async function GET() {
  try {
    const scheduledTasks = scheduler.getScheduledTasks();
    
    return NextResponse.json({
      isInitialized: scheduledTasks.length > 0,
      scheduledTasksCount: scheduledTasks.length,
      tasks: scheduledTasks
    });
  } catch (error) {
    console.error("Scheduler status error:", error);
    
    // Return a safe default response instead of throwing
    return NextResponse.json({
      isInitialized: false,
      scheduledTasksCount: 0,
      tasks: [],
      error: error instanceof Error ? error.message : "Unknown scheduler error"
    });
  }
}

export async function POST() {
  try {
    console.log('\x1b[36m🔄 Manual scheduler initialization requested\x1b[0m');
    await scheduler.refreshAllSchedules();
    
    const scheduledTasks = scheduler.getScheduledTasks();
    
    return NextResponse.json({
      success: true,
      message: "Scheduler initialized successfully",
      scheduledTasksCount: scheduledTasks.length,
      tasks: scheduledTasks
    });
  } catch (error) {
    console.error('\x1b[31m❌ Manual scheduler initialization failed:\x1b[0m', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize scheduler" 
    }, { status: 500 });
  }
} 