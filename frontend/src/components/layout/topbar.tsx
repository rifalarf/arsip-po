"use client";

import { useApp } from "@/lib/context";
import { Archive, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "./sidebar";

export function Topbar() {
    const { user, logout } = useApp();

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            {/* Mobile menu */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <Sidebar />
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 px-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <div className="px-2 py-1.5">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => logout()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Keluar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </header>
    );
}
