"use client";

import { useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type FilterFn,
  type ColumnFiltersState,
  type Column,
} from "@tanstack/react-table";
import { usePOs, useBoxes, useUsers } from "@/hooks/queries";
import { useMovePOToBox, useEditPO, useDeletePO, useUploadPOFile, useDeletePOFile } from "@/hooks/mutations";
import { useApp } from "@/lib/context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpAZ,
  ArrowDownAZ,
  Check,
  X,
  ArrowRightLeft,
  Pencil,
  Trash2,
  Eye,
  FileUp,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Flat row type joining PO + Box-derived fields
type PORow = {
  id: string;
  box_id: string;
  no_po: string;
  tahun: number;
  no_gungyu: string;
  lokasi: string;
  nama_barang: string;
  dok_date: string;
  pic: string;
  keterangan: string;
  status: string;
  file_url: string | null;
};

const columnHelper = createColumnHelper<PORow>();

// ----- Filter functions -----

// Global search: case-insensitive substring across any column
const includesFilter: FilterFn<PORow> = (
  row,
  columnId,
  filterValue: string,
) => {
  const val = row.getValue<string | number | null>(columnId);
  if (val == null || val === "") return filterValue === "";
  return String(val).toLowerCase().includes(filterValue.toLowerCase());
};

// Per-column multi-select filter: filterValue is string[]
const multiSelectFilter: FilterFn<PORow> = (
  row,
  columnId,
  filterValue: string[],
) => {
  if (filterValue === undefined || filterValue === null) return true;
  if (filterValue.length === 0) return false;
  const val = String(row.getValue<string | number>(columnId) ?? "");
  return filterValue.includes(val);
};
multiSelectFilter.autoRemove = (val: string[] | undefined) =>
  val === undefined || val === null;

// Columns with Excel-style AutoFilter dropdown
const FILTERABLE_COLS = new Set([
  "tahun",
  "no_gungyu",
  "lokasi",
  "dok_date",
  "pic",
  "status",
]);

// ----- AutoFilter Popup Component -----
function ColumnFilterPopup({
  column,
  allData,
}: {
  column: Column<PORow, unknown>;
  allData: PORow[];
}) {
  const [search, setSearch] = useState("");
  const checkAllRef = useRef<HTMLInputElement>(null);

  // All unique values for this column (from full dataset, sorted)
  const allValues = useMemo(() => {
    const vals = new Set(
      allData.map((row) => String(row[column.id as keyof PORow] ?? "")),
    );
    return [...vals]
      .filter(Boolean)
      .sort((a, b) =>
        isNaN(Number(a)) || isNaN(Number(b))
          ? a.localeCompare(b)
          : Number(a) - Number(b),
      );
  }, [allData, column.id]);

  // Values visible in the picklist (after search)
  const visibleValues = search
    ? allValues.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    : allValues;

  const filterValue = column.getFilterValue() as string[] | undefined;
  const isFiltered = filterValue !== undefined;
  const selected: string[] = filterValue ?? [];
  const currentSort = column.getIsSorted();

  // Derive checkbox states for "Pilih Semua"
  const allVisibleChecked =
    !isFiltered ||
    (visibleValues.length > 0 &&
      visibleValues.every((v) => selected.includes(v)));
  const someVisibleChecked =
    isFiltered &&
    !allVisibleChecked &&
    visibleValues.some((v) => selected.includes(v));

  // Sync indeterminate state
  if (checkAllRef.current) {
    checkAllRef.current.indeterminate = someVisibleChecked;
  }

  const toggle = (val: string) => {
    if (!isFiltered) {
      // Currently showing all → uncheck one = all EXCEPT this
      const next = allValues.filter((v) => v !== val);
      column.setFilterValue(next);
    } else {
      const next = selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val];
      // If result includes everything, clear filter entirely
      column.setFilterValue(next.length >= allValues.length ? undefined : next);
    }
  };

  const toggleAll = () => {
    if (allVisibleChecked) {
      if (!isFiltered) {
        // No filter active, uncheck all → set empty (hide all)
        column.setFilterValue([]);
      } else {
        // Remove visible values from selected
        const next = selected.filter((s) => !visibleValues.includes(s));
        column.setFilterValue(next);
      }
    } else {
      // Select all visible
      const next = [...new Set([...selected, ...visibleValues])];
      column.setFilterValue(next.length >= allValues.length ? undefined : next);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors",
            isFiltered
              ? "bg-primary/15 text-primary hover:bg-primary/25"
              : "text-muted-foreground/50 hover:bg-muted hover:text-foreground",
          )}
          onClick={(e) => e.stopPropagation()}
          title={
            isFiltered ? `${selected.length} nilai dipilih` : "Filter kolom"
          }
        >
          <Filter className={cn("h-3 w-3", isFiltered && "fill-primary")} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-0 shadow-lg"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sort section */}
        <div className="p-2 space-y-0.5">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Urutkan
          </p>
          <button
            onClick={() => column.toggleSorting(false)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors",
              currentSort === "asc"
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted",
            )}
          >
            <ArrowUpAZ className="h-4 w-4 shrink-0" />A → Z
            {currentSort === "asc" && <Check className="ml-auto h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => column.toggleSorting(true)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors",
              currentSort === "desc"
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted",
            )}
          >
            <ArrowDownAZ className="h-4 w-4 shrink-0" />Z → A
            {currentSort === "desc" && (
              <Check className="ml-auto h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <Separator />

        {/* Filter section */}
        <div className="p-2 space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Filter Nilai
            </p>
            {isFiltered && (
              <button
                onClick={() => column.setFilterValue(undefined)}
                className="flex items-center gap-0.5 text-xs text-primary hover:underline"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          {/* Picklist search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Cari nilai..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-6 text-xs"
            />
          </div>

          {/* Pilih Semua */}
          <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted">
            <input
              ref={checkAllRef}
              type="checkbox"
              checked={allVisibleChecked}
              onChange={toggleAll}
              className="h-3.5 w-3.5 accent-primary"
            />
            <span className="text-xs font-medium">Pilih Semua</span>
          </label>

          <Separator />

          {/* Scrollable picklist */}
          <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
            {visibleValues.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                Tidak ditemukan
              </p>
            ) : (
              visibleValues.map((val) => (
                <label
                  key={val}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={!isFiltered || selected.includes(val)}
                    onChange={() => toggle(val)}
                    className="h-3.5 w-3.5 shrink-0 accent-primary"
                  />
                  <span className="truncate text-xs">{val || "—"}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const COLUMNS = [
  columnHelper.accessor("no_po", {
    header: "No PO",
    enableColumnFilter: false,
    cell: (info) => (
      <span className="font-mono font-medium text-primary">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("tahun", {
    header: "Tahun",
    filterFn: multiSelectFilter,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("no_gungyu", {
    header: "No Gungyu",
    filterFn: multiSelectFilter,
    cell: (info) =>
      info.getValue() ? (
        <span className="font-mono text-xs">{info.getValue()}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  }),
  columnHelper.accessor("lokasi", {
    header: "Lokasi",
    filterFn: multiSelectFilter,
    cell: (info) =>
      info.getValue() ? (
        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
          {info.getValue()}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  }),
  columnHelper.accessor("nama_barang", {
    header: "Nama Barang",
    enableColumnFilter: false,
    cell: (info) =>
      info.getValue() || <span className="text-muted-foreground">—</span>,
  }),
  columnHelper.accessor("dok_date", {
    header: "Dok Date",
    filterFn: multiSelectFilter,
    cell: (info) =>
      info.getValue() || <span className="text-muted-foreground">—</span>,
  }),
  columnHelper.accessor("pic", {
    header: "PIC",
    filterFn: multiSelectFilter,
    cell: (info) =>
      info.getValue() || <span className="text-muted-foreground">—</span>,
  }),
  columnHelper.accessor("keterangan", {
    header: "Keterangan",
    enableColumnFilter: false,
    size: 200,
    cell: (info) =>
      info.getValue() ? (
        <span className="italic text-muted-foreground text-xs whitespace-normal break-words line-clamp-3">
          {info.getValue()}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    filterFn: multiSelectFilter,
    cell: (info) => {
      const val = info.getValue();
      return val === "Dipinjam" ? (
        <Badge variant="destructive" className="text-xs">
          Dipinjam
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-xs">
          Tersedia
        </Badge>
      );
    },
  }),
];

export default function POListPage() {
  const { user } = useApp();
  const { data: pos = [] } = usePOs();
  const { data: boxes = [] } = useBoxes();
  const { data: users = [] } = useUsers();
  const buyers = users.filter((u) => u.role === "buyer");

  const movePOToBox = useMovePOToBox();
  const editPO = useEditPO();
  const deletePO = useDeletePO();
  const uploadPOFile = useUploadPOFile();
  const deletePOFile = useDeletePOFile();

  // Move PO dialog state
  const [movePOOpen, setMovePOOpen] = useState(false);
  const [movePOId, setMovePOId] = useState<string>("");
  const [moveTargetBoxId, setMoveTargetBoxId] = useState<string>("");
  const [moveReason, setMoveReason] = useState("");

  // Edit PO dialog state
  const [editPOOpen, setEditPOOpen] = useState(false);
  const [editPOData, setEditPOData] = useState<{
    id: string;
    no_po: string;
    tahun: number;
    no_gungyu: string;
    nama_barang: string;
    dok_date: string;
    pic: string;
    keterangan: string;
    status: string;
    file_url: string | null;
  } | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Delete PO dialog state
  const [deletePOOpen, setDeletePOOpen] = useState(false);
  const [deletePOData, setDeletePOData] = useState<{
    id: string;
    no_po: string;
  } | null>(null);

  // View document dialog state
  const [viewDocOpen, setViewDocOpen] = useState(false);
  const [viewDocData, setViewDocData] = useState<{
    id: string;
    no_po: string;
    file_url: string;
  } | null>(null);

  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Flatten PO + matching Box into one flat row
  const data = useMemo<PORow[]>(() => {
    return pos.map((po) => {
      const box = boxes.find((b) => b.id === po.box_id);
      return {
        id: po.id,
        box_id: po.box_id,
        no_po: po.no_po,
        tahun: po.tahun,
        no_gungyu: box?.no_gungyu ?? "",
        lokasi: box?.location_code ?? "",
        nama_barang: po.nama_barang,
        dok_date: po.dok_date,
        pic: po.buyer_name,
        keterangan: po.keterangan,
        status: po.borrow_status === "BORROWED" ? "Dipinjam" : "Tersedia",
        file_url: po.file_url ?? null,
      };
    });
  }, [pos, boxes]);

  // Action columns (defined inside component for access to state setters)
  const actionColumn = useMemo(
    () =>
      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              title={row.original.file_url ? "Lihat Dokumen" : "Belum ada dokumen"}
              aria-label="Lihat Dokumen"
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                row.original.file_url
                  ? "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  : "text-muted-foreground/40 cursor-default",
              )}
              onClick={() => {
                if (row.original.file_url) {
                  setViewDocData({
                    id: row.original.id,
                    no_po: row.original.no_po,
                    file_url: row.original.file_url,
                  });
                  setViewDocOpen(true);
                }
              }}
              disabled={!row.original.file_url}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              title="Pindah PO"
              aria-label="Pindah PO"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
              onClick={() => {
                setMovePOId(row.original.id);
                setMoveTargetBoxId("");
                setMoveReason("");
                setMovePOOpen(true);
              }}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              title="Edit PO"
              aria-label="Edit PO"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-amber-600 transition-colors"
              onClick={() => {
                setEditPOData({
                  id: row.original.id,
                  no_po: row.original.no_po,
                  tahun: row.original.tahun,
                  no_gungyu: row.original.no_gungyu,
                  nama_barang: row.original.nama_barang,
                  dok_date: row.original.dok_date,
                  pic: row.original.pic,
                  keterangan: row.original.keterangan,
                  status: row.original.status,
                  file_url: row.original.file_url,
                });
                setEditFile(null);
                setEditPOOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              title="Hapus PO"
              aria-label="Hapus PO"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => {
                setDeletePOData({
                  id: row.original.id,
                  no_po: row.original.no_po,
                });
                setDeletePOOpen(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ),
      }),
    [],
  );

  const allColumns = useMemo(() => [...COLUMNS, actionColumn], [actionColumn]);

  // Move PO handler
  const handleMovePO = async () => {
    if (!user || !movePOId || !moveTargetBoxId) return;
    const result = await movePOToBox.mutateAsync({
      poId: movePOId,
      targetBoxId: moveTargetBoxId,
      reason: moveReason,
      userName: user.name,
    });
    if (result.success) {
      toast.success("Berhasil", { description: result.message });
      setMovePOOpen(false);
    } else {
      toast.error("Gagal", { description: result.message });
    }
  };

  // Edit PO handler
  const handleEditPO = async () => {
    if (!editPOData) return;
    try {
      const result = await editPO.mutateAsync({
        poId: editPOData.id,
        fields: {
          no_po: editPOData.no_po,
          tahun: editPOData.tahun,
          nama_barang: editPOData.nama_barang,
          dok_date: editPOData.dok_date,
          buyer_name: editPOData.pic,
          keterangan: editPOData.keterangan,
          borrow_status:
            editPOData.status === "Dipinjam" ? "BORROWED" : "AVAILABLE",
          no_gungyu: editPOData.no_gungyu,
        },
      });
      if (result.success) {
        // Upload file if selected
        if (editFile) {
          try {
            setUploadProgress(0);
            const uploadResult = await uploadPOFile.mutateAsync({
              poId: editPOData.id,
              file: editFile,
              onProgress: (progress) => {
                setUploadProgress(progress);
              },
            });
            if (uploadResult.success) {
              toast.success("Berhasil", { description: "PO dan file berhasil diupdate." });
            } else {
              toast.success("PO diupdate", { description: result.message });
              toast.error("Upload gagal", { description: uploadResult.message });
            }
          } catch (err) {
            toast.error("Upload gagal", {
              description: err instanceof Error ? err.message : "Terjadi kesalahan server saat upload."
            });
          } finally {
            setUploadProgress(0);
          }
        } else {
          toast.success("Berhasil", { description: result.message });
        }
        setEditFile(null);
        setEditPOOpen(false);
      } else {
        toast.error("Gagal", { description: result.message });
      }
    } catch (err) {
      toast.error("Gagal", { description: "Terjadi kesalahan server." });
    }
  };

  // Delete file handler
  const handleDeleteFile = async () => {
    if (!viewDocData) return;
    const result = await deletePOFile.mutateAsync({
      poId: viewDocData.id,
      fileUrl: viewDocData.file_url,
    });
    if (result.success) {
      toast.success("Berhasil", { description: "File berhasil dihapus." });
      setViewDocOpen(false);
      setViewDocData(null);
    } else {
      toast.error("Gagal", { description: result.message });
    }
  };

  // Delete PO handler
  const handleDeletePO = async () => {
    if (!deletePOData) return;
    const result = await deletePO.mutateAsync({ poId: deletePOData.id });
    if (result.success) {
      toast.success("Berhasil", { description: result.message });
      setDeletePOOpen(false);
    } else {
      toast.error("Gagal", { description: result.message });
    }
  };

  // Available boxes for move target (exclude current box of selected PO)
  const moveTargetBoxes = useMemo(() => {
    if (!movePOId) return boxes.filter((b) => b.status !== "CANCELLED");
    const currentPO = data.find((r) => r.id === movePOId);
    return boxes.filter(
      (b) => b.status !== "CANCELLED" && b.id !== currentPO?.box_id,
    );
  }, [boxes, movePOId, data]);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: includesFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const hasActiveFilters = columnFilters.length > 0 || globalFilter.length > 0;

  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Arsip PO</h1>
        <p className="text-muted-foreground">
          {filteredCount === data.length
            ? `${data.length} PO tercatat`
            : `${filteredCount} dari ${data.length} PO ditampilkan`}
        </p>
      </div>

      {/* Global search + reset */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari semua kolom..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGlobalFilter("");
              setColumnFilters([]);
            }}
            className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Reset Semua Filter
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-muted/50">
                    {headerGroup.headers.map((header) => {
                      const isFilterable = FILTERABLE_COLS.has(
                        header.column.id,
                      );
                      const isColFiltered =
                        isFilterable &&
                        (header.column.getFilterValue() as string[] | undefined)
                          ?.length;
                      const activeSelected =
                        (header.column.getFilterValue() as
                          | string[]
                          | undefined) ?? [];

                      return (
                        <th
                          key={header.id}
                          className={cn(
                            "px-3 py-2 text-center font-semibold text-foreground whitespace-nowrap transition-colors",
                            isColFiltered && "bg-primary/5",
                          )}
                        >
                          {header.column.id === "actions" ? (
                            <div className="flex justify-center select-none text-xs">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </div>
                          ) : isFilterable ? (
                            // Filterable column: label left, filter icon right -> centered
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-center gap-2">
                                <span className="select-none">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                </span>
                                <ColumnFilterPopup
                                  column={header.column}
                                  allData={data}
                                />
                              </div>
                              {/* Active filter chips */}
                              {activeSelected.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {activeSelected.slice(0, 2).map((v) => (
                                    <span
                                      key={v}
                                      className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                                    >
                                      {v}
                                      <button
                                        onClick={() => {
                                          const next = activeSelected.filter(
                                            (s) => s !== v,
                                          );
                                          header.column.setFilterValue(
                                            next.length ? next : undefined,
                                          );
                                        }}
                                        className="ml-0.5 hover:text-destructive"
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                    </span>
                                  ))}
                                  {activeSelected.length > 2 && (
                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                      +{activeSelected.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            // Non-filterable column: click to sort
                            <div
                              className="flex cursor-pointer select-none items-center justify-center gap-1 hover:text-primary transition-colors"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              <span className="shrink-0 text-muted-foreground">
                                {header.column.getIsSorted() === "asc" ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                                )}
                              </span>
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={allColumns.length}
                      className="py-16 text-center text-muted-foreground"
                    >
                      Tidak ada data yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-2.5 align-middle overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
            <span>
              Halaman{" "}
              <span className="font-medium text-foreground">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              dari{" "}
              <span className="font-medium text-foreground">
                {table.getPageCount()}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Berikutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Move PO Dialog */}
      <Dialog open={movePOOpen} onOpenChange={setMovePOOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pindahkan PO ke Box Lain</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Box Tujuan</Label>
              <Select
                value={moveTargetBoxId}
                onValueChange={setMoveTargetBoxId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih box tujuan…" />
                </SelectTrigger>
                <SelectContent>
                  {moveTargetBoxes.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.no_gungyu || "Draft"} {" "}
                      {b.location_code ? `(${b.location_code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Alasan (opsional)</Label>
              <Input
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                placeholder="Alasan pemindahan…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovePOOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleMovePO}
              disabled={!moveTargetBoxId || movePOToBox.isPending}
            >
              {movePOToBox.isPending ? "Memindahkan..." : "Pindahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PO Dialog */}
      <Dialog open={editPOOpen} onOpenChange={setEditPOOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit PO</DialogTitle>
          </DialogHeader>
          {editPOData && (
            <div className="grid grid-cols-2 gap-4 py-2">
              {/* No PO */}
              <div className="space-y-1.5">
                <Label>No PO</Label>
                <Input
                  value={editPOData.no_po}
                  onChange={(e) =>
                    setEditPOData({ ...editPOData, no_po: e.target.value })
                  }
                  placeholder="No PO…"
                />
              </div>
              {/* Tahun */}
              <div className="space-y-1.5">
                <Label>Tahun</Label>
                <Input
                  type="number"
                  value={editPOData.tahun}
                  onChange={(e) =>
                    setEditPOData({
                      ...editPOData,
                      tahun: Number(e.target.value),
                    })
                  }
                  placeholder="Tahun…"
                />
              </div>
              {/* No Gungyu */}
              <div className="space-y-1.5">
                <Label>No Gungyu</Label>
                <Input
                  value={editPOData.no_gungyu}
                  onChange={(e) =>
                    setEditPOData({ ...editPOData, no_gungyu: e.target.value })
                  }
                  placeholder="No gungyu…"
                />
              </div>
              {/* Nama Barang */}
              <div className="space-y-1.5">
                <Label>Nama Barang</Label>
                <Input
                  value={editPOData.nama_barang}
                  onChange={(e) =>
                    setEditPOData({
                      ...editPOData,
                      nama_barang: e.target.value,
                    })
                  }
                  placeholder="Nama barang…"
                />
              </div>
              {/* Dok Date */}
              <div className="space-y-1.5">
                <Label>Dok Date</Label>
                <Input
                  type="date"
                  value={editPOData.dok_date}
                  onChange={(e) =>
                    setEditPOData({ ...editPOData, dok_date: e.target.value })
                  }
                />
              </div>
              {/* PIC */}
              <div className="space-y-1.5">
                <Label>PIC</Label>
                <Select
                  value={editPOData.pic}
                  onValueChange={(v) =>
                    setEditPOData({ ...editPOData, pic: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih PIC…" />
                  </SelectTrigger>
                  <SelectContent>
                    {buyers.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Keterangan - full width */}
              <div className="col-span-2 space-y-1.5">
                <Label>Keterangan</Label>
                <Input
                  value={editPOData.keterangan}
                  onChange={(e) =>
                    setEditPOData({ ...editPOData, keterangan: e.target.value })
                  }
                  placeholder="Keterangan…"
                />
              </div>
              {/* Status - full width */}
              <div className="col-span-2 space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editPOData.status}
                  onValueChange={(v) =>
                    setEditPOData({ ...editPOData, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tersedia">Tersedia</SelectItem>
                    <SelectItem value="Dipinjam">Dipinjam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* File Upload - full width */}
              <div className="col-span-2 space-y-1.5">
                <Label>Dokumen Scan (opsional)</Label>
                {editPOData.file_url && !editFile ? (
                  <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                    <Eye className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="text-xs text-blue-700 truncate flex-1">
                      File tersedia
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(editPOData.file_url!, "_blank")}
                    >
                      Lihat
                    </Button>
                    <label className="cursor-pointer text-xs text-amber-600 hover:text-amber-800 font-medium">
                      Ganti
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setEditFile(file);
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <label className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border border-dashed px-3 py-3 transition-colors",
                      uploadPOFile.isPending
                        ? "border-primary/50 bg-blue-50/50 pointer-events-none"
                        : "border-muted-foreground/30 hover:border-primary hover:bg-muted/30"
                    )}>
                      <FileUp className={cn(
                        "h-5 w-5",
                        uploadPOFile.isPending ? "text-primary animate-pulse" : "text-muted-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {editFile ? editFile.name : "Pilih file untuk diupload"}
                        </p>
                        {uploadPOFile.isPending ? (
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-primary w-8 text-right">
                              {uploadProgress}%
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {editFile
                              ? `${(editFile.size / 1024 / 1024).toFixed(2)} MB`
                              : "PDF atau DOCX — max 10MB"}
                          </p>
                        )}
                      </div>
                      {editFile && !uploadPOFile.isPending && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditFile(null);
                          }}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setEditFile(file);
                        }}
                        disabled={uploadPOFile.isPending}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPOOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditPO} disabled={editPO.isPending || uploadPOFile.isPending}>
              {editPO.isPending || uploadPOFile.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete PO Dialog */}
      <Dialog open={deletePOOpen} onOpenChange={setDeletePOOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus PO</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin menghapus PO{" "}
              <span className="font-mono font-semibold text-foreground">
                {deletePOData?.no_po}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePOOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePO}
              disabled={deletePO.isPending}
            >
              {deletePO.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={viewDocOpen} onOpenChange={setViewDocOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Dokumen PO {viewDocData?.no_po}
            </DialogTitle>
            <DialogDescription>
              Preview dokumen scan yang telah diupload.
            </DialogDescription>
          </DialogHeader>
          {viewDocData && (
            <div className="space-y-3">
              {/* Preview area */}
              <div className="rounded-lg border bg-muted/20 overflow-hidden">
                {viewDocData.file_url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <img
                    src={viewDocData.file_url}
                    alt={`Dokumen PO ${viewDocData.no_po}`}
                    className="w-full max-h-[60vh] object-contain"
                  />
                ) : (
                  <iframe
                    src={viewDocData.file_url}
                    title={`Dokumen PO ${viewDocData.no_po}`}
                    className="w-full h-[60vh]"
                  />
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewDocData && window.open(viewDocData.file_url, "_blank")}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteFile}
              disabled={deletePOFile.isPending}
            >
              {deletePOFile.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghapus...</>
              ) : (
                <><Trash2 className="mr-2 h-4 w-4" />Hapus File</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
