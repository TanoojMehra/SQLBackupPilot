import { NextRequest, NextResponse } from "next/server";
import { SystemSftp } from "@/lib/system-sftp";

export async function POST(req: NextRequest) {
  try {
    const { host, port, username, password, path } = await req.json();
    
    if (!host || !username) {
      return NextResponse.json({ error: "Host and username are required" }, { status: 400 });
    }
    
    // First check if SSH is available on the system
    const sshCheck = await SystemSftp.checkSshAvailability();
    if (!sshCheck.available) {
      return NextResponse.json({ 
        error: sshCheck.error,
        installInstructions: sshCheck.installInstructions 
      }, { status: 400 });
    }
    
    // If SSH is available but sshpass is missing and password is provided
    if (password && sshCheck.error) {
      return NextResponse.json({ 
        error: sshCheck.error,
        installInstructions: sshCheck.installInstructions 
      }, { status: 400 });
    }
    
    const sftp = new SystemSftp({
      host,
      port: port || 22,
      username,
      password
    });
    
    const result = await sftp.listDirectories(path || '/');
    
    if (result.success) {
      return NextResponse.json({ paths: result.data?.paths || [] });
    } else {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }
  } catch (error) {
    console.error("SFTP browse API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 