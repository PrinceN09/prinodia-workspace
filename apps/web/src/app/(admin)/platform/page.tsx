"use client";

import Link from "next/link";

const METRICS = [
  { label: "Total Organizations", value: "247", change: "+12 this month", positive: true },
  { label: "Active Subscriptions", value: "231", change: "94% of orgs", positive: true },
  { label: "Trial Organizations", value: "38", change: "15 expiring this week", positive: false },
  { label: "Open Support Tickets", value: "14", change: "3 urgent", positive: false },
  { label: "MRR", value: "$48,200", change: "+8.3% vs last month", positive: true },
  { label: "Total API Keys", value: "892", change: "41 created this week", positive: true },
];

const PLAN_DIST = [
  { plan: "Starter", count: 98, color: "bg-gray-400" },
  { plan: "Business", count: 87, color: "bg-blue-500" },
  { plan: "Enterprise", count: 24, color: "bg-purple-500" },
  { plan: "Government", count: 32, color: "bg-green-500" },
  { plan: "Education", count: 6, color: "bg-yellow-500" },
];

const RECENT_ORGS = [
  {
    id: "1",
    name: "Ministry of Finance",
    type: "GOVERNMENT",
    plan: "Government",
    status: "ACTIVE",
    joined: "Dec 29",
  },
  {
    id: "2",
    name: "Kinstech Solutions",
    type: "ENTERPRISE",
    plan: "Business",
    status: "TRIALING",
    joined: "Dec 28",
  },
  {
    id: "3",
    name: "Université de Kinshasa",
    type: "EDUCATION",
    plan: "Education",
    status: "TRIALING",
    joined: "Dec 27",
  },
];

export default function PlatformDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h2 className="text-lg font-semibold text-gray-900">Platform Overview</h2>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-4">
        {METRICS.map((m) => (
          <div key={m.label} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{m.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{m.value}</p>
            <p className={`text-xs mt-1 ${m.positive ? "text-green-600" : "text-orange-500"}`}>
              {m.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Plan distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 col-span-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Plan Distribution</h3>
          <div className="space-y-3">
            {PLAN_DIST.map((p) => {
              const total = PLAN_DIST.reduce((s, x) => s + x.count, 0);
              return (
                <div key={p.plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{p.plan}</span>
                    <span className="text-xs font-medium text-gray-900">{p.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`${p.color} h-1.5 rounded-full`}
                      style={{ width: `${(p.count / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent orgs */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Recently Provisioned</h3>
            <Link href="/platform/organizations" className="text-xs text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 text-left text-xs font-medium text-gray-400">Organization</th>
                <th className="pb-2 text-left text-xs font-medium text-gray-400">Plan</th>
                <th className="pb-2 text-left text-xs font-medium text-gray-400">Status</th>
                <th className="pb-2 text-left text-xs font-medium text-gray-400">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {RECENT_ORGS.map((o) => (
                <tr key={o.id}>
                  <td className="py-2.5">
                    <p className="text-sm font-medium text-gray-900">{o.name}</p>
                    <p className="text-xs text-gray-400">{o.type}</p>
                  </td>
                  <td className="py-2.5 text-xs text-gray-600">{o.plan}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${o.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-gray-500">{o.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { href: "/platform/organizations", label: "Manage Orgs", icon: "🏢" },
          { href: "/platform/support", label: "Support Queue", icon: "🎫" },
          { href: "/platform/billing", label: "Billing", icon: "💰" },
          { href: "/platform/audit", label: "Audit Log", icon: "📋" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
