# SQLBackupPilot

A comprehensive enterprise-grade database backup management system built with Next.js 15, TypeScript, Prisma, and modern web technologies. Manage automated backups for MySQL, PostgreSQL, SQL Server, and SQLite databases with support for multiple storage destinations including cloud services.

## 🎈 Birthday Gift for the Community: SQLBackupPilot

On my birthday, I'm excited to share something special with everyone—**SQLBackupPilot**, an open-source backup tool made to make your life as a sysadmin, engineer, or small business owner a lot easier.

### Why I Built It

Managing and restoring database backups shouldn't be stressful or expensive. I designed SQLBackupPilot so anyone—whether you run a small business, a tech team, or just your own side projects—can keep their data safe, simply and reliably.

### What's in This First Stable Release?

- **Database Support:** MySQL, MariaDB, and PostgreSQL covered from day one
- **Storage Options:** Save backups locally or securely transfer via SFTP
- **Coming Very Soon:** Google Drive integration (work in progress), plus Azure and AWS S3 support arriving next week

### What Makes SQLBackupPilot Special?

- **Open Source & Free:** No costs, no strings. Fork it, use it, improve it.
- **Built for Real People:** No technical clutter. Everything happens from a friendly dashboard.
- **Set It & Forget It:** Automated schedules, easy restores, simple history—peace of mind for everyone.
- **Made for Community and Small Business:** No steep learning curve, no vendor lock-in, just practical protection for what matters.

### Who's This For?

- Local businesses who want reliable data safety without the SaaS bill.
- Freelancers and IT folks chasing peace of mind instead of scripts and spreadsheets.
- Anyone who cares about their data—and their time.

**Happy birthday to us all—enjoy SQLBackupPilot and keep building amazing things together!**

---

## Features

### ✅ **Core Features (Production Ready)**
- **Multi-Database Support**: MySQL, PostgreSQL, SQL Server, SQLite with robust connection testing
- **Advanced Storage Options**: 
  - **Local Storage**: Organized backup storage with database-specific folder structure
  - **SFTP Integration**: Complete SFTP server backup support with SSH/sshpass, connection testing, and remote path browsing
  - **Amazon S3**: Full AWS S3 bucket integration with encryption and custom key prefixes
  - **Azure Blob Storage**: Complete Azure cloud storage support with container management
- **Automated Scheduling**: 
  - Cron-based backup scheduling with flexible timing options
  - Real-time scheduler status monitoring and manual trigger capabilities
  - Automated backup job tracking and status updates
- **Enterprise User Management**: Role-based access control (Owner/Admin roles) with secure JWT authentication
- **Comprehensive Backup Management**: 
  - View, download, and restore backup files with intelligent size optimization
  - Manual backup triggers with real-time progress tracking
  - Database-specific backup organization and file management
- **Professional Dashboard**: 
  - Real-time system monitoring and statistics
  - Backup success/failure analytics and storage usage tracking
  - Recent activity feeds and system health indicators
- **Complete Audit System**: Track all user actions, backup jobs, and system events with detailed logging
- **Alert Management**: Comprehensive notification system with customizable alert templates
- **Modern UI/UX**: 
  - Dark/Light mode with professional design
  - Responsive design optimized for desktop and mobile
  - Intuitive navigation with role-based menu visibility

### 🔄 **Beta Features**
- **Google Drive Integration**: OAuth-based cloud storage with folder selection and authentication flow
- **Database Restore**: Backup restoration functionality with progress tracking
- **Advanced SFTP Features**: Remote directory browsing and custom path validation

### 🆕 **Latest Enhancements**
- **Database-Specific Folder Organization**: Both local and remote storage now create organized folder structures
- **Enhanced Error Handling**: Improved error messages and graceful failure handling across all components
- **Real-time Status Updates**: Live scheduler status monitoring with automatic refresh
- **Advanced Connection Testing**: Comprehensive database and storage connection validation
- **Optimized Backup Operations**: Improved backup performance with better error recovery

## Technology Stack

- **Frontend**: Next.js 15.4, React 19, TypeScript
- **UI/UX**: Tailwind CSS 4, Radix UI components, Lucide React icons, responsive design
- **Backend**: Next.js API routes, Prisma ORM with SQLite
- **Database Support**: MySQL, PostgreSQL, SQL Server, SQLite
- **Authentication**: JWT-based session management with bcrypt password hashing
- **Scheduling**: Node-cron with real-time status monitoring
- **Storage Integration**: 
  - Local filesystem with organized folder structure
  - SFTP with SSH/sshpass support
  - AWS S3 with encryption and custom prefixes
  - Azure Blob Storage with container management
  - Google Drive with OAuth authentication
- **Cloud SDKs**: AWS SDK v3, Azure Storage SDK, Google APIs
- **Database Drivers**: mysql2, pg, mssql, sqlite3, mysqldump

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- For SFTP: SSH client installed on system

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TanoojMehra/SQLBackupPilot
   cd SQLBackupPilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:2407](http://localhost:2407) in your browser
   - Complete the first-time setup wizard

6. **Build and deploy with PM2** (Production)
   ```bash
   # Build the application
   npm run build
   
   # Install PM2 if not available
   npm install -g pm2
   
   # Start with PM2
   pm2 start "npm run start" --name sqlbackuppilot
   
   # Save PM2 configuration
   pm2 save
   
   # Setup PM2 startup (optional - auto-start on system reboot)
   pm2 startup
   ```
   
   **Note:** If PM2 is not installed, get it from [PM2 Official Website](https://pm2.keymetrics.io/) or install globally with `npm install -g pm2`

## Configuration

### Environment Variables
The application uses minimal environment variables:
- `NODE_ENV`: Development/production mode
- `DATABASE_URL`: SQLite database path (configured in Prisma schema)
- `JWT_SECRET`: JWT signing secret (defaults to "dev_secret" in development)

### Database Configuration
Add your databases through the web interface:
1. Navigate to **Databases** → **Add Database**
2. Enter connection details for MySQL, PostgreSQL, or SQL Server
3. Test the connection before saving

### Storage Configuration
Set up backup storage destinations:
- **Local Storage**: Default organized storage, custom paths supported with validation
- **SFTP Server**: Requires SSH/sshpass installation, includes connection testing and path browsing
- **Amazon S3**: Full integration with bucket validation, encryption, and custom key prefixes
- **Azure Blob Storage**: Complete container management with connection string validation
- **Google Drive**: OAuth-based authentication with folder selection and shared drive support

### SFTP Setup
For SFTP backup support, see the detailed [SFTP_SETUP.md](SFTP_SETUP.md) guide.

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm run start
   ```

3. **Process Management** (Recommended)
   ```bash
   # Using PM2
   pm2 start "npm run start" --name sqlbackuppilot
   
   # The application runs on port 2407 by default
   ```

## API Documentation

The application provides comprehensive REST APIs for all operations:
- `/api/databases` - Database CRUD operations with connection testing
- `/api/backups` - Backup operations, manual triggers, download, and restore
- `/api/schedules` - Schedule management with cron validation
- `/api/scheduler` - Real-time scheduler status and manual control
- `/api/storage` - Storage adapter configuration with connection testing
- `/api/storage/sftp` - SFTP-specific operations (test, browse)
- `/api/users` - User management and role-based access control
- `/api/auth` - Authentication and Google OAuth integration
- `/api/audit` - Audit log access and system activity tracking
- `/api/alerts` - Alert management and notification configuration
- `/api/dashboard` - System statistics and monitoring data
- `/api/database-monitor` - Real-time database connectivity monitoring

## File Structure

```
src/
├── app/                 # Next.js app directory
│   ├── dashboard/       # Dashboard pages
│   ├── api/            # API routes
│   └── globals.css     # Global styles
├── components/         # Reusable UI components
├── lib/               # Core business logic libraries
│   ├── backup-service.ts    # Multi-database backup operations with cloud storage
│   ├── scheduler.ts         # Cron scheduling with real-time monitoring
│   ├── logger.ts           # Comprehensive error logging and audit system
│   ├── sftp-server.ts      # SFTP integration with system command execution
│   ├── system-sftp.ts      # SSH-based SFTP operations and path management
│   ├── auth.ts             # JWT authentication and user management
│   ├── google-oauth.ts     # Google Drive OAuth integration
│   └── utils.ts            # Shared utility functions
└── generated/         # Prisma generated files
```

## Features Overview

### Dashboard
- **Real-time System Status**: Monitor database connections, storage adapters, and scheduler health
- **Advanced Analytics**: Backup success/failure rates, storage usage trends, and performance metrics
- **Activity Monitoring**: Live feed of recent backups, user actions, and system events
- **Administrative Controls**: Manual scheduler refresh, system status checks, and quick actions
- **Resource Management**: Storage usage tracking with intelligent size formatting

### Database Management
- **Advanced Connection Testing**: Real-time connectivity verification for all supported database types
- **Multi-Database Support**: Full support for MySQL, PostgreSQL, SQL Server, and SQLite
- **Intelligent Configuration**: Automatic parameter validation and connection optimization  
- **Flexible Assignment**: Link databases to multiple schedules and storage destinations
- **Enterprise Security**: Encrypted password storage with bcrypt hashing and secure transmission

### Backup Operations  
- **On-Demand Backups**: Instant backup triggers with real-time progress tracking
- **Automated Scheduling**: Flexible cron-based scheduling with validation and monitoring
- **Intelligent File Management**: Download, restore, and organize backup files with database-specific folders
- **Advanced Size Analytics**: Dynamic file size formatting (B, KB, MB, GB, TB) with storage optimization
- **Backup Restoration**: Complete restore functionality with progress monitoring and error handling
- **Job Tracking**: Comprehensive backup job history with status monitoring and detailed logs

### Storage Options
- **Local Storage**: Organized filesystem storage with database-specific folders and custom path validation
- **SFTP Integration**: Complete remote server backup with SSH authentication, connection testing, and path browsing
- **Amazon S3**: Full AWS integration with bucket validation, server-side encryption, and custom key prefixes
- **Azure Blob Storage**: Complete Azure cloud storage with container management and connection validation
- **Google Drive**: OAuth-based authentication with folder selection, shared drive support, and API management
- **Intelligent Organization**: Database-specific folder structures for all storage types
- **Connection Validation**: Real-time testing and path verification for all storage adapters

### User Management
- **Enterprise Role-Based Access Control**: Owner and Admin roles with granular permissions
- **Secure Profile Management**: Password changes, account settings, and session management
- **Comprehensive Audit Tracking**: Detailed logging of all user actions, system changes, and security events
- **Session Security**: JWT-based authentication with secure token management and automatic expiration

### Security Features
- **Multi-Layer Authentication**: JWT-based session management with secure token handling
- **Advanced Password Security**: bcrypt hashing with salt rounds and secure storage
- **Enterprise-Grade Protection**: Built-in Next.js security features including CSRF protection
- **Comprehensive Security Logging**: Detailed audit trails for all authentication attempts and user actions
- **Secure Data Transmission**: Encrypted database credentials and secure API communication
- **Role-Based Authorization**: Granular access control with permission-based feature restrictions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support and questions:
- Check the application's built-in documentation
- Examine the comprehensive error logging system
- Create an issue in the repository

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**SQLBackupPilot** - Professional database backup management made simple.