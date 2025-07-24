import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { backupService } from "@/lib/backup-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { clearBackups = false } = body;

    console.log(`\x1b[36m🔄 Starting admin reset...\x1b[0m`);
    
    // Delete the database file
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    try {
      await fs.unlink(dbPath);
      console.log(`\x1b[32m✅ Deleted database file: ${dbPath}\x1b[0m`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn(`\x1b[33m⚠️  Could not delete database file: ${error.message}\x1b[0m`);
      }
    }

    // Clear backups if requested
    if (clearBackups) {
      console.log(`\x1b[36m🗑️  Clearing backup files as requested...\x1b[0m`);
      const backupResult = await backupService.clearAllBackups();
      if (!backupResult.success) {
        console.warn(`\x1b[33m⚠️  Backup cleanup failed: ${backupResult.error}\x1b[0m`);
        // Don't fail the entire reset if backup cleanup fails
      }
    } else {
      console.log(`\x1b[36mℹ️  Keeping backup files (clearBackups=false)\x1b[0m`);
    }

    console.log(`\x1b[32m✅ Admin reset completed successfully\x1b[0m`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`\x1b[31m❌ Admin reset failed:\x1b[0m`, error);
    return NextResponse.json({ error: "Failed to reset application." }, { status: 500 });
  }
} 