"use client";

import { useState } from "react";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { MobileSidebarContext } from "@/components/layout/MobileSidebarContext";
import { CommandPalette, useCommandPalette } from "@/components/search/CommandPalette";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const cmdK = useCommandPalette();

  return (
    <MobileSidebarContext.Provider value={{ openSidebar: () => setMobileSidebarOpen(true) }}>
      <div className="flex h-full bg-[var(--surface-page)]">
        <AdminSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Cmd+K quick search bar */}
          <div className="flex h-8 items-center justify-end border-b border-slate-200 bg-slate-50 px-4">
            <button
              onClick={() => cmdK.setOpen(true)}
              className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            >
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              Rechercher
              <kbd className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] font-medium">
                ⌘K
              </kbd>
            </button>
          </div>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <CommandPalette open={cmdK.open} onClose={cmdK.close} />
    </MobileSidebarContext.Provider>
  );
}
