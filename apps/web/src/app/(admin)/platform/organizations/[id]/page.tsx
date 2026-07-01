"use client";

import { useParams } from "next/navigation";

const MODULES = ["drive", "canvas", "meet", "docs", "workflows", "analytics"];
const FEATURES = [
  "advanced_search",
  "custom_domain",
  "whitelabel",
  "api_access",
  "audit_export",
  "legal_hold",
];

export default function PlatformOrgDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Mock data – in production: fetch from GET /v1/platform/organizations/:id
  const org = {
    id,
    name: "Ministry of Finance",
    code: "MOF-DRC",
    type: "GOVERNMENT",
    status: "ACTIVE",
    country: "DRC",
    email: "contact@mof.gov.cd",
    subscription: { plan: "Government", status: "ACTIVE", seats: 120, seatCount: 87 },
    profile: { billingEmail: "billing@mof.gov.cd", onboardingCompleted: true, seatsUsed: 87 },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{org.name}</h2>
          <p className="text-sm text-gray-400 font-mono mt-0.5">
            {org.code} · {org.type} · {org.country}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-orange-300 text-orange-700 text-xs font-medium rounded-lg hover:bg-orange-50">
            Suspend
          </button>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
            Edit Org
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Subscription */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 col-span-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Subscription
          </h3>
          <p className="text-lg font-bold text-gray-900">{org.subscription.plan}</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 mt-1">
            {org.subscription.status}
          </span>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Seats</span>
              <span className="font-medium text-gray-900">
                {org.subscription.seatCount} / {org.subscription.seats}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Billing</span>
              <span className="font-medium text-gray-900">{org.profile.billingEmail}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Onboarding</span>
              <span
                className={`font-medium ${org.profile.onboardingCompleted ? "text-green-600" : "text-orange-500"}`}
              >
                {org.profile.onboardingCompleted ? "Complete" : "Pending"}
              </span>
            </div>
          </div>
          <button className="mt-4 w-full px-3 py-2 border border-blue-300 text-blue-600 text-xs rounded-lg hover:bg-blue-50">
            Change Plan
          </button>
        </div>

        {/* Modules */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 col-span-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Module Access
          </h3>
          <div className="space-y-2">
            {MODULES.map((mod) => (
              <div key={mod} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 capitalize">{mod}</span>
                <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-blue-600 transition-colors focus:outline-none">
                  <span className="translate-x-5 inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Feature flags */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 col-span-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Feature Flags
          </h3>
          <div className="space-y-2">
            {FEATURES.map((flag, i) => (
              <div key={flag} className="flex items-center justify-between">
                <span className="text-xs text-gray-700">{flag.replace(/_/g, " ")}</span>
                <button
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${i < 3 ? "bg-blue-600" : "bg-gray-200"}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${i < 3 ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent audit */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Admin Actions</h3>
        <div className="space-y-2">
          {[
            {
              action: "org.subscription.plan_changed",
              actor: "admin@prinodia.com",
              at: "Dec 20, 2026 14:32",
            },
            { action: "org.status.activated", actor: "system", at: "Jan 15, 2026 09:00" },
            { action: "org.provisioned", actor: "admin@prinodia.com", at: "Jan 15, 2026 08:55" },
          ].map((log, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-gray-700">{log.action}</p>
                <p className="text-xs text-gray-400">by {log.actor}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{log.at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
