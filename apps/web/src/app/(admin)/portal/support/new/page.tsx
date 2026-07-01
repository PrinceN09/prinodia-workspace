"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewTicketPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    subject: "",
    category: "TECHNICAL",
    priority: "NORMAL",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // In production: POST /v1/platform/support/tickets
    await new Promise((r) => setTimeout(r, 800));
    router.push("/portal/support");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Open a Support Ticket</h2>
        <p className="text-sm text-gray-500 mt-1">
          Our support team typically responds within 24 hours.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="bg-white rounded-lg border border-gray-200 p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Briefly describe the issue"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BILLING">Billing</option>
              <option value="TECHNICAL">Technical</option>
              <option value="ACCOUNT">Account</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="SECURITY">Security</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            required
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the issue in detail. Include steps to reproduce, error messages, and what you expected to happen."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Ticket"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
