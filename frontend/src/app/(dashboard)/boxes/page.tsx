"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBoxes, usePOs } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BoxStatus } from "@/lib/types";
import { CalendarDays, MapPin, User2, Search, X, Box as BoxIcon, FileText, CheckCircle2, AlertCircle, Printer } from "lucide-react";
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

export default function BoxesPage() {
  const { data: boxes = [] } = useBoxes();
  const { data: pos = [] } = usePOs();
  const [tab, setTab] = useState<TabValue>("all");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [minPoCount, setMinPoCount] = useState("");
  const [maxPoCount, setMaxPoCount] = useState("");

  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const router = useRouter();

  const poCountMap = useMemo(() => {
    const map = new Map<string, number>();
    pos.forEach((po) => {
      map.set(po.box_id, (map.get(po.box_id) || 0) + 1);
    });
    return map;
  }, [pos]);

  const uniqueOwnerNames = useMemo(() => {
    const ownerNames = Array.from(new Set(boxes.map((box) => box.owner_name))).filter(Boolean);
    return ownerNames.sort((a, b) => a.localeCompare(b));
  }, [boxes]);

  const filtered = useMemo(() => {
    return boxes.filter((box) => {
      // 1. Tab filter
      if (tab === "no_location" && !(box.status === "ARCHIVED" && !box.bin_id)) return false;
      if (tab !== "all" && tab !== "no_location" && box.status !== tab) return false;

      // 2. Search filter
      const query = searchQuery.toLowerCase();
      if (query) {
        const matchOwner = box.owner_name.toLowerCase().includes(query);
        const matchNoGungyu = box.no_gungyu?.toLowerCase().includes(query) ?? false;
        const matchLocation = box.location_code?.toLowerCase().includes(query) ?? false;
        if (!matchOwner && !matchNoGungyu && !matchLocation) return false;
      }

      // 3. Owner Filter
      if (ownerFilter !== "all" && box.owner_name !== ownerFilter) return false;

      // 4. PO Count Filter
      const boxPoCount = poCountMap.get(box.id) || 0;
      if (minPoCount !== "" && boxPoCount < parseInt(minPoCount, 10)) return false;
      if (maxPoCount !== "" && boxPoCount > parseInt(maxPoCount, 10)) return false;

      return true;
    });
  }, [boxes, tab, searchQuery, ownerFilter, minPoCount, maxPoCount, poCountMap]);

  const resetFilters = () => {
    setSearchQuery("");
    setOwnerFilter("all");
    setMinPoCount("");
    setMaxPoCount("");
  };

  const hasActiveFilters =
    searchQuery !== "" || ownerFilter !== "all" || minPoCount !== "" || maxPoCount !== "";

  const countByStatus = (status: BoxStatus) => boxes.filter((box) => box.status === status).length;
  const countNoLocation = boxes.filter((box) => box.status === "ARCHIVED" && !box.bin_id).length;

  // KPI Metrics
  const totalBoxes = boxes.length;
  const archivedBoxes = countByStatus("ARCHIVED");
  const cancelledBoxes = countByStatus("CANCELLED");
  const totalPos = pos.length;

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Box</h1>
          <p className="text-muted-foreground">Semua box arsip ({boxes.length} total)</p>
        </div>
        {selectedBoxIds.length > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <span className="text-sm font-medium">
              {selectedBoxIds.length} Box Terpilih
            </span>
            <Button
              onClick={() => {
                router.push(`/print-massal?ids=${selectedBoxIds.join(",")}`);
              }}
              className="bg-primary shadow-lg"
            >
              <Printer className="mr-2 h-4 w-4" />
              Cetak Massal
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedBoxIds([])}>
              Batal
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Box</CardTitle>
            <BoxIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBoxes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Box Diarsipkan</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedBoxes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Belum Ada Lokasi</CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countNoLocation}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total PO</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari box, lokasi, no gungyu..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Semua PIC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua PIC</SelectItem>
                {uniqueOwnerNames.map((ownerName) => (
                  <SelectItem key={ownerName} value={ownerName}>
                    {ownerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min PO"
                className="w-full md:w-[90px]"
                value={minPoCount}
                onChange={(e) => setMinPoCount(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max PO"
                className="w-full md:w-[90px]"
                value={maxPoCount}
                onChange={(e) => setMaxPoCount(e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={resetFilters} title="Reset Filter">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Semua ({boxes.length})</TabsTrigger>
          <TabsTrigger value="no_location">Belum Ada Lokasi ({countNoLocation})</TabsTrigger>
          <TabsTrigger value="ARCHIVED">Diarsipkan ({countByStatus("ARCHIVED")})</TabsTrigger>
          <TabsTrigger value="CANCELLED">Dibatalkan ({countByStatus("CANCELLED")})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Tidak ada box yang sesuai dengan filter.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((box) => {
                const poCount = poCountMap.get(box.id) || 0;
                const isSelected = selectedBoxIds.includes(box.id);

                return (
                  <Card
                    key={box.id}
                    className={cn(
                      "relative transition-all duration-200 border-2",
                      isSelected ? "border-primary bg-primary/5" : "border-transparent shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    )}
                  >
                    {/* Make the Card clickable overall, except checkbox area */}
                    <Link href={`/boxes/${box.id}`} className="absolute inset-0 z-0" />
                    
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBoxIds((prev) => [...prev, box.id]);
                              } else {
                                setSelectedBoxIds((prev) => prev.filter((id) => id !== box.id));
                              }
                            }}
                            className="mt-1"
                          />
                          <CardTitle className="text-base leading-tight mt-0.5">
                            {box.no_gungyu ?? `Box — ${box.owner_name.split(" ")[0]}`}
                          </CardTitle>
                        </div>
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
                            {poCount} PO
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{box.owner_name}</span>
                        </div>
                        {box.location_code && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-mono text-xs">{box.location_code}</span>
                          </div>
                        )}
                      </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
