"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/Table';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { 
  Database, 
  HardDrive, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Activity,
  Server,
  Clock,
  Settings,
  RefreshCw,
  XCircle
} from 'lucide-react';

interface DashboardStats {
  totalDatabases: number;
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  storageUsed: string;
  nextScheduled: string;
  activeSchedules: number;
}

interface RecentBackup {
  id: number;
  database: string;
  status: 'success' | 'failed' | 'running';
  startTime: string;
  duration: string;
  size: string;
}

interface RecentActivity {
  id: number;
  type: 'backup' | 'restore' | 'schedule' | 'alert';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface SchedulerStatus {
  isInitialized: boolean;
  scheduledTasksCount: number;
  tasks: Array<{
    scheduleId: number;
    isRunning: boolean;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDatabases: 0,
    totalBackups: 0,
    successfulBackups: 0,
    failedBackups: 0,
    storageUsed: "0 GB",
    nextScheduled: "N/A",
    activeSchedules: 0,
  });

  const [recentBackups, setRecentBackups] = useState<RecentBackup[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchSchedulerStatus = async () => {
    try {
      const response = await fetch("/api/scheduler/status");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setSchedulerStatus(data);
    } catch (err) {
      console.error("Scheduler status error:", err);
      // Set a default status to prevent UI issues
      setSchedulerStatus({
        isInitialized: false,
        scheduledTasksCount: 0,
        tasks: []
      });
    }
  };

  const refreshScheduler = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/scheduler/status", {
        method: "POST"
      });
      const data = await response.json();
      
      if (response.ok) {
        setSchedulerStatus(data);
        setError("");
      } else {
        setError(data.error || "Failed to refresh scheduler");
      }
    } catch (err) {
      setError("Failed to refresh scheduler");
      console.error("Scheduler refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      try {
        const [statsResponse] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetchSchedulerStatus()
        ]);
        
        const statsData = await statsResponse.json();
        
        if (statsResponse.ok) {
          setStats(statsData.stats);
          setRecentBackups(statsData.recentBackups);
          setRecentActivity(statsData.recentActivity);
        } else {
          console.error("Failed to load dashboard data:", statsData.error);
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    
    // Refresh scheduler status every 30 seconds
    const interval = setInterval(fetchSchedulerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="status-success">Success</Badge>;
      case 'failed':
        return <Badge className="status-error">Failed</Badge>;
      case 'running':
        return <Badge className="status-info">Running</Badge>;
      default:
        return <Badge className="status-info">{status}</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'backup':
        return <HardDrive className="h-4 w-4" />;
      case 'restore':
        return <Database className="h-4 w-4" />;
      case 'schedule':
        return <Calendar className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your backups.</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your backups.</p>
        </div>
        <Button 
          onClick={refreshScheduler} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh System
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-600 font-medium">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Databases</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDatabases}</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBackups}</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBackups > 0
                ? ((stats.successfulBackups / stats.totalBackups) * 100).toFixed(1) + "%"
                : "N/A%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulBackups}/{stats.totalBackups} successful
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storageUsed}</div>
          </CardContent>
        </Card>
      </div>

      {/* System Status & Scheduler */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Monitor system components and health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Environment</span>
                <Badge variant="outline">
                  {process.env.NODE_ENV || 'development'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <Badge className="status-success">
                  <Database className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage</span>
                <Badge className="status-success">
                  <HardDrive className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Scheduler</span>
                {schedulerStatus?.isInitialized ? (
                  <Badge className="status-success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Running
                  </Badge>
                ) : (
                  <Badge className="status-error">
                    <XCircle className="h-3 w-3 mr-1" />
                    Stopped
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduler Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Backup Scheduler
            </CardTitle>
            <CardDescription>Automated backup scheduling system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Tasks</span>
                <span className="text-2xl font-bold">
                  {schedulerStatus?.scheduledTasksCount || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next Backup</span>
                <span className="text-sm font-mono">
                  {stats.nextScheduled}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Schedules</span>
                <span className="text-sm font-bold">
                  {stats.activeSchedules}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Stats
            </CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Failed Backups</span>
                <span className="text-2xl font-bold text-red-600">
                  {stats.failedBackups}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.totalBackups > 0
                    ? ((stats.successfulBackups / stats.totalBackups) * 100).toFixed(0) + "%"
                    : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage Usage</span>
                <span className="text-sm font-mono">
                  {stats.storageUsed}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Backups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Recent Backups
            </CardTitle>
            <CardDescription>Latest successful backup operations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Database</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBackups.length > 0 ? recentBackups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <div className="font-medium">{backup.database}</div>
                      <div className="text-sm text-muted-foreground">{backup.startTime}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>{backup.duration}</TableCell>
                    <TableCell className="text-right">{backup.size}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No recent backups found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Incidents
            </CardTitle>
            <CardDescription>Database connection issues and backup failures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                    activity.status === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                    activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent incidents - all systems running smoothly!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}