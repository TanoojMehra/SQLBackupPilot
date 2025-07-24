"use client";

import React, { useEffect, useState } from "react";
import { 
  Database, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Server,
  Shield,
  Clock,
  Play
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
import AddDatabaseForm from "./AddDatabaseForm";
import EditDatabaseForm from "./EditDatabaseForm";

interface Database {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  username: string;
  backupEnabled?: boolean;
  scheduleId?: number | null;
  storageId?: number | null;
  createdAt: string;
  lastBackup?: string;
  status: 'connected' | 'disconnected' | 'error';
  backupCount: number;
}

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [filteredDatabases, setFilteredDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const handleManualBackup = async (database: Database) => {
    if (!database.backupEnabled) {
      setError("Backup is not enabled for this database. Please enable backup first.");
      return;
    }

    try {
      const res = await fetch("/api/backups/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          databaseId: database.id,
          storageId: database.storageId
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setError(""); // Clear any previous errors
        // You could show a success message here
        console.log("Manual backup started:", data.message);
      } else {
        setError(data.error || "Failed to start manual backup.");
      }
    } catch {
      setError("Server error while starting backup.");
    }
  };

  const fetchDatabases = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/databases");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch databases.");
      } else {
        setDatabases(data.databases || []);
      }
    } catch {
      setError("Server error.");
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    const filtered = databases.filter(db =>
      db.name.toLowerCase().includes(search.toLowerCase()) ||
      db.type.toLowerCase().includes(search.toLowerCase()) ||
      db.host.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredDatabases(filtered);
  }, [databases, search]);

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
    setDeleteConfirmText("");
  };
  const handleDeleteConfirm = async () => {
    if (deleteId) {
      // Call the delete API
      const res = await fetch(`/api/databases/${deleteId}`, { method: "DELETE" });
      setShowDeleteModal(false);
      setDeleteId(null);
      setDeleteConfirmText("");
      if (res.ok) {
        setNotification("Database deleted successfully.");
        fetchDatabases();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification("Failed to delete database. Please try again.");
        setTimeout(() => setNotification(null), 4000);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="status-success">Connected</Badge>;
      case 'disconnected':
        return <Badge className="status-warning">Disconnected</Badge>;
      case 'error':
        return <Badge className="status-error">Error</Badge>;
      default:
        return <Badge className="status-info">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Databases</h1>
            <p className="text-muted-foreground">Manage your database connections and configurations.</p>
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
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg animate-fadeIn">
          {notification}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Databases</h1>
          <p className="text-muted-foreground">Manage your database connections and configurations.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Database
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Databases</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{databases.length}</div>
            <p className="text-xs text-muted-foreground">
              {databases.filter(db => db.status === 'connected').length} connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {databases.reduce((sum, db) => sum + db.backupCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all databases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {databases.length > 0 ? Math.round((databases.filter(db => db.status === 'connected').length / databases.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Databases online</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Database Connections</CardTitle>
          <CardDescription>View and manage all your database connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search databases..."
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

          {filteredDatabases.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No databases found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try adjusting your search terms." : "Get started by adding your first database connection."}
              </p>
              {!search && (
                <Button onClick={() => setShowAdd(true)} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Database
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Database</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Auto-Backup</TableHead>
                    <TableHead>Last Backup</TableHead>
                    <TableHead>Backups</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDatabases.map((database) => (
                    <TableRow key={database.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Database className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{database.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {database.host}:{database.port}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{database.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(database.status)}</TableCell>
                      <TableCell>
                        {database.backupEnabled ? (
                          <Badge className="status-success">On</Badge>
                        ) : (
                          <Badge className="status-warning">Off</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {database.lastBackup ? formatDate(database.lastBackup) : 'Never'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{database.backupCount}</span>
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
                            {database.backupEnabled && (
                              <>
                                <DropdownMenuItem onClick={() => handleManualBackup(database)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Run Backup Now
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => setEditingId(database.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(database.id)}
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

      {/* Add Database Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Database Connection">
        <AddDatabaseForm onSuccess={() => { setShowAdd(false); fetchDatabases(); }} />
      </Modal>

      {/* Edit Database Modal */}
      {editingId && (
        <Modal 
          open={!!editingId} 
          onClose={() => setEditingId(null)} 
          title="Edit Database Connection"
        >
                     <EditDatabaseForm 
             database={databases.find(db => db.id === editingId)!}
             onSuccess={() => { setEditingId(null); fetchDatabases(); }}
             onCancel={() => setEditingId(null)}
           />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Database">
          <div className="space-y-4">
            <p className="text-destructive font-semibold">
              Deleting this database will <b>permanently delete all backup records</b> associated with it. <b>This action cannot be undone.</b><br/>
              <span className="text-warning-foreground">However, the actual backup files on disk (or in cloud storage) will <b>NOT</b> be deleted automatically. You must manually remove those files if you wish to free up space or prevent access.</span>
            </p>
            <p className="text-muted-foreground">
              <b>Before proceeding:</b> Please turn off automatic backup for this database and ensure you have downloaded any important SQL backup files you wish to keep.
            </p>
            <p className="text-sm">
              To confirm, type <span className="font-mono bg-muted px-1">I Agree</span> below:
            </p>
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-black dark:text-white bg-background"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="I Agree"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmText !== "I Agree"}
                onClick={handleDeleteConfirm}
              >
                Delete Database
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
} 