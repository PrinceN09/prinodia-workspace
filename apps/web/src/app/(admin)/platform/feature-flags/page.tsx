"use client";

import { useState } from "react";

const GLOBAL_FLAGS = [
  {
    key: "ai_assistant",
    label: "AI Assistant",
    desc: "Enable the Prinodia AI assistant across the workspace",
    enabled: true,
  },
  {
    key: "drive_previews",
    label: "Drive File Previews",
    desc: "Server-side file preview rendering",
    enabled: true,
  },
  {
    key: "meet_recordings",
    label: "Meet Recordings",
    desc: "Allow meeting recordings and transcripts",
    enabled: true,
  },
  {
    key: "executive_suite",
    label: "Executive Suite",
    desc: "Cabinet and executive office features",
    enabled: false,
  },
  {
    key: "legal_hold",
    label: "Legal Hold",
    desc: "Prevent deletion of flagged content for compliance",
    enabled: false,
  },
  {
    key: "beta_features",
    label: "Beta Features",
    desc: "Access to unreleased beta functionality",
    enabled: false,
  },
];

const MODULES = [
  "drive",
  "canvas",
  "meet",
  "docs",
  "workflows",
  "analytics",
  "executive",
  "people",
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState(GLOBAL_FLAGS);
  const [orgId, setOrgId] = useState("");

  const toggle = (key: string) => {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Feature Flags & Modules</h2>
        <p className="text-sm text-gray-500 mt-1">
          Control feature availability globally or per organization.
        </p>
      </div>

      {/* Global flags */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Global Platform Flags</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            These affect all organizations unless overridden per-org.
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {flags.map((flag) => (
            <div key={flag.key} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{flag.label}</p>
                <p className="text-xs text-gray-400">{flag.desc}</p>
                <code className="text-xs text-gray-300 font-mono">{flag.key}</code>
              </div>
              <button
                onClick={() => toggle(flag.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${flag.enabled ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${flag.enabled ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Per-org override */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Per-Organization Override</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Organization ID or code…"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Load Org Flags
          </button>
        </div>
        {!orgId && (
          <p className="text-xs text-gray-400 mt-3">
            Enter an org ID to view and override flags for a specific organization.
          </p>
        )}
      </div>

      {/* Module enable/disable reference */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Modules</h3>
        <div className="grid grid-cols-4 gap-2">
          {MODULES.map((mod) => (
            <div
              key={mod}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-gray-700 capitalize">{mod}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Use{" "}
          <code className="font-mono bg-gray-100 px-1 rounded">
            PUT /v1/platform/modules/:orgId/:moduleKey
          </code>{" "}
          to enable/disable per org.
        </p>
      </div>
    </div>
  );
}
