"use client";
import React, { useState } from "react";

interface EditUserFormProps {
  user: { id: number; email: string; role: string };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password: password || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update user.");
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
    <form onSubmit={handleSubmit} className="space-y-2 mt-2 text-left bg-gray-50 p-4 rounded">
      <div>
        <label className="block text-xs font-medium text-gray-700">Role</label>
        <select
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={role}
          onChange={e => setRole(e.target.value)}
          disabled={loading}
        >
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">New Password (optional)</label>
        <input
          type="password"
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      {error && <div className="text-red-500 text-xs">{error}</div>}
      <div className="flex gap-2 mt-2">
        <button type="submit" className="py-1 px-3 bg-green-600 text-white rounded text-sm disabled:opacity-50" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button type="button" className="py-1 px-3 bg-gray-300 rounded text-sm" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
} 