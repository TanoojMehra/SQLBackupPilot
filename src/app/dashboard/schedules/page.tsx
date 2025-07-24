"use client";

import React, { useEffect, useState } from "react";
import { 
  Calendar, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Play,
  Pause,
  Clock,
  Database,
  Shield,
  Timer
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/DropdownMenu';
import Modal from "../../../components/Modal";
import AddScheduleForm from "./AddScheduleForm";

interface BackupSchedule {
  id: number;
  name: string;
  databaseCount?: number;
  cron: string;
  retention: number;
  enabled: boolean;
  nextRun?: string;
  lastRun?: string;
  status: 'active' | 'paused' | 'error';
  backupCount: number;
  databases?: { id: number; name: string; type: string }[];
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [dbModalOpenId, setDbModalOpenId] = useState<number | null>(null);

  const fetchSchedules = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/schedules");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch schedules.");
      } else {
        setSchedules(data.schedules || []);
      }
    } catch {
      setError("Server error.");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    const filtered = schedules.filter(schedule =>
      schedule.name.toLowerCase().includes(search.toLowerCase()) ||
      schedule.cron.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredSchedules(filtered);
  }, [schedules, search]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSchedules();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete schedule.");
      }
    } catch {
      setError("Server error.");
    }
    setDeleteId(null);
  };

  const toggleSchedule = async (id: number, enabled: boolean) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (res.ok) {
        await fetchSchedules();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update schedule.");
      }
    } catch {
      setError("Server error.");
    }
  };

  const getStatusBadge = (status: string, enabled: boolean) => {
    if (!enabled) return <Badge className="status-warning">Paused</Badge>;
    switch (status) {
      case 'active':
        return <Badge className="status-success">Active</Badge>;
      case 'paused':
        return <Badge className="status-warning">Paused</Badge>;
      case 'error':
        return <Badge className="status-error">Error</Badge>;
      default:
        return <Badge className="status-info">{status}</Badge>;
    }
  };

  const formatCron = (cron: string) => {
    // Simple cron description mapping
    const cronDescriptions: Record<string, string> = {
      "0 2 * * *": "Daily at 2:00 AM",
      "0 3 * * 0": "Weekly on Sunday at 3:00 AM",
      "0 1 * * 1-5": "Weekdays at 1:00 AM",
      "0 0 * * 0": "Weekly on Sunday at midnight",
      "0 */6 * * *": "Every 6 hours"
    };
    return cronDescriptions[cron] || cron;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateNextBackupTime = (enabledSchedules: BackupSchedule[]) => {
    if (enabledSchedules.length === 0) return 'None';
    
    // Find the schedule with the earliest nextRun time
    const sortedByNextRun = enabledSchedules
      .filter(s => s.nextRun)
      .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime());
    
    if (sortedByNextRun.length === 0) return 'Soon';
    
    const nextRunTime = new Date(sortedByNextRun[0].nextRun!);
    const now = new Date();
    const diffMs = nextRunTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Overdue';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`;
    return `${diffMinutes}m`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Backup Schedules</h1>
            <p className="text-muted-foreground">Manage automated backup schedules for your databases.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-12 w-12 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup Schedules</h1>
          <p className="text-muted-foreground">Manage automated backup schedules for your databases.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-xs text-muted-foreground">
              {schedules.filter(s => s.enabled).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.reduce((sum, s) => sum + s.backupCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">From scheduled backups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Backup</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => s.enabled && s.nextRun).length > 0 ? 
                calculateNextBackupTime(schedules.filter(s => s.enabled && s.nextRun)) : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">Until next scheduled backup</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Schedules</CardTitle>
          <CardDescription>View and manage all your automated backup schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search schedules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No schedules found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try adjusting your search terms." : "Get started by creating your first backup schedule."}
              </p>
              {!search && (
                <Button onClick={() => setShowAdd(true)} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Databases</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.id} className="group">
                      <TableCell>
                        <div className="font-medium">{schedule.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.cron}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 py-1 text-xs font-semibold"
                          onClick={() => setDbModalOpenId(schedule.id)}
                        >
                          {schedule.databases ? schedule.databases.length : 0}
                        </Button>
                        {/* Database List Modal */}
                        {dbModalOpenId === schedule.id && (
                          <Modal
                            open={true}
                            onClose={() => setDbModalOpenId(null)}
                            title="Databases Using This Schedule"
                          >
                            <ul className="space-y-2">
                              {schedule.databases && schedule.databases.length > 0 ? (
                                schedule.databases.map(db => (
                                  <li key={db.id} className="border-b pb-2">
                                    <span className="font-medium">{db.name}</span> <span className="text-xs text-muted-foreground">({db.type})</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-muted-foreground">No databases use this schedule.</li>
                              )}
                            </ul>
                            <div className="flex justify-end mt-4">
                              <Button variant="outline" onClick={() => setDbModalOpenId(null)}>Close</Button>
                            </div>
                          </Modal>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(schedule.status, schedule.enabled)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(schedule.lastRun)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(schedule.nextRun)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{schedule.retention} days</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleSchedule(schedule.id, schedule.enabled)}>
                              {schedule.enabled ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingId(schedule.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(schedule.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Schedule Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Backup Schedule">
        <AddScheduleForm onSuccess={() => { setShowAdd(false); fetchSchedules(); }} />
      </Modal>

      {/* Edit Schedule Modal */}
      {editingId && (
        <Modal 
          open={!!editingId} 
          onClose={() => setEditingId(null)} 
          title="Edit Backup Schedule"
        >
          {(() => {
            const schedule = schedules.find(s => s.id === editingId);
            if (!schedule) return null;
            // Parse cron to scheduleType, minute, timeOfDay, dayOfWeek, dateOfMonth
            let scheduleType = "daily", minute = 0, timeOfDay = "02:00", dayOfWeek = "0", dateOfMonth = 1;
            if (schedule.cron === "* * * * *") {
              scheduleType = "minute";
            } else if (/^\d+ \* \* \* \*$/.test(schedule.cron)) {
              scheduleType = "hourly";
              minute = parseInt(schedule.cron.split(" ")[0], 10);
            } else if (/^\d+ \d+ \* \* \*$/.test(schedule.cron)) {
              scheduleType = "daily";
              const [m, h] = schedule.cron.split(" ");
              timeOfDay = `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
            } else if (/^\d+ \d+ \* \* \d+$/.test(schedule.cron)) {
              scheduleType = "weekly";
              const [m, h, , , d] = schedule.cron.split(" ");
              timeOfDay = `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
              dayOfWeek = d;
            } else if (/^\d+ \d+ \d+ \* \*$/.test(schedule.cron)) {
              scheduleType = "monthly";
              const [m, h, dom] = schedule.cron.split(" ");
              timeOfDay = `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
              dateOfMonth = parseInt(dom, 10);
            }
            return (
              <AddScheduleForm
                onSuccess={() => { setEditingId(null); fetchSchedules(); }}
                initialValues={{
                  name: schedule.name,
                  scheduleType,
                  minute,
                  timeOfDay,
                  dayOfWeek,
                  dateOfMonth,
                  retention: schedule.retention,
                  cron: schedule.cron,
                  enabled: schedule.enabled,
                }}
                scheduleId={schedule.id}
                databasesUsingSchedule={schedule.databases || []}
              />
            );
          })()}
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal 
          open={!!deleteId} 
          onClose={() => setDeleteId(null)} 
          title="Delete Backup Schedule"
        >
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this backup schedule? This action cannot be undone.
              Existing backups created by this schedule will not be affected.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDelete(deleteId)}
              >
                Delete Schedule
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
} 