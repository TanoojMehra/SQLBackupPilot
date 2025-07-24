import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function GET() {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("sbp_session")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    
    // Get user profile from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get last login from audit logs
    const lastActivity = await prisma.auditLog.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    const profile = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      lastLogin: lastActivity?.createdAt?.toISOString() || user.createdAt.toISOString(),
      status: "active"
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 