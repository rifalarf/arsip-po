"use client";

import { useState } from "react";
import {
  useRacks,
  useRows,
  useLevels,
  useBins,
  useBoxes,
  usePOs,
  useOccupiedBinIds,
} from "@/hooks/queries";
import {
  useAddRack, useAddRackBatch,
  useAddRow,
  useAddLevel,
  useAddBin,
  useDeleteRack,
  useDeleteRow,
  useDeleteLevel,
  useDeleteBin,
} from "@/hooks/mutations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Layers,
  BarChart3,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Rack, Row, Level, Bin, Box } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ---- BinCell: pure, tooltip on hover ----
function BinCell({
  bin,
  isOccupied,
  borrowedCount,
  box,
}: {
  bin: Bin;
  isOccupied: boolean;
  borrowedCount: number;
  box: Box | null;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "w-7 h-7 rounded border text-[8px] flex items-center justify-center font-mono select-none transition-colors duration-150",
          !bin.is_active
            ? "opacity-30 bg-muted/20 border-dashed cursor-not-allowed"
            : !isOccupied
              ? "bg-muted/10 border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
              : borrowedCount > 0
                ? "bg-amber-100 border-amber-400 text-amber-800 hover:border-amber-500 cursor-pointer"
                : "bg-green-100 border-green-400 text-green-800 hover:border-green-500 cursor-pointer",
        )}
      >
        {bin.code}
      </div>

      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 bg-popover border border-border rounded-lg shadow-lg p-2.5 text-xs pointer-events-none">
          <p className="font-mono font-semibold text-foreground mb-1.5">
            {bin.bin_code}
          </p>
          {isOccupied && box ? (
            <div className="space-y-0.5">
              <div className="flex gap-1.5">
                <span className="text-muted-foreground w-10 shrink-0">
                  Box:
                </span>
                <span className="font-medium">{box.no_gungyu ?? "â€”"}</span>
              </div>
              <div className="flex gap-1.5">
                <span className="text-muted-foreground w-10 shrink-0">
                  PIC:
                </span>
                <span className="font-medium truncate max-w-[100px]">
                  {box.owner_name}
                </span>
              </div>
              {borrowedCount > 0 && (
                <p className="text-amber-600 font-semibold mt-1">
                  {borrowedCount} PO sedang dipinjam
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground italic">Bin kosong</p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
        </div>
      )
      }
    </div >
  );
}

// ---- Delete Confirm Button (dengan AlertDialog) ----
function DeleteConfirmButton({
  title,
  description,
  onConfirm,
  variant = "destructive",
  iconSize = "h-3 w-3",
  buttonSize = "h-6 w-6",
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: "destructive" | "outline";
  iconSize?: string;
  buttonSize?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${buttonSize} text-muted-foreground hover:text-destructive`}
          aria-label={title}
        >
          <Trash2 className={iconSize} aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Ya, Hapus / Nonaktifkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---- Rack Tree ----
function BinRow({
  bin,
  onDelete,
  occupied,
}: {
  bin: Bin;
  onDelete: (id: string) => void;
  occupied: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-1.5 rounded text-sm",
        occupied
          ? "bg-green-50 border border-green-200"
          : "bg-muted/30 border border-border",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            occupied ? "bg-green-500" : "bg-muted-foreground/30",
          )}
        />
        <span className="font-mono text-xs text-muted-foreground">{bin.bin_code}</span>
        {occupied && (
          <span className="text-[10px] text-green-700 font-medium">Terisi</span>
        )}
      </div>
      <DeleteConfirmButton
        title={`Hapus Bin ${bin.bin_code}?`}
        description={occupied
          ? "Bin ini masih terisi box. Relokasi box terlebih dahulu."
          : "Bin akan dihapus atau dinonaktifkan tergantung apakah pernah memiliki data historis."}
        onConfirm={() => onDelete(bin.id)}
      />
    </div>
  );
}

function AddInline({
  placeholder,
  onAdd,
  label,
}: {
  placeholder: string;
  onAdd: (val: string) => void;
  label: string;
}) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Input
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="h-7 text-xs w-28"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onAdd(val);
            setVal("");
          }
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs px-2"
        onClick={() => {
          onAdd(val);
          setVal("");
        }}
      >
        <Plus className="h-3 w-3 mr-1" />
        {label}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const { data: racks = [] } = useRacks();
  const { data: rows = [] } = useRows();
  const { data: levels = [] } = useLevels();
  const { data: bins = [] } = useBins();
  const { data: boxes = [] } = useBoxes();
  const { data: pos = [] } = usePOs();
  const occupiedBinIds = useOccupiedBinIds();

  const addRackMut = useAddRack();
  const addRowMut = useAddRow();
  const addLevelMut = useAddLevel();
  const addBinMut = useAddBin();
  const deleteRackMut = useDeleteRack();
  const deleteRowMut = useDeleteRow();
  const deleteLevelMut = useDeleteLevel();
  const deleteBinMut = useDeleteBin();
  const activeBins = bins.filter((b) => b.is_active);

  const [expandedRacks, setExpandedRacks] = useState<Set<string>>(
    new Set(racks.map((r) => r.id)),
  );
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    new Set(rows.map((r) => r.id)),
  );
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
    new Set(levels.map((l) => l.id)),
  );

  // Heatmap accordion: default-expand racks with occupancy > 0, or all if none occupied
  const [expandedHeatmapRacks, setExpandedHeatmapRacks] = useState<Set<string>>(
    () => {
      const occupied = new Set<string>();
      racks.forEach((rack) => {
        const rackRows = rows.filter((r) => r.rack_id === rack.id);
        const rackBins = bins.filter((b) =>
          rackRows.some((r) =>
            levels
              .filter((l) => l.row_id === r.id)
              .some((l) => l.id === b.level_id),
          ),
        );
        if (rackBins.some((b) => b.is_active)) occupied.add(rack.id);
      });
      return occupied.size > 0 ? occupied : new Set(racks.map((r) => r.id));
    },
  );

  const toggleHeatmapRack = (id: string) =>
    setExpandedHeatmapRacks((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleRack = (id: string) =>
    setExpandedRacks((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  const toggleLevel = (id: string) =>
    setExpandedLevels((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const handleAsync = async (
    fn: () => Promise<{ success: boolean; message: string }>,
  ) => {
    const result = await fn();
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  };

  const totalBins = activeBins.length;
  const occupiedCount = occupiedBinIds.size;
  const freeCount = totalBins - occupiedCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Rak</h1>
        <p className="text-muted-foreground">
          Kelola struktur rak dan pantau kapasitas
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bin Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBins}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {racks.filter(r => r.is_active).length} rack Â· {rows.filter(r => r.is_active).length} row Â· {levels.filter(l => l.is_active).length} level
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bin Terisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {occupiedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBins > 0
                ? ((occupiedCount / totalBins) * 100).toFixed(1)
                : 0}
              dari total aktif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bin Tersedia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{freeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Siap digunakan</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="struktur">
        <TabsList>
          <TabsTrigger value="struktur">
            <Layers className="h-4 w-4 mr-2" />
            Struktur Rak
          </TabsTrigger>
          <TabsTrigger value="heatmap">
            <BarChart3 className="h-4 w-4 mr-2" />
            Heatmap
          </TabsTrigger>
        </TabsList>

        {/* ---- STRUKTUR TAB ---- */}
        <TabsContent value="struktur" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pohon Struktur Rak</CardTitle>
                <AddInline
                  placeholder="Kode rack (A, Bâ€¦)"
                  label="Rack"
                  onAdd={(val) =>
                    handleAsync(() =>
                      addRackMut.mutateAsync({
                        code: val,
                        name: `Rack ${val.toUpperCase()}`,
                      }),
                    )
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {racks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Belum ada rack. Tambahkan rack pertama.
                </p>
              )}
              {racks.map((rack) => {
                const rackRows = rows.filter((r) => r.rack_id === rack.id);
                const rackBins = bins.filter((b) =>
                  rackRows.some((r) =>
                    levels
                      .filter((l) => l.row_id === r.id)
                      .some((l) => l.id === b.level_id),
                  ),
                );
                const rackOccupied = rackBins.filter((b) =>
                  occupiedBinIds.has(b.id),
                ).length;
                const isExpanded = expandedRacks.has(rack.id);

                return (
                  <div
                    key={rack.id}
                    className={cn(
                      "border rounded-lg overflow-hidden",
                      !rack.is_active && "opacity-50"
                    )}
                  >
                    {/* Rack header */}
                    <div
                      className="flex items-center justify-between px-3 py-2 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => toggleRack(rack.id)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-semibold">{rack.name}</span>
                        {!rack.is_active && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <EyeOff className="h-2.5 w-2.5" />
                            Nonaktif
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {rackBins.length} bin Â· {rackOccupied} terisi
                        </span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DeleteConfirmButton
                          title={`Hapus Rack ${rack.code}?`}
                          description={`Ini akan menghapus/menonaktifkan Rack ${rack.name} beserta seluruh ${rackRows.length} row, level, dan bin di dalamnya. Jika terdapat data historis, node akan dinonaktifkan. Jika belum pernah dipakai, akan dihapus permanen.`}
                          onConfirm={() =>
                            handleAsync(() =>
                              deleteRackMut.mutateAsync({ rackId: rack.id }),
                            )
                          }
                          iconSize="h-3.5 w-3.5"
                          buttonSize="h-7 w-7"
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-2 space-y-2 bg-background">
                        {rackRows.map((row) => {
                          const rowLevels = levels.filter(
                            (l) => l.row_id === row.id,
                          );
                          const isRowExpanded = expandedRows.has(row.id);

                          return (
                            <div
                              key={row.id}
                              className={cn(
                                "border rounded-md overflow-hidden ml-4",
                                false && "opacity-50"
                              )}
                            >
                              {/* Row header */}
                              <div
                                className="flex items-center justify-between px-2.5 py-1.5 bg-secondary/40 cursor-pointer hover:bg-secondary/60 transition-colors"
                                onClick={() => toggleRow(row.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {isRowExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                  <span className="text-sm font-medium">
                                    Row {row.code}
                                  </span>
                                  {false && (
                                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                      <EyeOff className="h-2.5 w-2.5" />
                                      Nonaktif
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {rowLevels.length} level
                                  </span>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <DeleteConfirmButton
                                    title={`Hapus Row ${row.code}?`}
                                    description={`Ini akan menghapus/menonaktifkan Row ${row.code} beserta semua level dan bin di dalamnya.`}
                                    onConfirm={() =>
                                      handleAsync(() =>
                                        deleteRowMut.mutateAsync({ rowId: row.id }),
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              {isRowExpanded && (
                                <div className="px-2.5 pb-2 pt-1.5 space-y-1.5 bg-background">
                                  {rowLevels.map((lvl) => {
                                    const lvlBins = bins.filter(
                                      (b) => b.level_id === lvl.id,
                                    );
                                    const isLvlExpanded = expandedLevels.has(
                                      lvl.id,
                                    );

                                    return (
                                      <div
                                        key={lvl.id}
                                        className={cn(
                                          "border rounded ml-3",
                                          !lvl.is_active && "opacity-50"
                                        )}
                                      >
                                        {/* Level header */}
                                        <div
                                          className="flex items-center justify-between px-2 py-1 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                                          onClick={() => toggleLevel(lvl.id)}
                                        >
                                          <div className="flex items-center gap-1.5">
                                            {isLvlExpanded ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )}
                                            <span className="text-xs font-medium">
                                              Level {lvl.code}
                                            </span>
                                            {!lvl.is_active && (
                                              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <EyeOff className="h-2.5 w-2.5" />
                                                Nonaktif
                                              </span>
                                            )}
                                            <span className="text-[11px] text-muted-foreground">
                                              {lvlBins.length} bin
                                            </span>
                                          </div>
                                          <div onClick={(e) => e.stopPropagation()}>
                                            <DeleteConfirmButton
                                              title={`Hapus Level ${lvl.code}?`}
                                              description={`Ini akan menghapus/menonaktifkan Level ${lvl.code} beserta ${lvlBins.length} bin di dalamnya.`}
                                              onConfirm={() =>
                                                handleAsync(() =>
                                                  deleteLevelMut.mutateAsync({ levelId: lvl.id }),
                                                )
                                              }
                                              iconSize="h-2.5 w-2.5"
                                              buttonSize="h-5 w-5"
                                            />
                                          </div>
                                        </div>

                                        {isLvlExpanded && (
                                          <div className="px-2 pb-2 pt-1.5 space-y-1 ml-3">
                                            {lvlBins.map((bin) => (
                                              <BinRow
                                                key={bin.id}
                                                bin={bin}
                                                occupied={occupiedBinIds.has(
                                                  bin.id,
                                                )}
                                                onDelete={(id) =>
                                                  handleAsync(() =>
                                                    deleteBinMut.mutateAsync({
                                                      binId: id,
                                                    }),
                                                  )
                                                }
                                              />
                                            ))}
                                            <AddInline
                                              placeholder="Kode bin (01â€¦)"
                                              label="Bin"
                                              onAdd={(val) =>
                                                handleAsync(() =>
                                                  addBinMut.mutateAsync({
                                                    levelId: lvl.id,
                                                    code: val,
                                                  }),
                                                )
                                              }
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  <AddInline
                                    placeholder="Kode level (A, Bâ€¦)"
                                    label="Level"
                                    onAdd={(val) =>
                                      handleAsync(() =>
                                        addLevelMut.mutateAsync({
                                          rowId: row.id,
                                          code: val,
                                        }),
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <AddInline
                          placeholder="Kode row (01, 02â€¦)"
                          label="Row"
                          onAdd={(val) =>
                            handleAsync(() =>
                              addRowMut.mutateAsync({
                                rackId: rack.id,
                                code: val,
                              }),
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- HEATMAP TAB ---- */}
        <TabsContent value="heatmap" className="mt-4">
          {racks.filter(r => r.is_active).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada struktur rak aktif.
            </p>
          ) : (
            <div className="space-y-5">
              {/* Global summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-muted/20 p-3 text-center">
                  <p className="text-2xl font-bold">{totalBins}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Total Slot
                  </p>
                </div>
                <div className="rounded-xl border bg-green-50 border-green-200 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {occupiedCount}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">Terisi</p>
                </div>
                <div className="rounded-xl border bg-background p-3 text-center">
                  <p className="text-2xl font-bold">{freeCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Kosong</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-400" />
                  <span>Terisi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-amber-100 border border-amber-400" />
                  <span>Terisi Â· ada PO dipinjam</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-muted/10 border border-border" />
                  <span>Kosong</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-muted/20 border border-dashed opacity-40" />
                  <span>Nonaktif</span>
                </div>
              </div>

              {/* Rack accordion sections */}
              <div className="space-y-3">
                {racks.filter((r) => r.is_active).map((rack) => {
                  const rackRows = rows.filter((r) => r.rack_id === rack.id && r.is_active);
                  const rackActiveBins = bins.filter(
                    (b) =>
                      b.is_active &&
                      rackRows.some((r) =>
                        levels
                          .filter((l) => l.row_id === r.id && l.is_active)
                          .some((l) => l.id === b.level_id),
                      ),
                  );
                  const rackOccupied = rackActiveBins.filter((b) =>
                    occupiedBinIds.has(b.id),
                  ).length;
                  const pct =
                    rackActiveBins.length > 0
                      ? Math.round((rackOccupied / rackActiveBins.length) * 100)
                      : 0;
                  const isExpanded = expandedHeatmapRacks.has(rack.id);

                  const barColor =
                    pct === 0
                      ? "bg-muted/50"
                      : pct < 40
                        ? "bg-green-400"
                        : pct < 75
                          ? "bg-amber-400"
                          : pct < 90
                            ? "bg-orange-500"
                            : "bg-red-500";

                  const pctBadge =
                    pct === 0
                      ? "bg-muted/50 text-muted-foreground"
                      : pct < 40
                        ? "bg-green-100 text-green-700"
                        : pct < 75
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700";

                  return (
                    <div
                      key={rack.id}
                      className="rounded-xl border overflow-hidden"
                    >
                      {/* Rack header */}
                      <button
                        className="w-full px-4 py-3 flex items-center gap-3 bg-primary/5 hover:bg-primary/10 transition-colors text-left cursor-pointer"
                        onClick={() => toggleHeatmapRack(rack.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-bold text-base">
                              {rack.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {rackOccupied}/{rackActiveBins.length}
                            </span>
                            <span
                              className={cn(
                                "text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
                                pctBadge,
                              )}
                            >
                              {pct}% penuh
                            </span>
                          </div>
                          <div className="h-1.5 w-40 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                barColor,
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-background space-y-4">
                          {rackRows.filter((r) => r.is_active).map((row) => {
                            const rowLevels = levels.filter(
                              (l) => l.row_id === row.id && l.is_active
                            );
                            return (
                              <div key={row.id}>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                                  Row {row.code}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {rowLevels.map((lvl) => {
                                    const lvlBins = bins.filter(
                                      (b) => b.level_id === lvl.id
                                    );
                                    return (
                                      <div
                                        key={lvl.id}
                                        className="bg-muted/20 rounded-lg px-2.5 py-2 border"
                                      >
                                        <p className="text-[9px] font-mono font-semibold text-muted-foreground/70 uppercase mb-1.5 tracking-wider">
                                          Lvl {lvl.code}
                                        </p>
                                        <div className="flex gap-0.5">
                                          {lvlBins.map((bin) => {
                                            const isOccupied =
                                              occupiedBinIds.has(bin.id);
                                            const box = isOccupied
                                              ? (boxes.find(
                                                (bx) => bx.bin_id === bin.id,
                                              ) ?? null)
                                              : null;
                                            const borrowedCount = box
                                              ? pos.filter(
                                                (p) =>
                                                  p.box_id === box.id &&
                                                  p.borrow_status ===
                                                  "BORROWED",
                                              ).length
                                              : 0;
                                            return (
                                              <BinCell
                                                key={bin.id}
                                                bin={bin}
                                                isOccupied={isOccupied}
                                                borrowedCount={borrowedCount}
                                                box={box}
                                              />
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


