"use client";

import Link from "next/link";

const STEPS = [
  {
    step: 0,
    key: "profile",
    label: "Complete org profile",
    desc: "Fill in your organization's name, country, and contact details.",
    href: "/portal/branding",
    completed: true,
  },
  {
    step: 1,
    key: "branding",
    label: "Set up branding",
    desc: "Upload your logo and configure brand colors.",
    href: "/portal/branding",
    completed: true,
  },
  {
    step: 2,
    key: "invite_users",
    label: "Invite team members",
    desc: "Bring your team into the workspace.",
    href: "/admin/employees",
    completed: false,
  },
  {
    step: 3,
    key: "enable_modules",
    label: "Enable modules",
    desc: "Turn on Drive, Canvas, Meet, and other modules for your org.",
    href: "/portal/licenses",
    completed: false,
  },
  {
    step: 4,
    key: "configure_domain",
    label: "Configure workspace domain",
    desc: "Set up a custom domain or use your default workspace URL.",
    href: "/portal/branding",
    completed: false,
  },
  {
    step: 5,
    key: "explore",
    label: "Explore the workspace",
    desc: "Take a quick tour of what Prinodia can do.",
    href: "/admin",
    completed: false,
  },
];

export default function OnboardingPage() {
  const completedCount = STEPS.filter((s) => s.completed).length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Workspace Setup</h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete these steps to get the most out of Prinodia.
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {completedCount} of {STEPS.length} steps complete
          </span>
          <span className="text-sm font-semibold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <p className="text-sm text-green-600 font-medium mt-3">
            🎉 Your workspace is fully set up!
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`bg-white rounded-lg border p-5 flex items-start gap-4 ${s.completed ? "border-green-200 bg-green-50/30" : "border-gray-200"}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                s.completed ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {s.completed ? "✓" : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${s.completed ? "text-green-800 line-through" : "text-gray-900"}`}
              >
                {s.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </div>
            {!s.completed && (
              <Link
                href={s.href}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 shrink-0"
              >
                Start
              </Link>
            )}
          </div>
        ))}
      </div>

      {progress < 100 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
          💡 Complete all steps to unlock the full Prinodia experience and activate your workspace.
        </div>
      )}
    </div>
  );
}
