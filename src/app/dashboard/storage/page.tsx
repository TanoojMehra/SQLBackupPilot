"use client";

import React, { useEffect, useState } from "react";
import { 
  HardDrive, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Cloud,
  Database,
  Shield,
  Globe
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
import AddStorageForm from "./AddStorageForm";
import EditStorageForm from "./EditStorageForm";

interface StorageAdapter {
  id: number;
  name: string;
  type: string;
  config: Record<string, string | boolean | number>;
  createdAt: string;
  status: 'connected' | 'disconnected' | 'error';
  backupCount: number;
  totalSize: string;
}

export default function StoragePage() {
  const [adapters, setAdapters] = useState<StorageAdapter[]>([]);
  const [filteredAdapters, setFilteredAdapters] = useState<StorageAdapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number|null>(null);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const fetchAdapters = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/storage");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch adapters.");
      } else {
        setAdapters(data.adapters || []);
      }
    } catch {
      setError("Server error.");
      setAdapters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdapters();
  }, []);

  useEffect(() => {
    const filtered = adapters.filter(adapter =>
      adapter.name.toLowerCase().includes(search.toLowerCase()) ||
      adapter.type.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredAdapters(filtered);
  }, [adapters, search]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/storage/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAdapters();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete storage adapter.");
      }
    } catch {
      setError("Server error.");
    }
    setDeleteId(null);
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

  const getStorageIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 's3':
      case 'aws':
        return <Cloud className="h-5 w-5 text-orange-600" />;
      case 'google drive':
      case 'gdrive':
        return <Globe className="h-5 w-5 text-blue-600" />;
      case 'azure':
        return <Cloud className="h-5 w-5 text-blue-500" />;
      case 'local':
        return <Database className="h-5 w-5 text-gray-600" />;
      default:
        return <HardDrive className="h-5 w-5 text-primary" />;
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

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = Math.round(bytes / Math.pow(1024, i) * 100) / 100;
    return size + ' ' + sizes[i];
  };

  const calculateTotalStorage = (adapters: StorageAdapter[]): string => {
    let totalBytes = 0;
    
    adapters.forEach(adapter => {
      const sizeStr = adapter.totalSize;
      if (sizeStr && sizeStr !== "0 B") {
        const parts = sizeStr.split(' ');
        const value = parseFloat(parts[0]);
        const unit = parts[1];
        
        switch (unit) {
          case 'TB': totalBytes += value * 1024 * 1024 * 1024 * 1024; break;
          case 'GB': totalBytes += value * 1024 * 1024 * 1024; break;
          case 'MB': totalBytes += value * 1024 * 1024; break;
          case 'KB': totalBytes += value * 1024; break;
          case 'B': totalBytes += value; break;
        }
      }
    });
    
    return formatFileSize(totalBytes);
  };

  const stats = {
    totalAdapters: adapters.length,
    connectedAdapters: adapters.filter(a => a.status === 'connected').length,
    totalBackups: adapters.reduce((sum, a) => sum + a.backupCount, 0),
    totalStorageUsed: calculateTotalStorage(adapters)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Storage Adapters</h1>
            <p className="text-muted-foreground">Manage your backup storage destinations and configurations.</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Storage Adapters</h1>
          <p className="text-muted-foreground">Manage your backup storage destinations and configurations.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Storage
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Adapters</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdapters}</div>
            <p className="text-xs text-muted-foreground">
              {stats.connectedAdapters} connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBackups}</div>
            <p className="text-xs text-muted-foreground">Across all storage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStorageUsed}</div>
            <p className="text-xs text-muted-foreground">Total backup storage</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Configurations</CardTitle>
          <CardDescription>View and manage all your backup storage destinations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search storage adapters..."
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

          {filteredAdapters.length === 0 ? (
            <div className="text-center py-12">
              <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No storage adapters found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try adjusting your search terms." : "Get started by adding your first storage destination."}
              </p>
              {!search && (
                <Button onClick={() => setShowAdd(true)} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Storage
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Storage</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Backups</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdapters.map((adapter) => (
                    <TableRow key={adapter.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getStorageIcon(adapter.type)}
                          </div>
                          <div>
                            <div className="font-medium">{adapter.name}</div>
                            <div className="text-sm text-muted-foreground">
                                                             {adapter.type === 'S3' && adapter.config.bucket && `Bucket: ${String(adapter.config.bucket)}`}
                               {adapter.type === 'Google Drive' && adapter.config.sharedDrive && 'Shared Drive'}
                               {adapter.type === 'Local' && adapter.config.path && `Path: ${String(adapter.config.path)}`}
                               {adapter.type === 'Azure' && adapter.config.container && `Container: ${String(adapter.config.container)}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{adapter.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(adapter.status)}</TableCell>
                      <TableCell>
                        <span className="font-medium">{adapter.backupCount}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{adapter.totalSize}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(adapter.createdAt)}</span>
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
                            <DropdownMenuItem onClick={() => setEditingId(adapter.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(adapter.id)}
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

      {/* Add Storage Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Storage Adapter" widthClass="max-w-3xl">
        <AddStorageForm onSuccess={() => { setShowAdd(false); fetchAdapters(); }} />
      </Modal>

      {/* Edit Storage Modal */}
      {editingId && (
        <Modal 
          open={!!editingId} 
          onClose={() => setEditingId(null)} 
          title="Edit Storage Adapter"
          widthClass="max-w-3xl"
        >
          <EditStorageForm
            adapter={adapters.find(a => a.id === editingId)!}
            onSuccess={() => { setEditingId(null); fetchAdapters(); }}
            onCancel={() => setEditingId(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal 
          open={!!deleteId} 
          onClose={() => setDeleteId(null)} 
          title="Delete Storage Adapter"
        >
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this storage adapter? This action cannot be undone.
              Existing backups stored in this location will not be deleted, but new backups cannot be stored here.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDelete(deleteId)}
              >
                Delete Adapter
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
} 