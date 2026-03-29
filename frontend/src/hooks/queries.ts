import { useQuery } from "@tanstack/react-query";
import {
  fetchUsers,
  fetchBoxes,
  fetchPOs,
  fetchBorrowLogs,
  fetchRacks,
  fetchRows,
  fetchLevels,
  fetchBins,
  fetchPOTransferHistory,
  fetchBoxLocationHistory,
  fetchDashboardMetrics,
} from "@/lib/api";
import type { Box, BoxStatus, PO, Bin } from "@/lib/types";

// ---- Query Keys ----
export const queryKeys = {
  users: ["users"] as const,
  boxes: ["boxes"] as const,
  pos: ["pos"] as const,
  borrowLogs: ["borrowLogs"] as const,
  racks: ["racks"] as const,
  rows: ["rows"] as const,
  levels: ["levels"] as const,
  bins: ["bins"] as const,
  poTransferHistory: ["poTransferHistory"] as const,
  boxLocationHistory: ["boxLocationHistory"] as const,
  dashboardMetrics: ["dashboardMetrics"] as const,
};

// ---- Base Queries ----

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: fetchUsers });
}

export function useBoxes() {
  return useQuery({ queryKey: queryKeys.boxes, queryFn: fetchBoxes });
}

export function usePOs() {
  return useQuery({ queryKey: queryKeys.pos, queryFn: fetchPOs });
}

export function useBorrowLogs() {
  return useQuery({
    queryKey: queryKeys.borrowLogs,
    queryFn: fetchBorrowLogs,
  });
}

export function useRacks() {
  return useQuery({ queryKey: queryKeys.racks, queryFn: fetchRacks });
}

export function useRows() {
  return useQuery({ queryKey: queryKeys.rows, queryFn: fetchRows });
}

export function useLevels() {
  return useQuery({ queryKey: queryKeys.levels, queryFn: fetchLevels });
}

export function useBins() {
  return useQuery({ queryKey: queryKeys.bins, queryFn: fetchBins });
}

export function usePOTransferHistory() {
  return useQuery({
    queryKey: queryKeys.poTransferHistory,
    queryFn: fetchPOTransferHistory,
  });
}

export function useBoxLocationHistory() {
  return useQuery({
    queryKey: queryKeys.boxLocationHistory,
    queryFn: fetchBoxLocationHistory,
  });
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.dashboardMetrics,
    queryFn: fetchDashboardMetrics,
  });
}

// ---- Derived Queries (computed from cached data) ----

export function useBoxById(id: string): Box | undefined {
  const { data: boxes } = useBoxes();
  return boxes?.find((box) => box.id === id);
}

export function usePOsByBoxId(boxId: string): PO[] {
  const { data: pos } = usePOs();
  return pos?.filter((po) => po.box_id === boxId) ?? [];
}

export function useBoxesByStatus(status: BoxStatus): Box[] {
  const { data: boxes } = useBoxes();
  return boxes?.filter((box) => box.status === status) ?? [];
}

export function useBinById(id: string): Bin | undefined {
  const { data: bins } = useBins();
  return bins?.find((bin) => bin.id === id);
}

export function useOccupiedBinIds(): Set<string> {
  const { data: boxes } = useBoxes();
  const ids = new Set<string>();
  boxes?.forEach((box) => {
    if (box.bin_id && box.status === "ARCHIVED") ids.add(box.bin_id);
  });
  return ids;
}

export function useRackLabel(binId: string): string {
  const { data: bins } = useBins();
  const { data: levels } = useLevels();
  const { data: rows } = useRows();
  const { data: racks } = useRacks();

  const bin = bins?.find((bin) => bin.id === binId);
  if (!bin) return "";
  const level = levels?.find((level) => level.id === bin.level_id);
  if (!level) return bin.bin_code;
  const row = rows?.find((row) => row.id === level.row_id);
  if (!row) return bin.bin_code;
  const rack = racks?.find((rack) => rack.id === row.rack_id);
  if (!rack) return bin.bin_code;
  return `${rack.name} / Row ${row.code} / Level ${level.code} / Bin ${bin.code}`;
}

export function useSearchPO(query: string): PO[] {
  const { data: pos } = usePOs();
  if (!query.trim()) return [];
  const lowercaseQuery = query.toLowerCase();
  return (
    pos?.filter(
      (po) =>
        po.no_po.toLowerCase().includes(lowercaseQuery) ||
        po.nama_barang.toLowerCase().includes(lowercaseQuery) ||
        po.buyer_name.toLowerCase().includes(lowercaseQuery) ||
        po.keterangan.toLowerCase().includes(lowercaseQuery),
    ) ?? []
  );
}
