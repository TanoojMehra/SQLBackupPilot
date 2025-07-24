import { NextRequest, NextResponse } from "next/server";
import { databaseMonitor } from "@/lib/database-monitor";

export async function GET() {
  try {
    const isRunning = databaseMonitor.isMonitoring();
    return NextResponse.json({ 
      isRunning,
      message: isRunning ? "Database monitoring is active" : "Database monitoring is stopped"
    });
  } catch (error) {
    console.error("Database monitor status check error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, intervalMinutes } = await req.json();
    
    if (action === 'start') {
      const interval = intervalMinutes || 5; // Default to 5 minutes
      databaseMonitor.start(interval);
      return NextResponse.json({ 
        success: true, 
        message: `Database monitoring started (checking every ${interval} minutes)`
      });
    } else if (action === 'stop') {
      databaseMonitor.stop();
      return NextResponse.json({ 
        success: true, 
        message: "Database monitoring stopped"
      });
    } else if (action === 'check') {
      const results = await databaseMonitor.monitorDatabases();
      return NextResponse.json({ 
        success: true, 
        message: "Manual database check completed",
        results
      });
    } else {
      return NextResponse.json({ 
        error: "Invalid action. Use 'start', 'stop', or 'check'" 
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Database monitor control error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 