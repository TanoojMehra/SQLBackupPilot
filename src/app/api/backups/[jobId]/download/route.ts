import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { readFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId: jobIdParam } = await params;
    const jobId = parseInt(jobIdParam);
    
    // Get the backup job
    const backupJob = await prisma.backupJob.findUnique({
      where: { id: jobId },
      include: {
        database: { select: { name: true } }
      }
    });

    if (!backupJob) {
      return NextResponse.json({ error: "Backup job not found" }, { status: 404 });
    }

    if (backupJob.status !== "SUCCESS" || !backupJob.filePath) {
      return NextResponse.json({ error: "Backup file not available" }, { status: 400 });
    }

    // Read the backup file
    const fullFilePath = path.join(process.cwd(), backupJob.filePath);
    
    try {
      const fileBuffer = await readFile(fullFilePath);
      
      // Set appropriate headers for file download
      const headers = new Headers();
      headers.set('Content-Type', 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${backupJob.database.name}_backup.sql"`);
      headers.set('Content-Length', fileBuffer.length.toString());

      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      });
    } catch (fileError) {
      console.error("File read error:", fileError);
      return NextResponse.json({ error: "Backup file not found on disk" }, { status: 404 });
    }
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 