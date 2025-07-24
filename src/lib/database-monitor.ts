import { PrismaClient } from "@/generated/prisma";
import mysql from 'mysql2/promise';
import { Client as PgClient } from 'pg';
import mssql from 'mssql';

const prisma = new PrismaClient();

class DatabaseMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  async checkDatabaseConnection(database: any): Promise<'connected' | 'disconnected'> {
    try {
      if (database.type === 'MYSQL') {
        try {
          const connection = await mysql.createConnection({
            host: database.host,
            port: database.port,
            user: database.username,
            password: database.password,
            database: database.name || undefined,
            connectTimeout: 5000,
          });
          await connection.ping();
          await connection.end();
          return 'connected';
        } catch (err) {
          console.error(`[DB MONITOR] MySQL connection failed for ${database.name}:`, (err as any)?.message);
          return 'disconnected';
        }
      }
      
      if (database.type === 'POSTGRES') {
        try {
          const client = new PgClient({
            host: database.host,
            port: database.port,
            user: database.username,
            password: database.password,
            database: database.name || undefined,
            connectionTimeoutMillis: 5000,
          });
          await client.connect();
          await client.end();
          return 'connected';
        } catch (err) {
          console.error(`[DB MONITOR] PostgreSQL connection failed for ${database.name}:`, (err as any)?.message);
          return 'disconnected';
        }
      }
      
      if (database.type === 'SQLSERVER') {
        try {
          const pool = await mssql.connect({
            server: database.host,
            port: database.port,
            user: database.username,
            password: database.password,
            database: database.name || undefined,
            options: { encrypt: false, trustServerCertificate: true },
            connectionTimeout: 5000,
          });
          await pool.close();
          return 'connected';
        } catch (err) {
          console.error(`[DB MONITOR] SQL Server connection failed for ${database.name}:`, (err as any)?.message);
          return 'disconnected';
        }
      }
      
      // For unsupported types, assume connected for now
      return 'connected';
    } catch (err) {
      console.error(`[DB MONITOR] Generic connection check failed for ${database.name}:`, (err as any)?.message);
      return 'disconnected';
    }
  }

  async monitorDatabases() {
    try {
      console.log('[DB MONITOR] Checking database connections...');
      
      const databases = await prisma.database.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          host: true,
          port: true,
          username: true,
          password: true,
          backupEnabled: true
        }
      });

      const connectionChecks = await Promise.allSettled(
        databases.map(async (db) => {
          const status = await this.checkDatabaseConnection(db);
          return { database: db, status };
        })
      );

      const results = connectionChecks
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<{ database: any; status: 'connected' | 'disconnected' }>).value);

      const connectedCount = results.filter(r => r.status === 'connected').length;
      const disconnectedDatabases = results.filter(r => r.status === 'disconnected');

      console.log(`[DB MONITOR] Status: ${connectedCount}/${results.length} databases connected`);
      
      if (disconnectedDatabases.length > 0) {
        console.warn('[DB MONITOR] Disconnected databases:', 
          disconnectedDatabases.map(r => `${r.database.name} (${r.database.host}:${r.database.port})`).join(', ')
        );
        
        // Here you could implement alerting logic, send notifications, etc.
        // For now, we'll just log the disconnected databases
      }

      return results;
    } catch (error) {
      console.error('[DB MONITOR] Error during monitoring:', error);
      return [];
    }
  }

  start(intervalMinutes: number = 10) {
    if (this.isRunning) {
      console.log('[DB MONITOR] Already running');
      return;
    }

    console.log(`[DB MONITOR] Starting database monitoring (every ${intervalMinutes} minutes)`);
    this.isRunning = true;
    
    // Run initial check
    this.monitorDatabases();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.monitorDatabases();
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[DB MONITOR] Database monitoring stopped');
  }

  isMonitoring() {
    return this.isRunning;
  }
}

export const databaseMonitor = new DatabaseMonitor(); 