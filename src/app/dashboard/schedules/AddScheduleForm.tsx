"use client";
import React, { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import Modal from "@/components/Modal";

interface AddScheduleFormProps {
  onSuccess: () => void;
  initialValues?: {
    name: string;
    scheduleType: string;
    minute: number;
    timeOfDay: string;
    dayOfWeek: string;
    dateOfMonth: number;
    retention: number;
    cron: string;
    enabled: boolean;
  };
  scheduleId?: number;
  databasesUsingSchedule?: { id: number; name: string; type: string }[];
}

interface Database {
  id: number;
  name: string;
  type: string;
}

const SCHEDULE_PRESETS = [
  { label: "Every Minute", cron: "* * * * *" },
  { label: "Daily at 2:00 AM", cron: "0 2 * * *" },
  { label: "Daily at 3:00 AM", cron: "0 3 * * *" },
  { label: "Weekly on Sunday at 2:00 AM", cron: "0 2 * * 0" },
  { label: "Weekly on Sunday at 3:00 AM", cron: "0 3 * * 0" },
  { label: "Weekdays at 1:00 AM", cron: "0 1 * * 1-5" },
  { label: "Every 6 hours", cron: "0 */6 * * *" },
  { label: "Every 12 hours", cron: "0 */12 * * *" },
  { label: "Custom", cron: "" }
];

export default function AddScheduleForm({ onSuccess, initialValues, scheduleId, databasesUsingSchedule }: AddScheduleFormProps) {
  const [name, setName] = useState(initialValues?.name || "");
  const [scheduleType, setScheduleType] = useState(initialValues?.scheduleType || "daily");
  const [minute, setMinute] = useState(initialValues?.minute ?? 0);
  const [timeOfDay, setTimeOfDay] = useState(initialValues?.timeOfDay || "02:00");
  const [dayOfWeek, setDayOfWeek] = useState(initialValues?.dayOfWeek || "0");
  const [dateOfMonth, setDateOfMonth] = useState(initialValues?.dateOfMonth ?? 1);
  const [retention, setRetention] = useState(initialValues?.retention ?? 30);
  const [enabled, setEnabled] = useState(initialValues?.enabled ?? true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDatabases, setShowDatabases] = useState(false);

  function getCron() {
    switch (scheduleType) {
      case "minute":
        return "* * * * *";
      case "hourly":
        return `${minute} * * * *`;
      case "daily":
        const [h, m] = timeOfDay.split(":");
        return `${parseInt(m, 10)} ${parseInt(h, 10)} * * *`;
      case "weekly":
        const [wh, wm] = timeOfDay.split(":");
        return `${parseInt(wm, 10)} ${parseInt(wh, 10)} * * ${dayOfWeek}`;
      case "monthly":
        const [mh, mm] = timeOfDay.split(":");
        return `${parseInt(mm, 10)} ${parseInt(mh, 10)} ${dateOfMonth} * *`;
      default:
        return "0 2 * * *";
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cron = getCron();
      const payload = { name, cron, retention, enabled };
      let res;
      if (scheduleId) {
        res = await fetch(`/api/schedules/${scheduleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (scheduleId ? "Failed to update schedule." : "Failed to create schedule."));
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
        <label htmlFor="name" className="block text-sm font-medium">Schedule Name</label>
        <Input
          id="name"
          type="text"
          required
          placeholder="e.g., Daily Production Backup"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Schedule Type</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={scheduleType}
          onChange={e => setScheduleType(e.target.value)}
          disabled={loading}
        >
          <option value="minute">Every Minute</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      {scheduleType === "hourly" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Minute of the Hour</label>
          <Input
            type="number"
            min={0}
            max={59}
            value={minute}
            onChange={e => setMinute(Number(e.target.value))}
            disabled={loading}
          />
        </div>
      )}
      {scheduleType === "daily" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Time of Day</label>
          <Input
            type="time"
            value={timeOfDay}
            onChange={e => setTimeOfDay(e.target.value)}
            disabled={loading}
          />
        </div>
      )}
      {scheduleType === "weekly" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Day of Week</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={dayOfWeek}
            onChange={e => setDayOfWeek(e.target.value)}
            disabled={loading}
          >
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </select>
          <label className="block text-sm font-medium mt-2">Time of Day</label>
          <Input
            type="time"
            value={timeOfDay}
            onChange={e => setTimeOfDay(e.target.value)}
            disabled={loading}
          />
        </div>
      )}
      {scheduleType === "monthly" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Date of Month</label>
          <Input
            type="number"
            min={1}
            max={31}
            value={dateOfMonth}
            onChange={e => setDateOfMonth(Number(e.target.value))}
            disabled={loading}
          />
          <label className="block text-sm font-medium mt-2">Time of Day</label>
          <Input
            type="time"
            value={timeOfDay}
            onChange={e => setTimeOfDay(e.target.value)}
            disabled={loading}
          />
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="retention" className="block text-sm font-medium">Retention Period (days)</label>
        <Input
          id="retention"
          type="number"
          required
          min="1"
          max="365"
          value={retention}
          onChange={e => setRetention(Number(e.target.value))}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          How long to keep backups before automatically deleting them
        </p>
      </div>
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <div className="flex gap-3 justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Creating..." : "Create Schedule"}
        </Button>
      </div>
      {databasesUsingSchedule && (
        <div className="space-y-2">
          <Button type="button" variant="outline" onClick={() => setShowDatabases(true)}>
            {`Show Databases Using This Schedule (${databasesUsingSchedule.length})`}
          </Button>
          <Modal open={showDatabases} onClose={() => setShowDatabases(false)} title="Databases Using This Schedule">
            <ul className="space-y-2">
              {databasesUsingSchedule.length === 0 ? (
                <li className="text-muted-foreground">No databases use this schedule.</li>
              ) : (
                databasesUsingSchedule.map(db => (
                  <li key={db.id} className="border-b pb-2">
                    <span className="font-medium">{db.name}</span> <span className="text-xs text-muted-foreground">({db.type})</span>
                  </li>
                ))
              )}
            </ul>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowDatabases(false)}>Close</Button>
            </div>
          </Modal>
        </div>
      )}
    </form>
  );
} 