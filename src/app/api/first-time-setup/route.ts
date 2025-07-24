import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { hashPassword } from "@/lib/auth";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function firstTimeSetupWithAutoMigrate(req: NextRequest, attempt = 0) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    // Check if any user exists
    const userCount = await prisma.user.count();
    console.log('[FIRST-TIME-SETUP] userCount:', userCount);
    if (userCount > 0) {
      return NextResponse.json({ error: "Admin account already exists." }, { status: 400 });
    }
    // Hash password
    const passwordHash = await hashPassword(password);
    // Create user as OWNER
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "OWNER",
      },
    });
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    if (attempt === 0) {
      try {
        console.log('[FIRST-TIME-SETUP] Migration needed, running prisma migrate...');
        execSync("pnpm prisma migrate dev --name auto-init --skip-seed", { stdio: "inherit" });
        return await firstTimeSetupWithAutoMigrate(req, 1);
      } catch (migrateErr) {
        console.error('[FIRST-TIME-SETUP] Migration failed:', migrateErr);
        return NextResponse.json({ error: "Failed to initialize database." }, { status: 500 });
      }
    }
    console.error('[FIRST-TIME-SETUP] Server error:', err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return await firstTimeSetupWithAutoMigrate(req);
} 