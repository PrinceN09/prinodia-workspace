"use client";

import { useState } from "react";

const TICKETS = [
  {
    id: "1",
    number: "TKT-2026-100042",
    org: "Ministry of Finance",
    subject: "Unable to upload files to Drive",
    category: "TECHNICAL",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignee: "Sarah K.",
    created: "Dec 29",
  },
  {
    id: "2",
    number: "TKT-2026-100041",
    org: "Kinstech Solutions",
    subject: "Billing discrepancy on November invoice",
    category: "BILLING",
    priority: "NORMAL",
    status: "OPEN",
    assignee: null,
    created: "Dec 28",
  },
  {
    id: "3",
    number: "TKT-2026-100039",
    org: "Université de Kinshasa",
    subject: "Canvas boards not syncing in real time",
    category: "TECHNICAL",
    priority: "URGENT",
    status: "OPEN",
    assignee: null,
    created: "Dec 27",
  },
  {
    id: "4",
    number: "TKT-2026-100035",
    org: "Caritas DRC",
    subject: "Request for bulk user import feature",
    category: "FEATURE_REQUEST",
    priority: "LOW",
    status: "RESOLVED",
    assignee: "Jean P.",
    created: "Dec 20",
  },
];

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  WAITING_ON_CUSTOMER: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-gray-300",
  NORMAL: "bg-blue-400",
  HIGH: "bg-orange-400",
  URGENT: "bg-red-500",
};

export default function PlatformSupportPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = statusFilter ? TICKETS.filter((t) => t.status === statusFilter) : TICKETS;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
          <p className="text-sm text-gray-500 mt-1">
            {TICKETS.filter((t) => t.status === "OPEN").length} open ·{" "}
            {TICKETS.filter((t) => t.priority === "URGENT").length} urgent
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Ticket
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Organization
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Assignee
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 text-xs max-w-xs truncate">{t.subject}</p>
                  <p className="text-xs text-gray-400 font-mono">{t.number}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{t.org}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{t.category.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${PRIORITY_DOT[t.priority] ?? "bg-gray-300"}`}
                    />
                    <span className="text-xs text-gray-600">{t.priority}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {t.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {t.assignee ?? <span className="text-orange-500">Unassigned</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
