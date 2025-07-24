import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { hashPassword } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { email, role, password } = await req.json();
    const updateData: { email?: string; role?: "OWNER" | "ADMIN"; passwordHash?: string } = {};
    
    if (email) updateData.email = email;
    if (role) updateData.role = role as "OWNER" | "ADMIN";
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }
    
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: { id: true, email: true, role: true },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 