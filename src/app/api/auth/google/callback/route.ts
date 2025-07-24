import { NextRequest, NextResponse } from "next/server";
import { googleOAuth } from "@/lib/google-oauth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      // Redirect to storage page with error
      return NextResponse.redirect(
        new URL(`/dashboard/storage?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/storage?error=No authorization code received', req.url)
      );
    }

    // Exchange code for tokens
    const tokens = await googleOAuth.getTokens(code);

    // In a real application, you would save these tokens to your database
    // For now, we'll redirect with the tokens as query parameters (not recommended for production)
    const tokenData = encodeURIComponent(JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      authenticated: true
    }));

    return NextResponse.redirect(
      new URL(`/dashboard/storage?google_tokens=${tokenData}`, req.url)
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL('/dashboard/storage?error=OAuth callback failed', req.url)
    );
  }
} 