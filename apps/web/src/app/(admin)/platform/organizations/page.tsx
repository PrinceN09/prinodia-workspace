"use client";

import Link from "next/link";
import { useState } from "react";

interface Org {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  plan: string;
  seats: number;
  trialEndsAt: string | null;
  createdAt: string;
}

const MOCK_ORGS: Org[] = [
  {
    id: "1",
    name: "Ministry of Finance",
    code: "MOF-DRC",
    type: "GOVERNMENT",
    status: "ACTIVE",
    plan: "Government",
    seats: 120,
    trialEndsAt: null,
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    name: "Kinstech Solutions",
    code: "KINSTECH",
    type: "ENTERPRISE",
    status: "TRIALING",
    plan: "Business",
    seats: 8,
    trialEndsAt: "2027-01-12",
    createdAt: "2026-12-28",
  },
  {
    id: "3",
    name: "Université de Kinshasa",
    code: "UNIKIN",
    type: "EDUCATION",
    status: "TRIALING",
    plan: "Education",
    seats: 45,
    trialEndsAt: "2027-01-11",
    createdAt: "2026-12-27",
  },
  {
    id: "4",
    name: "Caritas DRC",
    code: "CARITAS-DRC",
    type: "NGO",
    status: "ACTIVE",
    plan: "NGO",
    seats: 22,
    trialEndsAt: null,
    createdAt: "2026-06-01",
  },
  {
    id: "5",
    name: "Acme Corp",
    code: "ACME",
    type: "ENTERPRISE",
    status: "SUSPENDED",
    plan: "Business",
    seats: 15,
    trialEndsAt: null,
    createdAt: "2025-12-10",
  },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  TRIALING: "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
  INACTIVE: "bg-gray-100 text-gray-500",
  ARCHIVED: "bg-gray-100 text-gray-400",
};

export default function PlatformOrganizationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showProvision, setShowProvision] = useState(false);

  const filtered = MOCK_ORGS.filter((o) => {
    const matchSearch =
      !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
          <p className="text-sm text-gray-500 mt-1">
            {MOCK_ORGS.length} organizations ·{" "}
            {MOCK_ORGS.filter((o) => o.status === "TRIALING").length} on trial
          </p>
        </div>
        <button
          onClick={() => setShowProvision(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + Provision Org
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="TRIALING">Trialing</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Organization
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Seats
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Created
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{org.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{org.code}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{org.type.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{org.plan}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{org.seats}</td>
                <td className="px-4 py-3">
                  <div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[org.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {org.status}
                    </span>
                    {org.trialEndsAt && (
                      <p className="text-xs text-orange-500 mt-0.5">Trial ends {org.trialEndsAt}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{org.createdAt}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/platform/organizations/${org.id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provision modal */}
      {showProvision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Provision New Organization
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ministry of Health"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Code (unique)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MOH-DRC"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                    <option>GOVERNMENT</option>
                    <option>ENTERPRISE</option>
                    <option>EDUCATION</option>
                    <option>HEALTHCARE</option>
                    <option>NGO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Starting Plan
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                    <option>starter</option>
                    <option>business</option>
                    <option>enterprise</option>
                    <option>government</option>
                    <option>education</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Billing Email
                </label>
                <input
                  type="email"
                  placeholder="billing@org.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                Provision
              </button>
              <button
                onClick={() => setShowProvision(false)}
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
