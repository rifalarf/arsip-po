"use client";

import { useApp } from "@/lib/context";
import { Archive, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function Topbar() {
    const { user } = useApp();

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

            {/* User badge */}
            {user && (
                <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{user.name}</span>
                    <span className="ml-2 capitalize">({user.role})</span>
                </div>
            )}
        </header>
    );
}
