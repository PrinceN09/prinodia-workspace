"use client";

import { useState } from "react";

const TEMPLATES = [
  {
    id: "1",
    slug: "welcome",
    name: "Welcome Email",
    category: "ONBOARDING",
    subject: "Welcome to Prinodia, {{firstName}}!",
    isActive: true,
    updatedAt: "Dec 10, 2026",
  },
  {
    id: "2",
    slug: "trial-started",
    name: "Trial Started",
    category: "ONBOARDING",
    subject: "Your 14-day trial has started",
    isActive: true,
    updatedAt: "Dec 10, 2026",
  },
  {
    id: "3",
    slug: "trial-expiry-warning",
    name: "Trial Expiry Warning",
    category: "BILLING",
    subject: "Your trial ends in {{daysLeft}} days",
    isActive: true,
    updatedAt: "Nov 28, 2026",
  },
  {
    id: "4",
    slug: "invoice-paid",
    name: "Invoice Paid",
    category: "BILLING",
    subject: "Receipt for invoice {{invoiceNumber}}",
    isActive: true,
    updatedAt: "Nov 28, 2026",
  },
  {
    id: "5",
    slug: "invoice-due",
    name: "Invoice Due",
    category: "BILLING",
    subject: "Invoice {{invoiceNumber}} is due on {{dueDate}}",
    isActive: true,
    updatedAt: "Nov 28, 2026",
  },
  {
    id: "6",
    slug: "org-suspended",
    name: "Organization Suspended",
    category: "SYSTEM",
    subject: "Your Prinodia workspace has been suspended",
    isActive: true,
    updatedAt: "Oct 5, 2026",
  },
  {
    id: "7",
    slug: "ticket-received",
    name: "Support Ticket Received",
    category: "SUPPORT",
    subject: "We received your request ({{ticketNumber}})",
    isActive: true,
    updatedAt: "Oct 5, 2026",
  },
  {
    id: "8",
    slug: "ticket-resolved",
    name: "Support Ticket Resolved",
    category: "SUPPORT",
    subject: "Your request {{ticketNumber}} has been resolved",
    isActive: true,
    updatedAt: "Oct 5, 2026",
  },
  {
    id: "9",
    slug: "password-reset",
    name: "Password Reset",
    category: "SECURITY",
    subject: "Reset your Prinodia password",
    isActive: true,
    updatedAt: "Sep 1, 2026",
  },
  {
    id: "10",
    slug: "api-key-created",
    name: "API Key Created",
    category: "SECURITY",
    subject: "New API key created for your workspace",
    isActive: false,
    updatedAt: "Sep 1, 2026",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  ONBOARDING: "bg-blue-100 text-blue-700",
  BILLING: "bg-green-100 text-green-700",
  SYSTEM: "bg-orange-100 text-orange-700",
  SUPPORT: "bg-purple-100 text-purple-700",
  SECURITY: "bg-red-100 text-red-700",
};

export default function EmailTemplatesPage() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editTemplate, setEditTemplate] = useState<(typeof TEMPLATES)[0] | null>(null);

  const filtered = categoryFilter
    ? TEMPLATES.filter((t) => t.category === categoryFilter)
    : TEMPLATES;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage transactional email templates. Use{" "}
            <code className="font-mono text-xs bg-gray-100 px-1 rounded">{"{{variable}}"}</code> for
            dynamic values.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + New Template
        </button>
      </div>

      <div className="flex gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
        >
          <option value="">All categories</option>
          {["ONBOARDING", "BILLING", "SYSTEM", "SUPPORT", "SECURITY"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="self-center text-sm text-gray-400">
          {filtered.length} template{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Template
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Subject Line
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Updated
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((tpl) => (
              <tr key={tpl.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{tpl.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{tpl.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[tpl.category] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {tpl.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate font-mono text-xs">
                  {tpl.subject}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{tpl.updatedAt}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tpl.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                  >
                    {tpl.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditTemplate(tpl)}
                    className="text-xs text-blue-600 hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button className="text-xs text-gray-400 hover:underline">Preview</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Edit Template</h3>
            <p className="text-xs text-gray-400 font-mono mb-4">{editTemplate.slug}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={editTemplate.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject Line</label>
                <input
                  type="text"
                  defaultValue={editTemplate.subject}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">HTML Body</label>
                <textarea
                  rows={8}
                  placeholder="<!DOCTYPE html>..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-xs resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Plain Text Body
                </label>
                <textarea
                  rows={4}
                  placeholder="Fallback plain-text version…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tpl-active"
                  defaultChecked={editTemplate.isActive}
                  className="rounded"
                />
                <label htmlFor="tpl-active" className="text-sm text-gray-700">
                  Active (will be sent)
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
              <button
                onClick={() => setEditTemplate(null)}
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
