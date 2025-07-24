"use client";
import React, { useState } from "react";

interface RestoreDialogProps {
  jobId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RestoreDialog({ jobId, onClose, onSuccess }: RestoreDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRestore = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/backups/${jobId}/restore`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Restore failed.");
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white p-6 rounded shadow-md text-center">
        <h2 className="text-xl font-bold mb-4">Restore Backup</h2>
        <p className="mb-4">Are you sure you want to restore this backup? This will overwrite the current database.</p>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-2 justify-center">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleRestore} disabled={loading}>
            {loading ? "Restoring..." : "Confirm Restore"}
          </button>
        </div>
      </div>
    </div>
  );
} 