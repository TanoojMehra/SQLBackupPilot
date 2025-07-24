"use client";

import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Search,
  Filter,
  Calendar,
  User,
  Activity,
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

interface AuditLog {
  id: number;
  user?: { email: string };
  action: string;
  details?: string;
  createdAt: string;
}

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create')) return <Activity className="h-4 w-4 text-green-500" />;
  if (actionLower.includes('update') || actionLower.includes('edit')) return <Activity className="h-4 w-4 text-blue-500" />;
  if (actionLower.includes('delete')) return <Activity className="h-4 w-4 text-red-500" />;
  if (actionLower.includes('login') || actionLower.includes('auth')) return <User className="h-4 w-4 text-purple-500" />;
  return <Activity className="h-4 w-4 text-gray-500" />;
};

const getActionBadgeVariant = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create')) return 'secondary';
  if (actionLower.includes('delete')) return 'destructive';
  if (actionLower.includes('login') || actionLower.includes('auth')) return 'outline';
  return 'default';
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("all");

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/audit");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch logs.");
        } else {
          setLogs(data.logs);
        }
      } catch {
        setError("Server error.");
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === "all" || log.action.toLowerCase().includes(filterAction.toLowerCase());
    const matchesUser = filterUser === "all" || log.user?.email === filterUser;
    return matchesSearch && matchesAction && matchesUser;
  });

  const uniqueUsers = Array.from(new Set(logs.map(log => log.user?.email).filter(Boolean)));
  const uniqueActions = Array.from(new Set(logs.map(log => {
    const action = log.action.toLowerCase();
    if (action.includes('create')) return 'create';
    if (action.includes('update') || action.includes('edit')) return 'update';
    if (action.includes('delete')) return 'delete';
    if (action.includes('login') || action.includes('auth')) return 'auth';
    return 'other';
  })));

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
            <p className="text-muted-foreground">Track all system activities and changes</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
            <p className="text-muted-foreground">Track all system activities and changes</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all system activities and changes
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              {filteredLogs.length} entries
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs by action, details, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filterAction === "all" ? "All Actions" : 
                   filterAction.charAt(0).toUpperCase() + filterAction.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterAction("all")}>
                  All Actions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {uniqueActions.map((action) => (
                  <DropdownMenuItem key={action} onClick={() => setFilterAction(action)}>
                    {action.charAt(0).toUpperCase() + action.slice(1)} Actions
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  {filterUser === "all" ? "All Users" : filterUser}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterUser("all")}>
                  All Users
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {uniqueUsers.map((user) => (
                  <DropdownMenuItem key={user} onClick={() => setFilterUser(user || "")}>
                    {user}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {filteredLogs.length} of {logs.length} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No audit logs found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || filterAction !== "all" || filterUser !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No activities have been logged yet"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {getActionIcon(log.action)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {log.user?.email || "System"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="text-sm text-muted-foreground">
                        {log.details || "No additional details"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 