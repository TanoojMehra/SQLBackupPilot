import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { scheduler } from "@/lib/scheduler";

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = Number(idString);
    if (!id) {
      return NextResponse.json({ error: "Invalid schedule ID." }, { status: 400 });
    }
    await prisma.backupSchedule.delete({ where: { id } });
    await scheduler.refreshAllSchedules();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete schedule." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!id) {
      return NextResponse.json({ error: "Invalid schedule ID." }, { status: 400 });
    }
    const { name, cron, retention, enabled } = await req.json();
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (cron !== undefined) updateData.cron = cron;
    if (retention !== undefined) updateData.retention = retention;
    if (enabled !== undefined) updateData.enabled = enabled;
    const updated = await prisma.backupSchedule.update({
      where: { id },
      data: updateData,
    });
    await scheduler.refreshSchedule(id);
    return NextResponse.json({ schedule: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update schedule." }, { status: 500 });
  }
} 