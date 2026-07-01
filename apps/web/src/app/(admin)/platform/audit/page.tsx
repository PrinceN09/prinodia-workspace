"use client";

import { useState } from "react";

const LOGS = [
  {
    id: "1",
    action: "org.subscription.plan_changed",
    actorEmail: "admin@prinodia.com",
    orgId: "MOF-DRC",
    target: "subscription",
    at: "2026-12-29 14:32",
    ip: "41.243.x.x",
  },
  {
    id: "2",
    action: "org.status.suspended",
    actorEmail: "admin@prinodia.com",
    orgId: "ACME",
    target: "organization",
    at: "2026-12-28 11:15",
    ip: "41.243.x.x",
  },
  {
    id: "3",
    action: "plan.created",
    actorEmail: "admin@prinodia.com",
    orgId: null,
    target: "subscription_plan",
    at: "2026-12-27 09:00",
    ip: "41.243.x.x",
  },
  {
    id: "4",
    action: "org.provisioned",
    actorEmail: "admin@prinodia.com",
    orgId: "KINSTECH",
    target: "organization",
    at: "2026-12-28 08:00",
    ip: "41.243.x.x",
  },
  {
    id: "5",
    action: "feature_flag.updated",
    actorEmail: "admin@prinodia.com",
    orgId: "UNIKIN",
    target: "org_feature_flag",
    at: "2026-12-26 16:44",
    ip: "41.243.x.x",
  },
  {
    id: "6",
    action: "api_key.revoked",
    actorEmail: "prince@mof.gov.cd",
    orgId: "MOF-DRC",
    target: "api_key",
    at: "2026-12-25 12:30",
    ip: "196.217.x.x",
  },
];

export default function PlatformAuditPage() {
  const [search, setSearch] = useState("");

  const filtered = search
    ? LOGS.filter(
        (l) =>
          l.action.includes(search.toLowerCase()) ||
          l.actorEmail.includes(search.toLowerCase()) ||
          l.orgId?.toLowerCase().includes(search.toLowerCase()),
      )
    : LOGS;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Admin Audit Log</h2>
        <p className="text-sm text-gray-500 mt-1">
          Immutable record of all platform administrative actions.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by action, actor, or org…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
        />
        <input
          type="date"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
        />
        <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Organization
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Target
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono text-xs">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{log.at}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{log.action}</td>
                <td className="px-4 py-3 text-gray-600">{log.actorEmail}</td>
                <td className="px-4 py-3 text-gray-600">
                  {log.orgId ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">{log.target}</td>
                <td className="px-4 py-3 text-gray-400">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
