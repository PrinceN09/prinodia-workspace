"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/platform", label: "Dashboard" },
  { href: "/platform/organizations", label: "Organizations" },
  { href: "/platform/plans", label: "Plans" },
  { href: "/platform/feature-flags", label: "Feature Flags" },
  { href: "/platform/support", label: "Support Tickets" },
  { href: "/platform/billing", label: "Billing" },
  { href: "/platform/downloads", label: "Downloads" },
  { href: "/platform/email-templates", label: "Email Templates" },
  { href: "/platform/audit", label: "Audit Log" },
];

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1E3A5F] px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">⚙️</span>
          <h1 className="text-white font-semibold text-sm">Platform Admin</h1>
          <span className="ml-2 px-2 py-0.5 bg-blue-500/30 text-blue-200 text-xs rounded font-medium">
            Internal
          </span>
        </div>
        <nav className="flex gap-0.5 mt-3 overflow-x-auto">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/platform" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors
                  ${
                    active
                      ? "bg-white/20 text-white"
                      : "text-blue-200 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
