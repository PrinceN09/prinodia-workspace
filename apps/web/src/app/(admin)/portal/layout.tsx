"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/billing", label: "Billing" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/licenses", label: "Licenses & Seats" },
  { href: "/portal/api-keys", label: "API Keys" },
  { href: "/portal/downloads", label: "Downloads" },
  { href: "/portal/branding", label: "Branding" },
  { href: "/portal/onboarding", label: "Onboarding" },
  { href: "/portal/support", label: "Support" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Portal header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Customer Portal</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your subscription, billing, and workspace settings
        </p>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${
                    active
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
