"use client";
import React, { useState } from "react";

interface Database {
  id: number;
  name: string;
  type: string;
  host: string;
}

interface DatabaseRowProps {
  database: Database;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DatabaseRow({ database, onEdit, onDelete }: DatabaseRowProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <tr>
      <td className="py-2 px-4 border">{database.name}</td>
      <td className="py-2 px-4 border">{database.type}</td>
      <td className="py-2 px-4 border">{database.host}</td>
      <td className="py-2 px-4 border text-right">
        <button className="mr-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm" onClick={onEdit}>
          Edit
        </button>
        <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm" onClick={() => setShowConfirm(true)}>
          Delete
        </button>
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-6 rounded shadow-md text-center">
              <p className="mb-4">Are you sure you want to delete this database connection?</p>
              <button className="mr-2 px-4 py-2 bg-gray-300 rounded" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => { setShowConfirm(false); onDelete(); }}>Delete</button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
} 