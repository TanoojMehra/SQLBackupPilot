import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  // TODO: Implement actual restore logic
  return NextResponse.json({ success: true, jobId });
} 