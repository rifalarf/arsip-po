import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queries";
import {
  apiCreateBox,
  apiAssignBoxToBin,
  apiRelocateBox,
  apiMovePOToBox,
  apiBorrowPO,
  apiReturnPO,
  apiEditPO,
  apiDeletePO,
  apiAddRack, apiAddRackBatch,
  apiAddRow,
  apiAddLevel,
  apiAddBin,
  apiDeleteRack,
  apiDeleteRow,
  apiDeleteLevel,
  apiDeleteBin,
  apiUploadPOFile,
  apiDeletePOFile,
  apiDeleteBox,
} from "@/lib/api";

// ---- Box mutations ----

export function useCreateBox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      entries: { tahun: number; no_po: string }[];
      user: { id: string; name: string };
    }) => apiCreateBox(vars.entries, vars.user),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.boxes });
      qc.invalidateQueries({ queryKey: queryKeys.pos });
    },
  });
}

export function useAssignBoxToBin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { boxId: string; binId: string; userName: string }) =>
      apiAssignBoxToBin(vars.boxId, vars.binId, vars.userName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.boxes });
      qc.invalidateQueries({ queryKey: queryKeys.boxLocationHistory });
    },
  });
}

export function useRelocateBox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      boxId: string;
      newBinId: string;
      notes: string;
      userName: string;
    }) => apiRelocateBox(vars.boxId, vars.newBinId, vars.notes, vars.userName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.boxes });
      qc.invalidateQueries({ queryKey: queryKeys.boxLocationHistory });
    },
  });
}

export function useMovePOToBox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      poId: string;
      targetBoxId: string;
      reason: string;
      userName: string;
    }) =>
      apiMovePOToBox(vars.poId, vars.targetBoxId, vars.reason, vars.userName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pos });
      qc.invalidateQueries({ queryKey: queryKeys.poTransferHistory });
    },
  });
}

export function useEditPO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      poId: string;
      fields: {
        no_po: string;
        tahun: number;
        nama_barang: string;
        dok_date: string;
        buyer_name: string;
        keterangan: string;
        borrow_status: string;
        no_gungyu: string;
      };
    }) => apiEditPO(vars.poId, vars.fields),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pos });
      qc.invalidateQueries({ queryKey: queryKeys.boxes });
    },
  });
}

export function useDeletePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poId: string }) => apiDeletePO(vars.poId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pos });
      qc.invalidateQueries({ queryKey: queryKeys.borrowLogs });
      qc.invalidateQueries({ queryKey: queryKeys.poTransferHistory });
    },
  });
}

// ---- Borrow mutations ----

export function useBorrowPO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      poId: string;
      borrowerName: string;
      department: string;
      notes: string;
    }) =>
      apiBorrowPO(vars.poId, vars.borrowerName, vars.department, vars.notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pos });
      qc.invalidateQueries({ queryKey: queryKeys.borrowLogs });
    },
  });
}

export function useReturnPO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poId: string }) => apiReturnPO(vars.poId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pos });
      qc.invalidateQueries({ queryKey: queryKeys.borrowLogs });
    },
  });
}

export function useDeleteBox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { boxId: string }) => apiDeleteBox(vars.boxId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.boxes });
      qc.invalidateQueries({ queryKey: queryKeys.pos });
      qc.invalidateQueries({ queryKey: queryKeys.borrowLogs });
    },
  });
}

// ---- Rack CRUD mutations ----

export function useAddRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { code: string; name: string }) =>
      apiAddRack(vars.code, vars.name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.racks });
    },
  });
}

export function useAddRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { rackId: string; code: string }) =>
      apiAddRow(vars.rackId, vars.code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rows });
    },
  });
}

export function useAddLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { rowId: string; code: string }) =>
      apiAddLevel(vars.rowId, vars.code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.levels });
    },
  });
}

export function useAddBin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { levelId: string; code: string }) =>
      apiAddBin(vars.levelId, vars.code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bins });
    },
  });
}

export function useDeleteRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { rackId: string }) => apiDeleteRack(vars.rackId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.racks });
      qc.invalidateQueries({ queryKey: queryKeys.rows });
      qc.invalidateQueries({ queryKey: queryKeys.levels });
      qc.invalidateQueries({ queryKey: queryKeys.bins });
    },
  });
}

export function useDeleteRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { rowId: string }) => apiDeleteRow(vars.rowId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rows });
      qc.invalidateQueries({ queryKey: queryKeys.levels });
      qc.invalidateQueries({ queryKey: queryKeys.bins });
    },
  });
}

export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { levelId: string }) => apiDeleteLevel(vars.levelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.levels });
      qc.invalidateQueries({ queryKey: queryKeys.bins });
    },
  });
}

export function useDeleteBin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { binId: string }) => apiDeleteBin(vars.binId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bins });
    },
  });
}

// ---- File Upload mutations ----

export function useUploadPOFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poId: string; file: File; onProgress?: (progress: number) => void }) =>
      apiUploadPOFile(vars.poId, vars.file, vars.onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pos });
    },
  });
}

export function useDeletePOFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poId: string; fileUrl: string }) =>
      apiDeletePOFile(vars.poId, vars.fileUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pos });
    },
  });
}


export function useAddRackBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      rackCode: string;
      rowCount: number;
      levelCount: number;
      binCount: number;
    }) =>
      apiAddRackBatch(
        vars.rackCode,
        vars.rowCount,
        vars.levelCount,
        vars.binCount
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.racks });
      qc.invalidateQueries({ queryKey: queryKeys.rows });
      qc.invalidateQueries({ queryKey: queryKeys.levels });
      qc.invalidateQueries({ queryKey: queryKeys.bins });
    },
  });
}

