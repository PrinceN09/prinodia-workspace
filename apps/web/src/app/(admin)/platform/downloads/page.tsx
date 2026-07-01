"use client";

import { useState } from "react";

const DOWNLOADS = [
  {
    id: "1",
    name: "Prinodia for Windows",
    version: "2.1.0",
    platform: "WINDOWS",
    category: "DESKTOP",
    size: "94.2 MB",
    downloads: 8120,
    isActive: true,
    updatedAt: "Dec 20, 2026",
  },
  {
    id: "2",
    name: "Prinodia for macOS",
    version: "2.1.0",
    platform: "MAC",
    category: "DESKTOP",
    size: "102.7 MB",
    downloads: 6440,
    isActive: true,
    updatedAt: "Dec 20, 2026",
  },
  {
    id: "3",
    name: "Prinodia for Linux",
    version: "2.1.0",
    platform: "LINUX",
    category: "DESKTOP",
    size: "87.5 MB",
    downloads: 1230,
    isActive: true,
    updatedAt: "Dec 20, 2026",
  },
  {
    id: "4",
    name: "Prinodia iOS",
    version: "2.0.4",
    platform: "IOS",
    category: "MOBILE",
    size: "—",
    downloads: 14200,
    isActive: true,
    updatedAt: "Dec 15, 2026",
  },
  {
    id: "5",
    name: "Prinodia Android",
    version: "2.0.4",
    platform: "ANDROID",
    category: "MOBILE",
    size: "—",
    downloads: 11800,
    isActive: true,
    updatedAt: "Dec 15, 2026",
  },
  {
    id: "6",
    name: "Prinodia CLI",
    version: "1.3.2",
    platform: "CLI",
    category: "CLI",
    size: "12.1 MB",
    downloads: 3900,
    isActive: true,
    updatedAt: "Nov 30, 2026",
  },
  {
    id: "7",
    name: "Chrome Extension",
    version: "1.1.0",
    platform: "BROWSER_EXTENSION",
    category: "EXTENSION",
    size: "—",
    downloads: 5210,
    isActive: true,
    updatedAt: "Nov 22, 2026",
  },
];

const PLATFORM_ICONS: Record<string, string> = {
  WINDOWS: "🪟",
  MAC: "🍎",
  LINUX: "🐧",
  IOS: "📱",
  ANDROID: "🤖",
  CLI: "💻",
  BROWSER_EXTENSION: "🧩",
};

export default function PlatformDownloadsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Download Assets</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage downloadable apps and binaries shown in the customer download center.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + Add Asset
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Asset
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Platform
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Version
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Size
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Downloads
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Updated
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {DOWNLOADS.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{PLATFORM_ICONS[asset.platform] ?? "📦"}</span>
                    <span className="font-medium text-gray-900">{asset.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {asset.platform.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">v{asset.version}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{asset.size}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {asset.downloads.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{asset.updatedAt}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${asset.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                  >
                    {asset.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditId(asset.id)}
                    className="text-xs text-blue-600 hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button className="text-xs text-red-500 hover:underline">Hide</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showCreate || editId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {editId ? "Edit Asset" : "Add Download Asset"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Prinodia for Windows"
                  defaultValue={editId ? DOWNLOADS.find((d) => d.id === editId)?.name : ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {[
                      "WINDOWS",
                      "MAC",
                      "LINUX",
                      "IOS",
                      "ANDROID",
                      "CLI",
                      "BROWSER_EXTENSION",
                      "OTHER",
                    ].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Version</label>
                  <input
                    type="text"
                    placeholder="e.g. 2.1.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Download URL</label>
                <input
                  type="url"
                  placeholder="https://releases.prinodia.com/…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Release Notes (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="What's new in this version…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                {editId ? "Save" : "Add Asset"}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setEditId(null);
                }}
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
