import { NextRequest, NextResponse } from "next/server";

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get settings from database
    const settingsRecords = await prisma.settings.findMany();
    
    // Convert to key-value object
    const settings = settingsRecords.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
    
    // Provide defaults if no settings exist
    const defaultSettings = {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpFrom: "",
      environment: "development",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      ...settings
    };
    
    return NextResponse.json({ settings: defaultSettings });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { smtpHost, smtpPort, smtpUser, smtpFrom, smtpPassword, environment, timezone } = body;
    
    // Update or create settings
    const settingsToUpdate = [
      { key: 'smtpHost', value: smtpHost || '' },
      { key: 'smtpPort', value: smtpPort || 587 },
      { key: 'smtpUser', value: smtpUser || '' },
      { key: 'smtpFrom', value: smtpFrom || '' },
      { key: 'environment', value: environment || 'development' },
      { key: 'timezone', value: timezone || 'UTC' }
    ];
    
    // Only update SMTP password if provided
    if (smtpPassword) {
      settingsToUpdate.push({ key: 'smtpPassword', value: smtpPassword });
    }
    
    // Use upsert to update or create each setting
    for (const setting of settingsToUpdate) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 