"use client";

import { useState } from "react";
import Link from "next/link";
import { useBoxes, usePOsByBoxId } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoxStatus } from "@/lib/types";
import { CalendarDays, MapPin, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<BoxStatus | "all" | "no_location", string> = {
  all: "Semua",
  no_location: "Belum Ada Lokasi",
  ARCHIVED: "Diarsipkan",
  CANCELLED: "Dibatalkan",
};

const STATUS_COLORS: Record<BoxStatus, string> = {
  ARCHIVED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

type TabValue = "all" | "no_location" | BoxStatus;

function POCount({ boxId }: { boxId: string }) {
  const pos = usePOsByBoxId(boxId);
  return <>{pos.length}</>;
}

export default function BoxesPage() {
  const { data: boxes = [] } = useBoxes();
  const [tab, setTab] = useState<TabValue>("all");

  const filtered =
    tab === "all"
      ? boxes
      : tab === "no_location"
        ? boxes.filter((box) => box.status === "ARCHIVED" && !box.bin_id)
        : boxes.filter((box) => box.status === tab);

  const countByStatus = (statusFilter: BoxStatus) =>
    boxes.filter((box) => box.status === statusFilter).length;
  const countNoLocation = boxes.filter(
    (box) => box.status === "ARCHIVED" && !box.bin_id,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daftar Box</h1>
        <p className="text-muted-foreground">
          Semua box arsip PO ({boxes.length} total)
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Semua ({boxes.length})</TabsTrigger>
          <TabsTrigger value="no_location">
            Belum Ada Lokasi ({countNoLocation})
          </TabsTrigger>
          <TabsTrigger value="ARCHIVED">
            Diarsipkan ({countByStatus("ARCHIVED")})
          </TabsTrigger>
          <TabsTrigger value="CANCELLED">
            Dibatalkan ({countByStatus("CANCELLED")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Tidak ada box dengan status ini
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((box) => {
                return (
                  <Link key={box.id} href={`/boxes/${box.id}`}>
                    <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-tight">
                            {box.no_gungyu ??
                              `Box ${box.tahun} — ${box.owner_name.split(" ")[0]}`}
                          </CardTitle>
                          <span
                            className={cn(
                              "text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0",
                              STATUS_COLORS[box.status],
                            )}
                          >
                            {STATUS_LABELS[box.status]}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            Tahun {box.tahun} · <POCount boxId={box.id} /> PO
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{box.owner_name}</span>
                        </div>
                        {box.location_code && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-mono text-xs">
                              {box.location_code}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
