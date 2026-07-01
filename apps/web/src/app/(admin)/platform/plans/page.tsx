"use client";

import { useState } from "react";

const PLANS = [
  {
    id: "1",
    name: "Starter",
    slug: "starter",
    tier: "STARTER",
    priceMonthly: 49,
    priceAnnually: 470,
    maxSeats: 5,
    trialDays: 14,
    isActive: true,
    isPublic: true,
    subs: 98,
  },
  {
    id: "2",
    name: "Business",
    slug: "business",
    tier: "BUSINESS",
    priceMonthly: 249,
    priceAnnually: 2390,
    maxSeats: 25,
    trialDays: 14,
    isActive: true,
    isPublic: true,
    subs: 87,
  },
  {
    id: "3",
    name: "Enterprise",
    slug: "enterprise",
    tier: "ENTERPRISE",
    priceMonthly: 999,
    priceAnnually: 9590,
    maxSeats: null,
    trialDays: 30,
    isActive: true,
    isPublic: true,
    subs: 24,
  },
  {
    id: "4",
    name: "Government",
    slug: "government",
    tier: "GOVERNMENT",
    priceMonthly: null,
    priceAnnually: null,
    maxSeats: null,
    trialDays: 30,
    isActive: true,
    isPublic: false,
    subs: 32,
  },
  {
    id: "5",
    name: "Education",
    slug: "education",
    tier: "EDUCATION",
    priceMonthly: 99,
    priceAnnually: 950,
    maxSeats: 50,
    trialDays: 60,
    isActive: true,
    isPublic: true,
    subs: 6,
  },
  {
    id: "6",
    name: "NGO",
    slug: "ngo",
    tier: "NGO",
    priceMonthly: 79,
    priceAnnually: 758,
    maxSeats: 20,
    trialDays: 30,
    isActive: true,
    isPublic: true,
    subs: 0,
  },
];

export default function PlatformPlansPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
          <p className="text-sm text-gray-500 mt-1">Manage the plans available to customers.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + New Plan
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Monthly
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Annual
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Max Seats
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Trial Days
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Subscribers
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PLANS.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{plan.slug}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{plan.tier}</td>
                <td className="px-4 py-3 text-gray-700">
                  {plan.priceMonthly != null ? `$${plan.priceMonthly}` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {plan.priceAnnually != null ? `$${plan.priceAnnually}` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-700">{plan.maxSeats ?? "Unlimited"}</td>
                <td className="px-4 py-3 text-gray-700">{plan.trialDays}d</td>
                <td className="px-4 py-3 font-medium text-gray-900">{plan.subs}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${plan.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                    {!plan.isPublic && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                        Private
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-blue-600 hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Create Plan</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Plan name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Slug (e.g. business-plus)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Monthly price ($)"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Annual price ($)"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
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
