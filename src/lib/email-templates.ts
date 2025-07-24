interface BackupSummary {
  databaseName: string;
  status: 'success' | 'failed';
  timestamp: string;
  error?: string;
  size?: number;
  duration?: number;
}

interface EmailTemplateData {
  databaseName?: string;
  timestamp?: string;
  error?: string;
  backupSummaries?: BackupSummary[];
  totalBackups?: number;
  successfulBackups?: number;
  failedBackups?: number;
  user?: string;
  action?: string;
  details?: string;
}

export class EmailTemplates {
  private static getBaseTemplate(title: string, content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 10px;
        }
        .title {
            font-size: 20px;
            color: #333;
            margin: 0;
        }
        .content {
            margin-bottom: 30px;
        }
        .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin: 16px 0;
        }
        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .alert-danger {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .alert-warning {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        .alert-info {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            text-align: center;
            padding: 20px;
            border-radius: 6px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
        }
        .stat-number {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #6c757d;
            font-size: 14px;
        }
        .backup-list {
            margin: 20px 0;
        }
        .backup-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 6px;
            background-color: #f8f9fa;
            border-left: 4px solid #dee2e6;
        }
        .backup-item.success {
            border-left-color: #28a745;
        }
        .backup-item.failed {
            border-left-color: #dc3545;
        }
        .backup-name {
            font-weight: 500;
        }
        .backup-status {
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            font-weight: bold;
        }
        .status-success {
            background-color: #28a745;
            color: white;
        }
        .status-failed {
            background-color: #dc3545;
            color: white;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .timestamp {
            color: #6c757d;
            font-size: 14px;
        }
        .error-details {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🛡️ SQLBackupPilot</div>
            <h1 class="title">${title}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>This is an automated message from SQLBackupPilot<br>
            Generated at ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  static generateBackupDigestSummary(data: EmailTemplateData): string {
    const { backupSummaries = [], totalBackups = 0, successfulBackups = 0, failedBackups = 0 } = data;
    const successRate = totalBackups > 0 ? Math.round((successfulBackups / totalBackups) * 100) : 0;

    const content = `
      <div class="alert alert-info">
        <strong>📊 Daily Backup Summary</strong><br>
        Here's your comprehensive backup report for today.
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number" style="color: #0066cc;">${totalBackups}</div>
          <div class="stat-label">Total Backups</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: #28a745;">${successfulBackups}</div>
          <div class="stat-label">Successful</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: #dc3545;">${failedBackups}</div>
          <div class="stat-label">Failed</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: ${successRate >= 90 ? '#28a745' : successRate >= 70 ? '#ffc107' : '#dc3545'};">${successRate}%</div>
          <div class="stat-label">Success Rate</div>
        </div>
      </div>

      ${totalBackups > 0 ? `
        <h3>📋 Backup Details</h3>
        <div class="backup-list">
          ${backupSummaries.map(backup => `
            <div class="backup-item ${backup.status}">
              <div>
                <div class="backup-name">${backup.databaseName}</div>
                <div class="timestamp">${new Date(backup.timestamp).toLocaleString()}</div>
                ${backup.error ? `<div class="error-details">${backup.error}</div>` : ''}
                ${backup.size ? `<div class="timestamp">Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB</div>` : ''}
              </div>
              <div class="backup-status status-${backup.status}">${backup.status}</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="alert alert-warning">
          <strong>⚠️ No Backups Today</strong><br>
          No backup jobs were executed today. Please check your backup schedules.
        </div>
      `}

      ${failedBackups > 0 ? `
        <div class="alert alert-danger">
          <strong>❌ Action Required</strong><br>
          ${failedBackups} backup(s) failed today. Please review the error details above and take appropriate action.
        </div>
      ` : `
        <div class="alert alert-success">
          <strong>✅ All Good!</strong><br>
          All scheduled backups completed successfully today.
        </div>
      `}
    `;

    return this.getBaseTemplate('Daily Backup Digest', content);
  }

  static generateDatabaseDisconnectedAlert(data: EmailTemplateData): string {
    const { databaseName, timestamp, error } = data;
    
    const content = `
      <div class="alert alert-danger">
        <strong>🔌 Database Connection Lost</strong><br>
        We've detected a connection issue with one of your databases.
      </div>

      <h3>📊 Connection Details</h3>
      <p><strong>Database:</strong> ${databaseName}</p>
      <p><strong>Time Detected:</strong> ${new Date(timestamp || '').toLocaleString()}</p>
      
      ${error ? `
        <h3>🔍 Error Details</h3>
        <div class="error-details">${error}</div>
      ` : ''}

      <div class="alert alert-warning">
        <strong>⚠️ What This Means</strong><br>
        • Scheduled backups for this database will fail<br>
        • Data protection is temporarily compromised<br>
        • Manual intervention may be required
      </div>

      <div class="alert alert-info">
        <strong>💡 Recommended Actions</strong><br>
        1. Check database server status<br>
        2. Verify network connectivity<br>
        3. Review database credentials<br>
        4. Check firewall settings<br>
        5. Contact your database administrator if needed
      </div>
    `;

    return this.getBaseTemplate('Database Connection Alert', content);
  }

  static generateBackupFailedAlert(data: EmailTemplateData): string {
    const { databaseName, timestamp, error } = data;
    
    const content = `
      <div class="alert alert-danger">
        <strong>❌ Backup Failed</strong><br>
        A scheduled backup has failed and requires your attention.
      </div>

      <h3>📊 Backup Details</h3>
      <p><strong>Database:</strong> ${databaseName}</p>
      <p><strong>Failed At:</strong> ${new Date(timestamp || '').toLocaleString()}</p>
      
      ${error ? `
        <h3>🔍 Error Details</h3>
        <div class="error-details">${error}</div>
      ` : ''}

      <div class="alert alert-warning">
        <strong>⚠️ Impact</strong><br>
        • Your latest backup is older than expected<br>
        • Data protection window has increased<br>
        • Recovery point objective (RPO) may be compromised
      </div>

      <div class="alert alert-info">
        <strong>💡 Next Steps</strong><br>
        1. Review the error details above<br>
        2. Check database connectivity<br>
        3. Verify storage space and permissions<br>
        4. Consider running a manual backup<br>
        5. Review and adjust backup schedules if needed
      </div>
    `;

    return this.getBaseTemplate('Backup Failed Alert', content);
  }

  static generateBackupCompletedAlert(data: EmailTemplateData): string {
    const { databaseName, timestamp } = data;
    
    const content = `
      <div class="alert alert-success">
        <strong>✅ Backup Completed Successfully</strong><br>
        Your scheduled backup has completed without any issues.
      </div>

      <h3>📊 Backup Details</h3>
      <p><strong>Database:</strong> ${databaseName}</p>
      <p><strong>Completed At:</strong> ${new Date(timestamp || '').toLocaleString()}</p>

      <div class="alert alert-info">
        <strong>📈 What's Next</strong><br>
        • Your data is now protected with the latest backup<br>
        • Recovery point has been updated<br>
        • Next scheduled backup will run as configured<br>
        • You can download or restore from this backup if needed
      </div>
    `;

    return this.getBaseTemplate('Backup Completed', content);
  }

  static generateAuditLogAlert(data: EmailTemplateData): string {
    const { user, action, details, timestamp } = data;
    
    const content = `
      <div class="alert alert-info">
        <strong>🔍 System Activity Alert</strong><br>
        Important system changes have been detected and logged.
      </div>

      <h3>📊 Activity Details</h3>
      <p><strong>User:</strong> ${user || 'System'}</p>
      <p><strong>Action:</strong> ${action}</p>
      <p><strong>Timestamp:</strong> ${new Date(timestamp || '').toLocaleString()}</p>
      
      ${details ? `
        <h3>🔍 Additional Details</h3>
        <div class="error-details">${details}</div>
      ` : ''}

      <div class="alert alert-warning">
        <strong>⚠️ Security Note</strong><br>
        This alert is sent to maintain security and compliance. If this action was unexpected, please review your system access logs and contact your administrator.
      </div>

      <div class="alert alert-info">
        <strong>💡 Activity Types Monitored</strong><br>
        • Database additions, modifications, and deletions<br>
        • Schedule changes and backup configurations<br>
        • Storage adapter modifications<br>
        • User account changes and access modifications<br>
        • System settings and security updates
      </div>
    `;

    return this.getBaseTemplate('System Activity Alert', content);
  }
}