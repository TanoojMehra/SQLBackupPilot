"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

const DATABASE_TYPES = [
  { value: "MYSQL", label: "MySQL", defaultPort: 3306, status: "stable" },
  { value: "POSTGRES", label: "PostgreSQL", defaultPort: 5432, status: "stable" },
  { value: "SQLSERVER", label: "SQL Server (Beta)", defaultPort: 1433, status: "beta" },
];

interface Schedule {
  id: number;
  name: string;
  cron: string;
}

interface StorageAdapter {
  id: number;
  name: string;
  type: string;
}

interface EditDatabaseFormProps {
  database: { 
    id: number; 
    name: string; 
    type: string; 
    host: string; 
    port: number; 
    username: string;
    backupEnabled?: boolean;
    scheduleId?: number | null;
    storageId?: number | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditDatabaseForm({ database, onSuccess, onCancel }: EditDatabaseFormProps) {
  const [name, setName] = useState(database.name);
  const [type, setType] = useState(database.type);
  const [host, setHost] = useState(database.host);
  const [port, setPort] = useState(database.port);
  const [username, setUsername] = useState(database.username);
  const [password, setPassword] = useState("");
  const [backupEnabled, setBackupEnabled] = useState(database.backupEnabled || false);
  const [scheduleId, setScheduleId] = useState<number | null>(database.scheduleId || null);
  const [storageId, setStorageId] = useState<number | null>(database.storageId || null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [storageAdapters, setStorageAdapters] = useState<StorageAdapter[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch schedules and storage adapters
    const fetchOptions = async () => {
      try {
        const [schedulesRes, storageRes] = await Promise.all([
          fetch("/api/schedules"),
          fetch("/api/storage")
        ]);
        
        if (schedulesRes.ok) {
          const schedulesData = await schedulesRes.json();
          setSchedules(schedulesData.schedules || []);
        }
        
        if (storageRes.ok) {
          const storageData = await storageRes.json();
          setStorageAdapters(storageData.adapters || []);
        }
      } catch (error) {
        console.error("Failed to fetch options:", error);
      }
    };
    
    fetchOptions();
  }, []);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    const dbType = DATABASE_TYPES.find(db => db.value === newType);
    if (dbType && dbType.defaultPort !== database.port) {
      setPort(dbType.defaultPort);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/databases/${database.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          type, 
          host, 
          port, 
          username, 
          password: password || undefined,
          backupEnabled,
          scheduleId: backupEnabled ? scheduleId : null,
          storageId: backupEnabled ? storageId : null
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update database.");
      } else {
        onSuccess();
      }
    } catch {
      setError("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Database Name</label>
        <Input
          type="text"
          placeholder="e.g., production-db"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Database Type</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={type}
          onChange={e => handleTypeChange(e.target.value)}
          disabled={loading}
        >
          {DATABASE_TYPES.map(dbType => (
            <option key={dbType.value} value={dbType.value}>
              {dbType.label}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-1">
          {type === "MYSQL" && "✅ Fully supported with native mysqldump"}
          {type === "POSTGRES" && "✅ Fully supported with native pg_dump"}
          {type === "SQLSERVER" && "🧪 Beta: Basic table export support"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Host</label>
          <Input
            type="text"
            placeholder="localhost or server.example.com"
            value={host}
            onChange={e => setHost(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Port</label>
          <Input
            type="number"
            value={port}
            onChange={e => setPort(Number(e.target.value))}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Username</label>
        <Input
          type="text"
          placeholder="Database username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Password (leave blank to keep current)</label>
        <Input
          type="password"
          placeholder="Enter new password (optional)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Backup Settings */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Backup Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              id="backupEnabled"
              type="checkbox"
              checked={backupEnabled}
              onChange={(e) => setBackupEnabled(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="backupEnabled" className="text-sm font-medium">
              Enable automatic backups
            </label>
          </div>

          {backupEnabled && (
            <>
              <div className="space-y-2">
                <label htmlFor="schedule" className="block text-sm font-medium">Backup Schedule</label>
                <select
                  id="schedule"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={scheduleId || ""}
                  onChange={e => setScheduleId(e.target.value ? Number(e.target.value) : null)}
                  disabled={loading}
                  required={backupEnabled}
                >
                  <option value="">Select a backup schedule</option>
                  {schedules.map(schedule => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name} ({schedule.cron})
                    </option>
                  ))}
                </select>
                {schedules.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No schedules available. Create a schedule first in the Schedules page.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="storage" className="block text-sm font-medium">Storage Location</label>
                <select
                  id="storage"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={storageId || ""}
                  onChange={e => setStorageId(e.target.value ? Number(e.target.value) : null)}
                  disabled={loading}
                  required={backupEnabled}
                >
                  <option value="">Select a storage location</option>
                  {storageAdapters.map(adapter => (
                    <option key={adapter.id} value={adapter.id}>
                      {adapter.name} ({adapter.type})
                    </option>
                  ))}
                </select>
                {storageAdapters.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No storage adapters available. Create a storage adapter first in the Storage page.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
} 