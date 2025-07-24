import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, type, config } = await req.json();
    
    // Check for duplicate local paths (excluding current adapter)
    if (type === "LOCAL" && config.path) {
      const existingAdapters = await prisma.storageAdapter.findMany({
        where: { 
          type: "LOCAL",
          id: { not: Number(id) }
        }
      });
      
      const duplicateAdapter = existingAdapters.find(adapter => {
        const adapterConfig = adapter.config as any;
        return adapterConfig && adapterConfig.path === config.path;
      });
      
      if (duplicateAdapter) {
        return NextResponse.json({ 
          error: `A local storage adapter already exists for path: ${config.path}` 
        }, { status: 400 });
      }
    }
    
    const adapter = await prisma.storageAdapter.update({
      where: { id: Number(id) },
      data: { name, type, config },
    });
    return NextResponse.json({ adapter });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updateData = await req.json();
    
    // Check for duplicate local paths if updating a LOCAL storage type
    if (updateData.type === "LOCAL" && updateData.config?.path) {
      const existingAdapters = await prisma.storageAdapter.findMany({
        where: { 
          type: "LOCAL",
          id: { not: Number(id) }
        }
      });
      
      const duplicateAdapter = existingAdapters.find(adapter => {
        const adapterConfig = adapter.config as any;
        return adapterConfig && adapterConfig.path === updateData.config.path;
      });
      
      if (duplicateAdapter) {
        return NextResponse.json({ 
          error: `A local storage adapter already exists for path: ${updateData.config.path}` 
        }, { status: 400 });
      }
    }
    
    const adapter = await prisma.storageAdapter.update({
      where: { id: Number(id) },
      data: updateData,
    });
    return NextResponse.json({ adapter });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.storageAdapter.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 