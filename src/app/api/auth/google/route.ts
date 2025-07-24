import { NextResponse } from "next/server";
import { googleOAuth } from "@/lib/google-oauth";

export async function GET() {
  try {
    const authUrl = googleOAuth.getAuthUrl([
      'https://www.googleapis.com/auth/drive.file'
    ]);
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" }, 
      { status: 500 }
    );
  }
} 