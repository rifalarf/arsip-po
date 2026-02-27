"use client";

import Link from "next/link";
import {
  useBoxes,
  usePOs,
  useBorrowLogs,
  useBins,
  useOccupiedBinIds,
  useBoxesByStatus,
} from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Archive,
  Package,
  Boxes,
  BookOpen,
  Clock,
  Activity,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BoxStatus } from "@/lib/types";

const STATUS_DOT: Record<BoxStatus, string> = {
  ARCHIVED: "bg-green-500",
  CANCELLED: "bg-red-400",
};

const STATUS_LABELS: Record<BoxStatus, string> = {
  ARCHIVED: "Diarsipkan",
  CANCELLED: "Dibatalkan",
};

export default function DashboardPage() {
  const { data: boxes = [] } = useBoxes();
  const { data: pos = [] } = usePOs();
  const { data: borrowLogs = [] } = useBorrowLogs();
  const { data: bins = [] } = useBins();
  const occupiedBinIds = useOccupiedBinIds();
  const archivedBoxes = useBoxesByStatus("ARCHIVED");

  const totalPO = pos.length;
  const totalArchived = archivedBoxes.length;
  const noLocationCount = boxes.filter(
    (box) => box.status === "ARCHIVED" && !box.bin_id,
  ).length;
  const totalBorrowed = pos.filter(
    (po) => po.borrow_status === "BORROWED",
  ).length;
  const activeBorrows = borrowLogs.filter((log) => !log.returned_at).length;
  const occupiedBins = occupiedBinIds.size;
  const totalBins = bins.length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Ringkasan aktivitas dan status arsip terkini
          </p>
        </div>
        <div className="text-sm font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
          <Clock className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-card" style={{ animationDelay: "0ms" }}>
          <KpiCard
            title="Total PO"
            value={totalPO}
            description="Dokumen terarsip"
            icon={Package}
          />
        </div>
        <div className="animate-card" style={{ animationDelay: "60ms" }}>
          <KpiCard
            title="Box Diarsipkan"
            value={totalArchived}
            description="Box tersimpan di rak"
            icon={Boxes}
          />
        </div>
        <div className="animate-card" style={{ animationDelay: "120ms" }}>
          <KpiCard
            title="Sedang Dipinjam"
            value={totalBorrowed}
            description={`${activeBorrows} peminjam aktif`}
            icon={BookOpen}
            highlight={totalBorrowed > 0}
          />
        </div>
        <div className="animate-card" style={{ animationDelay: "180ms" }}>
          <KpiCard
            title="Kapasitas Rak"
            value={
              totalBins > 0
                ? `${((occupiedBins / totalBins) * 100).toFixed(1)}%`
                : "—"
            }
            description={`${occupiedBins}/${totalBins} bin terpakai`}
            icon={Archive}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Pending Boxes Section */}
        <div className="md:col-span-4 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Belum Ada Lokasi
          </h2>
          <div className="space-y-3">
            {noLocationCount > 0 && (
              <div className="rounded-xl border p-4 flex items-center justify-between bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Belum Ditempatkan
                    </p>
                    <p className="text-xs text-blue-700">
                      {noLocationCount} box menunggu penempatan
                    </p>
                  </div>
                </div>
                <Link href="/boxes">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-blue-800 hover:bg-blue-100"
                  >
                    Lihat <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
            {noLocationCount === 0 && (
              <div className="p-8 border rounded-xl border-dashed text-center text-muted-foreground text-sm">
                Semua box sudah memiliki lokasi.
              </div>
            )}
          </div>
        </div>

        {/* Recent Boxes Section */}
        <div className="md:col-span-3 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Box Terbaru
          </h2>
          <Card className="shadow-sm border-none bg-secondary/30">
            <CardContent className="p-4 space-y-3">
              {boxes
                .slice()
                .reverse()
                .slice(0, 4)
                .map((box) => (
                  <Link key={box.id} href={`/boxes/${box.id}`}>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border shadow-sm transition-transform hover:scale-[1.02] cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            STATUS_DOT[box.status],
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {box.no_gungyu ?? `Box ${box.tahun}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {box.location_code ?? "Belum ditempatkan"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground border rounded-full px-2 py-0.5">
                        {STATUS_LABELS[box.status]}
                      </span>
                    </div>
                  </Link>
                ))}
              <Link href="/boxes">
                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground hover:text-primary h-8 mt-2"
                >
                  Lihat Semua Box <ArrowUpRight className="ml-1 w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  highlight,
}: {
  title: string;
  value: number | string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  trend?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "shadow-sm hover:shadow-md transition-all duration-200 border-l-4",
        highlight ? "border-l-accent" : "border-l-primary/10",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            "h-4 w-4",
            highlight ? "text-accent" : "text-muted-foreground",
          )}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums text-primary">
          {value}
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {description}
          {trend && (
            <span className="ml-2 text-green-600 font-medium bg-green-50 rounded-full px-1.5 py-0.5">
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
