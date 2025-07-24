"use client";
import React, { useState } from "react";

interface EditStorageFormProps {
  adapter: {
    id: number;
    name: string;
    type: string;
    config: Record<string, unknown>;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditStorageForm({ adapter, onSuccess, onCancel }: EditStorageFormProps) {
  const [name, setName] = useState(adapter.name);
  const [type, setType] = useState(adapter.type);
  const [config, setConfig] = useState(JSON.stringify(adapter.config, null, 2));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/storage/${adapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, config: JSON.parse(config) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update adapter.");
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
    <form onSubmit={handleSubmit} className="space-y-4 mt-2 text-left bg-gray-50 dark:bg-gray-900 p-4 rounded">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
        <input
          type="text"
          required
          className="mt-1 block w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Type</label>
        <select
          className="mt-1 block w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={type}
          onChange={e => setType(e.target.value)}
          disabled={loading}
        >
          <option value="LOCAL">Local</option>
          <option value="SFTP">SFTP Server</option>
          <option value="S3">Amazon S3 (Coming Soon)</option>
          <option value="GOOGLE_DRIVE">Google Drive (Beta)</option>
          <option value="AZURE">Azure Blob Storage (Coming Soon)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Config (JSON)</label>
        <textarea
          className="mt-1 block w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
          rows={4}
          value={config}
          onChange={e => setConfig(e.target.value)}
          disabled={loading}
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-2 mt-2">
        <button type="submit" className="py-1 px-3 bg-green-600 text-white rounded text-sm disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button type="button" className="py-1 px-3 bg-gray-300 dark:bg-gray-700 rounded text-sm" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
} 