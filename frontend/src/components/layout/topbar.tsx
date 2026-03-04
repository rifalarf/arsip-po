"use client";

import { useApp } from "@/lib/context";
import { useRouter } from "next/navigation";
import { Archive, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar, SidebarContent } from "./sidebar";

export function Topbar() {
  const { user, logout } = useApp();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 overflow-hidden">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <Archive className="h-5 w-5" />
        <span className="font-semibold">Arsip</span>
      </div>

      <div className="flex-1" />

      {/* Profile dropdown */}
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-900">
            Hi, {user.name}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
            onClick={handleLogout}
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      )}
    </header>
  );
}
