// Comprehensive error logging system for SQLBackupPilot

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export enum LogCategory {
  AUTH = 'AUTH',
  BACKUP = 'BACKUP',
  DATABASE = 'DATABASE',
  STORAGE = 'STORAGE',
  SCHEDULER = 'SCHEDULER',
  API = 'API',
  SYSTEM = 'SYSTEM',
  USER = 'USER'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: number;
  requestId?: string;
  stack?: string;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const userInfo = entry.userId ? ` [User:${entry.userId}]` : '';
    const requestInfo = entry.requestId ? ` [Req:${entry.requestId}]` : '';
    
    return `[${timestamp}] ${entry.level} [${entry.category}]${userInfo}${requestInfo} ${entry.message}`;
  }

  private log(level: LogLevel, category: LogCategory, message: string, details?: any, userId?: number, requestId?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
      userId,
      requestId,
      stack: level === LogLevel.ERROR ? new Error().stack : undefined
    };

    const formattedMessage = this.formatMessage(entry);

    // Console logging
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, details || '');
        if (entry.stack) console.error('Stack:', entry.stack);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, details || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, details || '');
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedMessage, details || '');
        }
        break;
    }

    // In production, you might want to send logs to external service
    // this.sendToExternalLogger(entry);
  }

  // Authentication related logs
  auth = {
    loginSuccess: (userId: number, email: string, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.AUTH, `User login successful: ${email}`, { userId, email }, userId, requestId);
    },
    loginFailed: (email: string, reason: string, requestId?: string) => {
      this.log(LogLevel.WARN, LogCategory.AUTH, `Login failed for ${email}: ${reason}`, { email, reason }, undefined, requestId);
    },
    logout: (userId: number, email: string, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.AUTH, `User logout: ${email}`, { userId, email }, userId, requestId);
    },
    passwordChange: (userId: number, email: string, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.AUTH, `Password changed for user: ${email}`, { userId, email }, userId, requestId);
    },
    tokenError: (error: string, requestId?: string) => {
      this.log(LogLevel.ERROR, LogCategory.AUTH, `Token validation error: ${error}`, { error }, undefined, requestId);
    }
  };

  // Backup operation logs
  backup = {
    started: (databaseId: number, databaseName: string, userId?: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.BACKUP, `Backup started for database: ${databaseName}`, { databaseId, databaseName }, userId, requestId);
    },
    completed: (databaseId: number, databaseName: string, size: number, duration: number, userId?: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.BACKUP, `Backup completed for database: ${databaseName}`, { databaseId, databaseName, size, duration }, userId, requestId);
    },
    failed: (databaseId: number, databaseName: string, error: string, userId?: number, requestId?: string) => {
      this.log(LogLevel.ERROR, LogCategory.BACKUP, `Backup failed for database: ${databaseName} - ${error}`, { databaseId, databaseName, error }, userId, requestId);
    },
    manualTriggered: (databaseId: number, databaseName: string, userId: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.BACKUP, `Manual backup triggered for database: ${databaseName}`, { databaseId, databaseName }, userId, requestId);
    },
    scheduledTriggered: (scheduleId: number, scheduleName: string, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.BACKUP, `Scheduled backup triggered: ${scheduleName}`, { scheduleId, scheduleName }, undefined, requestId);
    }
  };

  // Database connection logs
  database = {
    connectionSuccess: (databaseId: number, databaseName: string, host: string, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.DATABASE, `Database connection successful: ${databaseName} at ${host}`, { databaseId, databaseName, host }, undefined, requestId);
    },
    connectionFailed: (databaseId: number, databaseName: string, host: string, error: string, requestId?: string) => {
      this.log(LogLevel.ERROR, LogCategory.DATABASE, `Database connection failed: ${databaseName} at ${host} - ${error}`, { databaseId, databaseName, host, error }, undefined, requestId);
    },
    connectionTest: (host: string, type: string, success: boolean, error?: string, requestId?: string) => {
      if (success) {
        this.log(LogLevel.INFO, LogCategory.DATABASE, `Database connection test successful: ${type} at ${host}`, { host, type }, undefined, requestId);
      } else {
        this.log(LogLevel.WARN, LogCategory.DATABASE, `Database connection test failed: ${type} at ${host} - ${error}`, { host, type, error }, undefined, requestId);
      }
    },
    added: (databaseId: number, databaseName: string, type: string, userId: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.DATABASE, `Database added: ${databaseName} (${type})`, { databaseId, databaseName, type }, userId, requestId);
    },
    deleted: (databaseId: number, databaseName: string, userId: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.DATABASE, `Database deleted: ${databaseName}`, { databaseId, databaseName }, userId, requestId);
    }
  };

  // Storage operation logs
  storage = {
    connected: (storageId: number, storageName: string, type: string, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.STORAGE, `Storage adapter connected: ${storageName} (${type})`, { storageId, storageName, type }, undefined, requestId);
    },
    connectionFailed: (storageId: number, storageName: string, type: string, error: string, requestId?: string) => {
      this.log(LogLevel.ERROR, LogCategory.STORAGE, `Storage adapter connection failed: ${storageName} (${type}) - ${error}`, { storageId, storageName, type, error }, undefined, requestId);
    },
    uploadSuccess: (storageId: number, storageName: string, fileName: string, size: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.STORAGE, `File uploaded successfully to ${storageName}: ${fileName}`, { storageId, storageName, fileName, size }, undefined, requestId);
    },
    uploadFailed: (storageId: number, storageName: string, fileName: string, error: string, requestId?: string) => {
      this.log(LogLevel.ERROR, LogCategory.STORAGE, `File upload failed to ${storageName}: ${fileName} - ${error}`, { storageId, storageName, fileName, error }, undefined, requestId);
    },
    added: (storageId: number, storageName: string, type: string, userId: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.STORAGE, `Storage adapter added: ${storageName} (${type})`, { storageId, storageName, type }, userId, requestId);
    },
    deleted: (storageId: number, storageName: string, userId: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.STORAGE, `Storage adapter deleted: ${storageName}`, { storageId, storageName }, userId, requestId);
    }
  };

  // Scheduler logs
  scheduler = {
    started: (requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.SCHEDULER, 'Backup scheduler started', {}, undefined, requestId);
    },
    stopped: (requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.SCHEDULER, 'Backup scheduler stopped', {}, undefined, requestId);
    },
    scheduleAdded: (scheduleId: number, scheduleName: string, cron: string, userId: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.SCHEDULER, `Schedule added: ${scheduleName} (${cron})`, { scheduleId, scheduleName, cron }, userId, requestId);
    },
    scheduleDeleted: (scheduleId: number, scheduleName: string, userId: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.SCHEDULER, `Schedule deleted: ${scheduleName}`, { scheduleId, scheduleName }, userId, requestId);
    },
    scheduleEnabled: (scheduleId: number, scheduleName: string, userId: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.SCHEDULER, `Schedule enabled: ${scheduleName}`, { scheduleId, scheduleName }, userId, requestId);
    },
    scheduleDisabled: (scheduleId: number, scheduleName: string, userId: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.SCHEDULER, `Schedule disabled: ${scheduleName}`, { scheduleId, scheduleName }, userId, requestId);
    },
    jobError: (scheduleId: number, scheduleName: string, error: string, requestId?: string) => {
      this.log(LogLevel.ERROR, LogCategory.SCHEDULER, `Scheduled job error for ${scheduleName}: ${error}`, { scheduleId, scheduleName, error }, undefined, requestId);
    }
  };

  // API request logs
  api = {
    request: (method: string, path: string, userId?: number, requestId?: string) => {
      this.log(LogLevel.DEBUG, LogCategory.API, `${method} ${path}`, { method, path }, userId, requestId);
    },
    response: (method: string, path: string, status: number, duration: number, userId?: number, requestId?: string) => {
      const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
      this.log(level, LogCategory.API, `${method} ${path} - ${status} (${duration}ms)`, { method, path, status, duration }, userId, requestId);
    },
    error: (method: string, path: string, error: string, userId?: number, requestId?: string) => {
      this.log(LogLevel.ERROR, LogCategory.API, `${method} ${path} - Error: ${error}`, { method, path, error }, userId, requestId);
    }
  };

  // System logs
  system = {
    startup: () => {
      this.log(LogLevel.INFO, LogCategory.SYSTEM, 'SQLBackupPilot system started', { version: process.env.npm_package_version || 'unknown' });
    },
    shutdown: () => {
      this.log(LogLevel.INFO, LogCategory.SYSTEM, 'SQLBackupPilot system shutdown', {});
    },
    error: (component: string, error: string, details?: any) => {
      this.log(LogLevel.ERROR, LogCategory.SYSTEM, `System error in ${component}: ${error}`, { component, error, ...details });
    },
    maintenance: (action: string, details?: any) => {
      this.log(LogLevel.INFO, LogCategory.SYSTEM, `Maintenance action: ${action}`, { action, ...details });
    }
  };

  // User activity logs
  user = {
    profileUpdated: (userId: number, email: string, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.USER, `User profile updated: ${email}`, { userId, email }, userId, requestId);
    },
    settingsChanged: (userId: number, email: string, setting: string, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.USER, `User settings changed: ${setting} by ${email}`, { userId, email, setting }, userId, requestId);
    },
    added: (newUserId: number, newUserEmail: string, role: string, addedBy: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.USER, `User added: ${newUserEmail} with role ${role}`, { newUserId, newUserEmail, role, addedBy }, addedBy, requestId);
    },
    deleted: (deletedUserId: number, deletedUserEmail: string, deletedBy: number, requestId?: string) => {
      this.log(LogLevel.INFO, LogCategory.USER, `User deleted: ${deletedUserEmail}`, { deletedUserId, deletedUserEmail, deletedBy }, deletedBy, requestId);
    }
  };

  // Generic logging methods
  error(category: LogCategory, message: string, details?: any, userId?: number, requestId?: string): void {
    this.log(LogLevel.ERROR, category, message, details, userId, requestId);
  }

  warn(category: LogCategory, message: string, details?: any, userId?: number, requestId?: string): void {
    this.log(LogLevel.WARN, category, message, details, userId, requestId);
  }

  info(category: LogCategory, message: string, details?: any, userId?: number, requestId?: string): void {
    this.log(LogLevel.INFO, category, message, details, userId, requestId);
  }

  debug(category: LogCategory, message: string, details?: any, userId?: number, requestId?: string): void {
    this.log(LogLevel.DEBUG, category, message, details, userId, requestId);
  }
}

// Export singleton instance
export const logger = new Logger();

// Utility function to generate request IDs
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Middleware helper for API logging
export function createRequestLogger(req: any) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  return {
    requestId,
    logRequest: () => {
      logger.api.request(req.method, req.url, req.userId, requestId);
    },
    logResponse: (status: number) => {
      const duration = Date.now() - startTime;
      logger.api.response(req.method, req.url, status, duration, req.userId, requestId);
    },
    logError: (error: string) => {
      logger.api.error(req.method, req.url, error, req.userId, requestId);
    }
  };
}