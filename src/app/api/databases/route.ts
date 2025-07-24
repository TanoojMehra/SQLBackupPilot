import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import mysql from 'mysql2/promise';
import { Client as PgClient } from 'pg';
import mssql from 'mssql';

const prisma = new PrismaClient();

// Helper function to check database connection status
async function checkDatabaseConnection(database: any): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    if (database.type === 'MYSQL') {
      try {
        console.log('[MYSQL CHECK]', {
          host: database.host,
          port: database.port,
          user: database.username,
          password: database.password ? '***' : '',
          database: database.name
        });
        const connection = await mysql.createConnection({
          host: database.host,
          port: database.port,
          user: database.username,
          password: database.password,
          database: database.name || undefined,
          connectTimeout: 10000,
        });
        await connection.ping();
        await connection.end();
        return 'connected';
      } catch (err) {
        console.error('[MYSQL CHECK FAIL]', {
          host: database.host,
          port: database.port,
          user: database.username,
          password: database.password ? '***' : '',
          database: database.name,
          error: (err as any)?.message
        });
        return 'disconnected';
      }
    }
    if (database.type === 'POSTGRES') {
      try {
        console.log('[PG CHECK]', {
          host: database.host,
          port: database.port,
          user: database.username,
          password: database.password ? '***' : '',
          database: database.name
        });
        const client = new PgClient({
          host: database.host,
          port: database.port,
          user: database.username,
          password: database.password,
          database: database.name || undefined,
          connectionTimeoutMillis: 10000,
        });
        await client.connect();
        await client.end();
        return 'connected';
      } catch (err) {
        console.error('[PG CHECK FAIL]', {
          host: database.host,
          port: database.port,
          user: database.username,
          password: database.password ? '***' : '',
          database: database.name,
          error: (err as any)?.message
        });
        return 'disconnected';
      }
    }
    if (database.type === 'SQLSERVER') {
      try {
        console.log('[SQLSERVER CHECK]', {
          host: database.host,
          port: database.port,
          user: database.username,
          password: database.password ? '***' : '',
          database: database.name
        });
        const pool = await mssql.connect({
          server: database.host,
          port: database.port,
          user: database.username,
          password: database.password,
          database: database.name || undefined,
          options: { encrypt: false, trustServerCertificate: true },
          connectionTimeout: 10000,
        });
        try { await pool.close(); } catch {}
        return 'connected';
      } catch (err) {
        console.error('[SQLSERVER CHECK FAIL]', {
          host: database.host,
          port: database.port,
          user: database.username,
          password: database.password ? '***' : '',
          database: database.name,
          error: (err as any)?.message
        });
        return 'disconnected';
      }
    }
    // TODO: Add more types as needed
    // Fallback: simulate status for non-MySQL/PG/SQLSERVER
    if (database.name.includes('staging') || database.host.includes('staging')) {
      return 'disconnected';
    }
    if (database.host.includes('error') || database.name.includes('error')) {
      return 'error';
    }
    return 'connected';
  } catch (err) {
    console.error('[GENERIC DB CHECK FAIL]', (err as any)?.message);
    return 'error';
  }
}

export async function GET() {
  try {
    const databases = await prisma.database.findMany({
      select: { 
        id: true, 
        name: true, 
        type: true, 
        host: true, 
        port: true, 
        username: true,
        password: true, // Include password for connection testing
        backupEnabled: true,
        scheduleId: true,
        storageId: true,
        createdAt: true
      },
      orderBy: { id: "asc" },
    });

    // Add connection status and real backup data for each database
    const databasesWithStatus = await Promise.all(
      databases.map(async (db) => {
        const status = await checkDatabaseConnection(db);
        
        // Get real backup count for this database
        const backupCount = await prisma.backupJob.count({
          where: { databaseId: db.id }
        });
        
        // Get last successful backup for this database
        const lastBackupJob = await prisma.backupJob.findFirst({
          where: { 
            databaseId: db.id,
            status: "SUCCESS"
          },
          orderBy: { finishedAt: "desc" }
        });
        
        const lastBackup = lastBackupJob?.finishedAt?.toISOString() || null;

        // Exclude password from response for security
        const { password, ...dbWithoutPassword } = db;
        return {
          ...dbWithoutPassword,
          status,
          backupCount,
          lastBackup
        };
      })
    );

    return NextResponse.json({ databases: databasesWithStatus });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { 
      name, 
      type, 
      host, 
      port, 
      username, 
      password, 
      backupEnabled, 
      scheduleId, 
      storageId 
    } = await req.json();
    
    // Test connection before creating - include password in test
    const testDatabase = { name, type, host, port, username, password };
    const connectionStatus = await checkDatabaseConnection(testDatabase);
    
    const database = await prisma.database.create({
      data: { 
        name, 
        type, 
        host, 
        port, 
        username, 
        password,
        backupEnabled: backupEnabled || false,
        scheduleId: scheduleId || null,
        storageId: storageId || null
      },
    });

    // Return database with status
    return NextResponse.json({ 
      database: {
        ...database,
        status: connectionStatus,
        backupCount: 0,
        lastBackup: null
      }
    });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 