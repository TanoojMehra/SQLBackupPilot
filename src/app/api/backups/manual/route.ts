import { NextRequest, NextResponse } from "next/server";
import { backupService } from "@/lib/backup-service";

export async function POST(req: NextRequest) {
  try {
    const { databaseId, storageId } = await req.json();
    
    if (!databaseId) {
      return NextResponse.json(
        { error: "Database ID is required." }, 
        { status: 400 }
      );
    }
    
    const result = await backupService.createBackup({ databaseId, storageId });
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: "Manual backup started successfully",
        filePath: result.filePath,
        size: result.size
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Backup failed" }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Manual backup error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 