import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function checkSetupWithAutoMigrate(attempt = 0) {
  try {
    const userCount = await prisma.user.count();
    console.log('[CHECK-SETUP] userCount:', userCount);
    return NextResponse.json({ 
      needsSetup: userCount === 0,
      userCount 
    });
  } catch (err: any) {
    if (attempt === 0) {
      try {
        console.log('[CHECK-SETUP] Migration needed, running prisma migrate...');
        execSync("pnpm prisma migrate dev --name auto-init --skip-seed", { stdio: "inherit" });
        return await checkSetupWithAutoMigrate(1);
      } catch (migrateErr) {
        console.error('[CHECK-SETUP] Migration failed:', migrateErr);
        return NextResponse.json({ error: "Failed to initialize database." }, { status: 500 });
      }
    }
    console.error('[CHECK-SETUP] Server error:', err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return await checkSetupWithAutoMigrate();
} 