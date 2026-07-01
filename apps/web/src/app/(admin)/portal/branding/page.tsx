"use client";

import { useState } from "react";

export default function BrandingPage() {
  const [form, setForm] = useState({
    companyTagline: "Empowering government transparency",
    primaryColor: "#1E3A5F",
    accentColor: "#2E75B6",
    billingEmail: "billing@org.gov",
    technicalEmail: "tech@org.gov",
    customDomain: "",
    whitelabelEnabled: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise((r) => setTimeout(r, 500));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Branding & Profile</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize how your organization appears in Prinodia.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          void handleSave(e);
        }}
        className="space-y-6"
      >
        {/* Logo */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Logo & Identity</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-2xl">
              🏛️
            </div>
            <div>
              <button
                type="button"
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Upload Logo
              </button>
              <p className="text-xs text-gray-400 mt-1">
                PNG, SVG · Max 2 MB · Recommended 200×200px
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Tagline</label>
            <input
              type="text"
              value={form.companyTagline}
              onChange={(e) => setForm({ ...form, companyTagline: e.target.value })}
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Brand Colors</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  maxLength={7}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  maxLength={7}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div
            className="rounded-lg p-4 text-white text-sm font-medium"
            style={{ backgroundColor: form.primaryColor }}
          >
            Preview: Prinodia Workspace —{" "}
            <span
              style={{ color: form.accentColor === form.primaryColor ? "#fff" : form.accentColor }}
            >
              Accented text
            </span>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Billing & Technical Contacts</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
              <input
                type="email"
                value={form.billingEmail}
                onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technical Email
              </label>
              <input
                type="email"
                value={form.technicalEmail}
                onChange={(e) => setForm({ ...form, technicalEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Custom domain */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Custom Domain{" "}
            <span className="text-xs font-normal text-gray-400 ml-1">Enterprise plan</span>
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Domain</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.customDomain}
                onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                placeholder="workspace.yourorg.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Verify DNS
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Add a CNAME record pointing to{" "}
              <code className="font-mono bg-gray-100 px-1 rounded">workspace.prinodia.com</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
          {saved && <span className="text-sm text-green-600">✓ Saved successfully</span>}
        </div>
      </form>
    </div>
  );
}
