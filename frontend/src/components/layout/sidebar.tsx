"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  PackagePlus,
  LayoutDashboard,
  Boxes,
  BookOpen,
  Settings,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["buyer", "admin"],
  },
  {
    label: "Buat Arsip",
    href: "/input",
    icon: PackagePlus,
    roles: ["buyer", "admin"],
  },
  {
    label: "Arsip PO",
    href: "/po-list",
    icon: List,
    roles: ["buyer", "admin"],
  },
  {
    label: "Daftar Box",
    href: "/boxes",
    icon: Boxes,
    roles: ["buyer", "admin"],
  },
  {
    label: "Peminjaman",
    href: "/borrow",
    icon: BookOpen,
    roles: ["buyer", "admin"],
  },
  {
    label: "Histori",
    href: "/history",
    icon: Archive,
    roles: ["buyer", "admin"],
  },
  {
    label: "Manajemen Rak",
    href: "/settings",
    icon: Settings,
    roles: ["buyer", "admin"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useApp();

  const itemMenuTampil = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <aside
      className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 shadow-xl"
      style={{
        background:
          "linear-gradient(160deg, hsl(158,52%,11%) 0%, hsl(152,45%,15%) 60%, hsl(148,40%,18%) 100%)",
      }}
    >
      {/* Subtle grid texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,255,255,0.5) 28px,rgba(255,255,255,0.5) 29px), repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,255,255,0.5) 28px,rgba(255,255,255,0.5) 29px)",
        }}
      />

      {/* Logo */}
      <div className="relative flex h-16 items-center gap-3 px-5 border-b border-white/8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/12 border border-white/15 shadow-inner">
          <Archive className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-white">
            Arsip PO
          </span>
          <span className="text-[10px] text-white/45 font-medium tracking-wide uppercase">
            Pengadaan
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="relative flex-1 space-y-0.5 px-3 py-5"
        aria-label="Menu utama"
      >
        {itemMenuTampil.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 border-l-2",
                isActive
                  ? "bg-white/14 text-white shadow-sm border-emerald-400"
                  : "text-white/60 hover:bg-white/7 hover:text-white/90 border-transparent",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-emerald-300"
                    : "text-white/40 group-hover:text-white/70",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative border-t border-white/8 px-4 py-4">
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium text-white/80 truncate">
              {user.name}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
