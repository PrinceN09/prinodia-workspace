"use client";

import Link from "next/link";

const MOCK_TICKETS = [
  {
    id: "1",
    number: "TKT-2026-100042",
    subject: "Unable to upload files to Drive",
    category: "TECHNICAL",
    priority: "HIGH",
    status: "IN_PROGRESS",
    created: "Dec 29, 2026",
  },
  {
    id: "2",
    number: "TKT-2026-100031",
    subject: "Invoice for November shows incorrect amount",
    category: "BILLING",
    priority: "NORMAL",
    status: "RESOLVED",
    created: "Dec 20, 2026",
  },
  {
    id: "3",
    number: "TKT-2026-100028",
    subject: "Feature request: bulk user import",
    category: "FEATURE_REQUEST",
    priority: "LOW",
    status: "OPEN",
    created: "Dec 15, 2026",
  },
];

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  WAITING_ON_CUSTOMER: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-500",
  NORMAL: "bg-blue-50 text-blue-600",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
          <p className="text-sm text-gray-500 mt-1">Track the status of your support requests.</p>
        </div>
        <Link
          href="/portal/support/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + New Ticket
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {MOCK_TICKETS.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No tickets yet.</p>
            <Link
              href="/portal/support/new"
              className="text-blue-600 text-sm hover:underline mt-1 inline-block"
            >
              Open your first ticket
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Ticket #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_TICKETS.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{t.subject}</p>
                    <p className="text-xs text-gray-400">{t.category.replace(/_/g, " ")}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[t.priority] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
