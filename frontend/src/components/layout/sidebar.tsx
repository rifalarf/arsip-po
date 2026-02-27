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

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-primary text-primary-foreground shadow-lg">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-primary-foreground/10">
        <Archive className="h-6 w-6" />
        <span className="text-lg font-semibold tracking-tight">Arsip</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary-foreground/10 text-primary-foreground shadow-sm font-semibold"
                  : "text-primary-foreground/70 hover:bg-primary-foreground/5 hover:text-primary-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-primary-foreground/10 px-3 py-4">
        {user && (
          <div className="px-3">
            <p className="text-sm font-medium opacity-90">{user.name}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
