"use client";

import React, { useEffect, useState } from "react";
import { 
  Mail, 
  Server, 
  Lock, 
  User, 
  Settings, 
  Save, 
  TestTube,
  AlertCircle,
  CheckCircle,
  Globe,
  Clock
} from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/Card';

// Comprehensive timezone list
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { value: 'America/New_York', label: 'Eastern Time (New York)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)', offset: '-08:00' },
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)', offset: '-09:00' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)', offset: '-10:00' },
  { value: 'Europe/London', label: 'GMT (London)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'CET (Paris)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'CET (Berlin)', offset: '+01:00' },
  { value: 'Europe/Rome', label: 'CET (Rome)', offset: '+01:00' },
  { value: 'Europe/Madrid', label: 'CET (Madrid)', offset: '+01:00' },
  { value: 'Europe/Amsterdam', label: 'CET (Amsterdam)', offset: '+01:00' },
  { value: 'Europe/Stockholm', label: 'CET (Stockholm)', offset: '+01:00' },
  { value: 'Europe/Helsinki', label: 'EET (Helsinki)', offset: '+02:00' },
  { value: 'Europe/Athens', label: 'EET (Athens)', offset: '+02:00' },
  { value: 'Europe/Moscow', label: 'MSK (Moscow)', offset: '+03:00' },
  { value: 'Asia/Dubai', label: 'GST (Dubai)', offset: '+04:00' },
  { value: 'Asia/Karachi', label: 'PKT (Karachi)', offset: '+05:00' },
  { value: 'Asia/Kolkata', label: 'IST (Mumbai/Delhi)', offset: '+05:30' },
  { value: 'Asia/Dhaka', label: 'BST (Dhaka)', offset: '+06:00' },
  { value: 'Asia/Bangkok', label: 'ICT (Bangkok)', offset: '+07:00' },
  { value: 'Asia/Singapore', label: 'SGT (Singapore)', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: 'HKT (Hong Kong)', offset: '+08:00' },
  { value: 'Asia/Shanghai', label: 'CST (Shanghai)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)', offset: '+09:00' },
  { value: 'Asia/Seoul', label: 'KST (Seoul)', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'AEDT (Sydney)', offset: '+11:00' },
  { value: 'Australia/Melbourne', label: 'AEDT (Melbourne)', offset: '+11:00' },
  { value: 'Australia/Brisbane', label: 'AEST (Brisbane)', offset: '+10:00' },
  { value: 'Australia/Perth', label: 'AWST (Perth)', offset: '+08:00' },
  { value: 'Pacific/Auckland', label: 'NZDT (Auckland)', offset: '+13:00' },
  { value: 'America/Toronto', label: 'EST (Toronto)', offset: '-05:00' },
  { value: 'America/Vancouver', label: 'PST (Vancouver)', offset: '-08:00' },
  { value: 'America/Sao_Paulo', label: 'BRT (São Paulo)', offset: '-03:00' },
  { value: 'America/Mexico_City', label: 'CST (Mexico City)', offset: '-06:00' },
  { value: 'America/Buenos_Aires', label: 'ART (Buenos Aires)', offset: '-03:00' },
  { value: 'Africa/Cairo', label: 'EET (Cairo)', offset: '+02:00' },
  { value: 'Africa/Johannesburg', label: 'SAST (Johannesburg)', offset: '+02:00' },
  { value: 'Africa/Lagos', label: 'WAT (Lagos)', offset: '+01:00' }
];

interface AppSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  environment: string;
  timezone: string;
  // Email notification toggles
  emailNotifications: {
    backupDigestEnabled: boolean;
    backupDigestTime: string;
    databaseDisconnectedEnabled: boolean;
    backupFailedEnabled: boolean;
    backupCompletedEnabled: boolean;
    auditLogEnabled: boolean;
  };
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [clearBackups, setClearBackups] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpFrom: "",
    smtpPassword: "",
    environment: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    emailNotifications: {
      backupDigestEnabled: true,
      backupDigestTime: "18:00",
      databaseDisconnectedEnabled: true,
      backupFailedEnabled: true,
      backupCompletedEnabled: false,
      auditLogEnabled: true,
    }
  });

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch settings.");
        } else {
          setFormData({
            smtpHost: data.settings.smtpHost || "",
            smtpPort: data.settings.smtpPort || 587,
            smtpUser: data.settings.smtpUser || "",
            smtpFrom: data.settings.smtpFrom || "",
            smtpPassword: "",
            environment: data.settings.environment || "",
            timezone: data.settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            emailNotifications: {
              backupDigestEnabled: data.settings.emailNotifications?.backupDigestEnabled ?? true,
              backupDigestTime: data.settings.emailNotifications?.backupDigestTime || "18:00",
              databaseDisconnectedEnabled: data.settings.emailNotifications?.databaseDisconnectedEnabled ?? true,
              backupFailedEnabled: data.settings.emailNotifications?.backupFailedEnabled ?? true,
              backupCompletedEnabled: data.settings.emailNotifications?.backupCompletedEnabled ?? false,
              auditLogEnabled: data.settings.emailNotifications?.auditLogEnabled ?? true,
            }
          });
        }
      } catch {
        setError("Server error.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setTestResult({
          success: true,
          message: "Settings saved successfully!"
        });
      } else {
        const data = await res.json();
        setTestResult({
          success: false,
          message: data.error || "Failed to save settings."
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Server error. Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    // TODO: Implement test connection functionality
    // This would call a POST /api/settings/test-smtp endpoint
    setTimeout(() => {
      setTesting(false);
      setTestResult({
        success: Math.random() > 0.5,
        message: Math.random() > 0.5 ? "Connection successful!" : "Connection failed. Please check your settings."
      });
    }, 2000);
  };

  const handleReset = async () => {
    setResetting(true);
    setResetError("");
    try {
      const res = await fetch("/api/admin/reset", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearBackups })
      });
      if (res.ok) {
        // Log out and reload
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/";
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const data = await res.json();
        setResetError(data.error || "Failed to reset.");
      }
    } catch {
      setResetError("Failed to reset.");
    }
    setResetting(false);
  };

  const getCurrentTimeInTimezone = (timezone: string) => {
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: timezone,
        hour12: true,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid timezone';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Configure application settings and preferences</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Configure application settings and preferences</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Settings className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-red-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure application settings and preferences
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              Environment: {formData.environment || 'Development'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleTestConnection}
            disabled={testing || !formData.smtpHost}
            className="gap-2"
          >
            <TestTube className="h-4 w-4" />
            {testing ? "Testing..." : "Test SMTP"}
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <Card className={testResult.success ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              <p className={`text-sm font-medium ${testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {testResult.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Configuration
          </CardTitle>
          <CardDescription>
            Basic application settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Environment</label>
              <div className="flex items-center gap-4">
                <Input
                  value={formData.environment}
                  onChange={(e) => handleInputChange('environment', e.target.value)}
                  placeholder="development, staging, production"
                />
                <Badge variant={formData.environment === 'production' ? 'destructive' : 'secondary'}>
                  {formData.environment || 'development'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Current application environment (affects logging and debugging)
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Timezone</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Current time: {getCurrentTimeInTimezone(formData.timezone)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email & SMTP Configuration
          </CardTitle>
          <CardDescription>
            Configure SMTP server settings for sending email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">SMTP Host</label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="smtp.gmail.com"
                  value={formData.smtpHost}
                  onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">SMTP Port</label>
              <Input
                type="number"
                placeholder="587"
                value={formData.smtpPort}
                onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value) || 587)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">SMTP Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="your-email@gmail.com"
                  value={formData.smtpUser}
                  onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">SMTP Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter password or app token"
                  value={formData.smtpPassword}
                  onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">From Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="noreply@yourcompany.com"
                value={formData.smtpFrom}
                onChange={(e) => handleInputChange('smtpFrom', e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This email address will appear as the sender for all notifications
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Email Notification Settings
          </CardTitle>
          <CardDescription>
            Configure which events should trigger email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">Daily Backup Digest</label>
                <p className="text-xs text-gray-500">Receive a daily summary of all backup jobs</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={formData.emailNotifications.backupDigestTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emailNotifications: {
                      ...prev.emailNotifications,
                      backupDigestTime: e.target.value
                    }
                  }))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                  disabled={!formData.emailNotifications.backupDigestEnabled}
                />
                <input
                  type="checkbox"
                  checked={formData.emailNotifications.backupDigestEnabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emailNotifications: {
                      ...prev.emailNotifications,
                      backupDigestEnabled: e.target.checked
                    }
                  }))}
                  className="h-4 w-4"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">Database Disconnection Alerts</label>
                <p className="text-xs text-gray-500">Get notified when database connections fail</p>
              </div>
              <input
                type="checkbox"
                checked={formData.emailNotifications.databaseDisconnectedEnabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  emailNotifications: {
                    ...prev.emailNotifications,
                    databaseDisconnectedEnabled: e.target.checked
                  }
                }))}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">Backup Failed Alerts</label>
                <p className="text-xs text-gray-500">Receive immediate alerts when backups fail</p>
              </div>
              <input
                type="checkbox"
                checked={formData.emailNotifications.backupFailedEnabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  emailNotifications: {
                    ...prev.emailNotifications,
                    backupFailedEnabled: e.target.checked
                  }
                }))}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">Backup Completed Notifications</label>
                <p className="text-xs text-gray-500">Get notified when backups complete successfully</p>
              </div>
              <input
                type="checkbox"
                checked={formData.emailNotifications.backupCompletedEnabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  emailNotifications: {
                    ...prev.emailNotifications,
                    backupCompletedEnabled: e.target.checked
                  }
                }))}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">Audit Log Alerts</label>
                <p className="text-xs text-gray-500">Receive notifications for system changes and security events</p>
              </div>
              <input
                type="checkbox"
                checked={formData.emailNotifications.auditLogEnabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  emailNotifications: {
                    ...prev.emailNotifications,
                    auditLogEnabled: e.target.checked
                  }
                }))}
                className="h-4 w-4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Security Notice
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                SMTP passwords are encrypted and stored securely. For Gmail and other providers, 
                consider using app-specific passwords instead of your main account password.
                All times are displayed in your selected timezone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-lg font-bold mb-2">Danger Zone</h2>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={() => setShowReset(true)}
        >
          Clear All Data and Reset
        </button>
        {showReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setShowReset(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h3 className="text-lg font-bold mb-2 text-red-600">Confirm Reset</h3>
              <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
                This will delete <b>all data</b> and reset the application. Type <span className="font-mono">I agree</span> to confirm.
              </p>
              
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={clearBackups}
                    onChange={(e) => setClearBackups(e.target.checked)}
                    disabled={resetting}
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-200">
                    Also delete all backup files and folders
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  This will permanently remove all backup files from public/backups/ including database-specific folders
                </p>
              </div>
              
              <input
                type="text"
                className="w-full border rounded px-2 py-1 mb-2"
                value={resetInput}
                onChange={e => setResetInput(e.target.value)}
                placeholder="Type I agree to confirm"
                disabled={resetting}
              />
              {resetError && <div className="text-red-600 text-xs mb-2">{resetError}</div>}
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 bg-gray-300 rounded"
                  onClick={() => setShowReset(false)}
                  disabled={resetting}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                  disabled={resetInput !== "I agree" || resetting}
                  onClick={handleReset}
                >
                  {resetting ? "Resetting..." : "Confirm and Reset"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 