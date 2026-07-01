"use client";

import { useState } from "react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
  isActive: boolean;
}

const MOCK_KEYS: ApiKey[] = [
  {
    id: "1",
    name: "Production Integration",
    keyPrefix: "pk_a1b2c3d4",
    scopes: ["read:users", "write:drive"],
    lastUsedAt: "2026-12-28",
    createdAt: "2026-10-01",
    isActive: true,
  },
  {
    id: "2",
    name: "CI/CD Pipeline",
    keyPrefix: "pk_e5f6g7h8",
    scopes: ["read:all"],
    lastUsedAt: "2026-12-27",
    createdAt: "2026-11-15",
    isActive: true,
  },
];

export default function ApiKeysPage() {
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleCreate = () => {
    // In production: POST /v1/platform/api-keys/:orgId
    setGeneratedKey(`pk_demo1234_${"x".repeat(64)}`);
    setShowModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage API credentials for your integrations.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + New API Key
        </button>
      </div>

      {generatedKey && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            ⚠️ Copy your API key now — it will not be shown again.
          </p>
          <code className="block text-xs font-mono bg-white border border-yellow-200 rounded p-2 break-all select-all">
            {generatedKey}
          </code>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(generatedKey);
            }}
            className="mt-2 text-xs text-yellow-700 underline"
          >
            Copy to clipboard
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Prefix
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Scopes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Last Used
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_KEYS.map((key) => (
              <tr key={key.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{key.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {key.keyPrefix}_••••••••
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {key.scopes.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{key.lastUsedAt ?? "Never"}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-red-600 hover:underline">Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Create API Key</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Integration"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Give it a descriptive name so you can identify it later.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Generate Key
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
