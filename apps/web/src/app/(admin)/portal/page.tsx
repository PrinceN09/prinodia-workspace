"use client";

import Link from "next/link";

const QUICK_ACTIONS = [
  {
    href: "/portal/billing",
    label: "View Subscription",
    icon: "💳",
    desc: "Manage your plan and payment",
  },
  {
    href: "/portal/invoices",
    label: "Download Invoices",
    icon: "📄",
    desc: "Access billing history",
  },
  {
    href: "/portal/api-keys",
    label: "Manage API Keys",
    icon: "🔑",
    desc: "Create and revoke API credentials",
  },
  {
    href: "/portal/support",
    label: "Open Support Ticket",
    icon: "🎫",
    desc: "Get help from our team",
  },
  {
    href: "/portal/downloads",
    label: "Download Apps",
    icon: "⬇️",
    desc: "Desktop, mobile, and browser extensions",
  },
  {
    href: "/portal/branding",
    label: "Customize Branding",
    icon: "🎨",
    desc: "Colors, logo, and tagline",
  },
];

export default function PortalOverviewPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold">Welcome to your Customer Portal</h2>
        <p className="mt-1 text-blue-100 text-sm">
          Manage everything about your Prinodia Workspace subscription from one place.
        </p>
      </div>

      {/* Subscription status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Current Plan
            </h3>
            <p className="mt-1 text-2xl font-bold text-gray-900">Business</p>
            <p className="mt-1 text-sm text-gray-500">25 seats · Renews Jan 1, 2027</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Seats used</p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">12 / 25</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Storage used</p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">4.2 GB / 125 GB</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Next invoice</p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">$249 / mo</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                {action.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent tickets */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Recent Support Tickets</h3>
          <Link href="/portal/support" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <p className="text-sm text-gray-400 text-center py-6">No recent tickets.</p>
      </div>
    </div>
  );
}
