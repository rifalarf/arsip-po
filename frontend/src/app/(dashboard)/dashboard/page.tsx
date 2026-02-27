"use client";

import Link from "next/link";
import {
  useBoxes,
  usePOs,
  useBorrowLogs,
  useBins,
  useOccupiedBinIds,
  useBoxesByStatus,
  useBoxLocationHistory,
} from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Archive,
  Package,
  Boxes,
  BookOpen,
  Clock,
  ArrowUpRight,
  PackagePlus,
  AlertTriangle,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BoxStatus } from "@/lib/types";
import { useMemo } from "react";

const STATUS_DOT: Record<BoxStatus, string> = {
  ARCHIVED: "bg-green-500",
  CANCELLED: "bg-red-400",
};

const STATUS_LABELS: Record<BoxStatus, string> = {
  ARCHIVED: "Diarsipkan",
  CANCELLED: "Dibatalkan",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export default function DashboardPage() {
  const { data: boxes = [] } = useBoxes();
  const { data: pos = [] } = usePOs();
  const { data: borrowLogs = [] } = useBorrowLogs();
  const { data: bins = [] } = useBins();
  const { data: boxLocationHistory = [] } = useBoxLocationHistory();
  const occupiedBinIds = useOccupiedBinIds();
  const archivedBoxes = useBoxesByStatus("ARCHIVED");

  // ---- Existing KPIs ----
  const totalPO = pos.length;
  const totalArchived = archivedBoxes.length;
  const totalBorrowed = pos.filter((p) => p.borrow_status === "BORROWED").length;
  const activeBorrows = borrowLogs.filter((l) => !l.returned_at).length;
  const occupiedBins = occupiedBinIds.size;
  const totalBins = bins.length;
  const availableBins = totalBins - occupiedBins;

  // ---- New KPIs ----
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);

  const thisMonthBoxes = boxes.filter((b) => {
    const d = new Date(b.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const lastMonthBoxes = boxes.filter((b) => {
    const d = new Date(b.created_at);
    return (
      d.getMonth() === lastMonthDate.getMonth() &&
      d.getFullYear() === lastMonthDate.getFullYear()
    );
  }).length;

  const monthDiff = thisMonthBoxes - lastMonthBoxes;
  const monthTrendLabel =
    lastMonthBoxes === 0
      ? "Bulan berjalan"
      : `${monthDiff >= 0 ? "+" : ""}${monthDiff} vs bulan lalu`;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const overdueBorrows = borrowLogs.filter(
    (l) => !l.returned_at && new Date(l.borrowed_at) < sevenDaysAgo,
  ).length;

  // ---- 6-month trend ----
  const sixMonthTrend = useMemo(() => {
    const months: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const count = boxes.filter((b) => {
        const bd = new Date(b.created_at);
        return bd.getMonth() === m && bd.getFullYear() === y;
      }).length;
      months.push({ label: MONTH_NAMES[m], count });
    }
    return months;
  }, [boxes, thisMonth, thisYear]);

  const maxTrend = Math.max(...sixMonthTrend.map((m) => m.count), 1);

  // ---- Top 3 Buyers ----
  const buyerMap = useMemo(() => {
    const map: Record<string, number> = {};
    pos.forEach((p) => {
      map[p.buyer_name] = (map[p.buyer_name] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [pos]);

  // ---- Recent Activities (last 5, mixed events) ----
  type Activity = {
    type: "create" | "relocate" | "borrow" | "return";
    label: string;
    detail: string;
    time: Date;
  };

  const activities = useMemo((): Activity[] => {
    const list: Activity[] = [];

    boxes.slice(0, 15).forEach((b) => {
      list.push({
        type: "create",
        label: b.no_gungyu ?? `Box ${b.tahun}`,
        detail: `Arsip dibuat oleh ${b.owner_name}`,
        time: new Date(b.created_at),
      });
    });

    borrowLogs.slice(0, 15).forEach((l) => {
      list.push({
        type: "borrow",
        label: l.no_po,
        detail: `Dipinjam oleh ${l.borrower_name}`,
        time: new Date(l.borrowed_at),
      });
      if (l.returned_at) {
        list.push({
          type: "return",
          label: l.no_po,
          detail: `Dikembalikan`,
          time: new Date(l.returned_at),
        });
      }
    });

    boxLocationHistory.slice(0, 15).forEach((h) => {
      const box = boxes.find((b) => b.id === h.box_id);
      list.push({
        type: "relocate",
        label: box?.no_gungyu ?? "Box",
        detail: `Dipindahkan ke ${h.to_bin_id}`,
        time: new Date(h.moved_at),
      });
    });

    return list.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);
  }, [boxes, borrowLogs, boxLocationHistory]);

  function relativeTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m lalu`;
    if (hours < 24) return `${hours}j lalu`;
    return `${days}h lalu`;
  }

  const activityIcons: Record<Activity["type"], React.ReactNode> = {
    create: <PackagePlus className="h-3.5 w-3.5 text-primary" />,
    relocate: <MapPin className="h-3.5 w-3.5 text-blue-500" />,
    borrow: <BookOpen className="h-3.5 w-3.5 text-amber-500" />,
    return: <RotateCcw className="h-3.5 w-3.5 text-green-500" />,
  };

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

      {/* KPI Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total PO"
          value={totalPO}
          description="Dokumen terarsip"
          icon={Package}
        />
        <KpiCard
          title="Box Diarsipkan"
          value={totalArchived}
          description="Box tersimpan di rak"
          icon={Boxes}
        />
        <KpiCard
          title="Sedang Dipinjam"
          value={totalBorrowed}
          description={`${activeBorrows} peminjam aktif`}
          icon={BookOpen}
          highlight={totalBorrowed > 0}
        />
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

      {/* KPI Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Arsip Bulan Ini"
          value={thisMonthBoxes}
          description={monthTrendLabel}
          icon={TrendingUp}
          trend={
            lastMonthBoxes > 0 && monthDiff !== 0
              ? { positive: monthDiff > 0 }
              : undefined
          }
        />
        <KpiCard
          title="Terlambat Kembali"
          value={overdueBorrows}
          description="Dipinjam > 7 hari"
          icon={AlertTriangle}
          highlight={overdueBorrows > 0}
        />
        <KpiCard
          title="Rak Tersedia"
          value={availableBins}
          description={`dari ${totalBins} total bin`}
          icon={Archive}
          highlight={availableBins === 0 && totalBins > 0}
        />
        <KpiCard
          title="Buyer Aktif"
          value={buyerMap.length}
          description="PIC/buyer terdaftar"
          icon={Users}
        />
      </div>

      {/* Section Row: Aktivitas + Box Terbaru */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Aktivitas Terakhir */}
        <div className="md:col-span-4 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Aktivitas Terakhir
          </h2>
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Belum ada aktivitas.
                </p>
              ) : (
                activities.map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      {activityIcons[act.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium font-mono leading-tight">
                        {act.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {act.detail}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {relativeTime(act.time)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Box Terbaru */}
        <div className="md:col-span-3 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Box Terbaru
          </h2>
          <Card className="shadow-sm border-none bg-secondary/30">
            <CardContent className="p-4 space-y-2">
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

      {/* Section Row: Tren Arsip + Top Buyer */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Tren Arsip 6 Bulan */}
        <div className="md:col-span-4 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            Tren Arsip 6 Bulan
          </h2>
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-end gap-3 h-28">
                {sixMonthTrend.map((m, i) => {
                  const heightPct =
                    maxTrend === 0 ? 0 : (m.count / maxTrend) * 100;
                  const isCurrent = i === 5;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1.5"
                    >
                      <span className="text-xs font-medium text-muted-foreground h-4">
                        {m.count > 0 ? m.count : ""}
                      </span>
                      <div className="w-full relative" style={{ height: "72px" }}>
                        <div
                          className={cn(
                            "absolute bottom-0 w-full rounded-t transition-all duration-500",
                            isCurrent ? "bg-primary" : "bg-primary/25",
                          )}
                          style={{
                            height: `${Math.max(heightPct, m.count > 0 ? 8 : 0)}%`,
                          }}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs",
                          isCurrent
                            ? "font-semibold text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Total{" "}
                {sixMonthTrend.reduce((s, m) => s + m.count, 0)} arsip dalam 6
                bulan terakhir
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Buyer */}
        <div className="md:col-span-3 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            Top Buyer
          </h2>
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-4">
              {buyerMap.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Belum ada data buyer.
                </p>
              ) : (
                buyerMap.map(([name, count], i) => {
                  const pct =
                    totalPO > 0 ? Math.round((count / totalPO) * 100) : 0;
                  return (
                    <div key={name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground w-4">
                            {i + 1}.
                          </span>
                          <span className="font-medium truncate max-w-35">
                            {name}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs shrink-0">
                          {count} PO ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
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
  trend?: { positive: boolean };
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "shadow-sm hover:shadow-md transition-all duration-200 border-l-4",
        highlight ? "border-l-destructive" : "border-l-primary/10",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            "h-4 w-4",
            highlight ? "text-destructive" : "text-muted-foreground",
          )}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {description}
          {trend && (
            <span
              className={cn(
                "ml-2 font-medium rounded-full px-1.5 py-0.5 flex items-center gap-0.5",
                trend.positive
                  ? "text-green-700 bg-green-50"
                  : "text-red-600 bg-red-50",
              )}
            >
              {trend.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

