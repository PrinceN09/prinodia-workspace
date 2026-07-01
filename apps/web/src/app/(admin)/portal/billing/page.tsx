"use client";

import Link from "next/link";

const PLANS = [
  { name: "Starter", price: 49, seats: 5, storage: "25 GB", tier: "STARTER" },
  { name: "Business", price: 249, seats: 25, storage: "125 GB", tier: "BUSINESS", current: true },
  { name: "Enterprise", price: 999, seats: 100, storage: "500 GB", tier: "ENTERPRISE" },
];

export default function BillingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Subscription & Billing</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your plan, payment method, and billing contact.
        </p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Current Plan
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">Business — $249 / month</p>
              <p className="text-sm text-gray-500 mt-1">
                Renews January 1, 2027 · 25 seats included
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>
        <div className="p-6 flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Upgrade Plan
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Plans</h3>
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              className={`bg-white rounded-lg border p-5 ${plan.current ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"}`}
            >
              {plan.current && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 mb-3">
                  Current
                </span>
              )}
              <p className="text-base font-semibold text-gray-900">{plan.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${plan.price}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li>✓ Up to {plan.seats} seats</li>
                <li>✓ {plan.storage} storage</li>
                <li>✓ All modules</li>
              </ul>
              {!plan.current && (
                <button className="mt-4 w-full px-3 py-2 border border-blue-600 text-blue-600 text-sm rounded-lg hover:bg-blue-50">
                  Switch to {plan.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Method</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
              VISA
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
              <p className="text-xs text-gray-500">Expires 12/27</p>
            </div>
          </div>
          <button className="text-sm text-blue-600 hover:underline">Update</button>
        </div>
      </div>

      {/* Billing contact */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Billing Contact</h3>
          <Link href="/portal/branding" className="text-sm text-blue-600 hover:underline">
            Edit in Branding
          </Link>
        </div>
        <p className="text-sm text-gray-600">billing@yourorg.com</p>
        <p className="text-xs text-gray-400 mt-1">
          All invoices and billing notices are sent to this address.
        </p>
      </div>
    </div>
  );
}
