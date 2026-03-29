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
  apiAddRack,
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      entries: { tahun: number; no_po: string }[];
      user: { id: string; name: string };
    }) => apiCreateBox(vars.entries, vars.user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boxes });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos });
    },
  });
}

export function useAssignBoxToBin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { boxId: string; binId: string; userName: string }) =>
      apiAssignBoxToBin(vars.boxId, vars.binId, vars.userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boxes });
      queryClient.invalidateQueries({ queryKey: queryKeys.boxLocationHistory });
    },
  });
}

export function useRelocateBox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      boxId: string;
      newBinId: string;
      notes: string;
      userName: string;
    }) => apiRelocateBox(vars.boxId, vars.newBinId, vars.notes, vars.userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boxes });
      queryClient.invalidateQueries({ queryKey: queryKeys.boxLocationHistory });
    },
  });
}

export function useMovePOToBox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      poId: string;
      targetBoxId: string;
      reason: string;
      userName: string;
    }) =>
      apiMovePOToBox(vars.poId, vars.targetBoxId, vars.reason, vars.userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos });
      queryClient.invalidateQueries({ queryKey: queryKeys.poTransferHistory });
    },
  });
}

export function useEditPO() {
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: queryKeys.pos });
      queryClient.invalidateQueries({ queryKey: queryKeys.boxes });
    },
  });
}

export function useDeletePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poId: string }) => apiDeletePO(vars.poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos });
      queryClient.invalidateQueries({ queryKey: queryKeys.borrowLogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.poTransferHistory });
    },
  });
}

// ---- Borrow mutations ----

export function useBorrowPO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      poId: string;
      borrowerName: string;
      department: string;
      notes: string;
    }) =>
      apiBorrowPO(vars.poId, vars.borrowerName, vars.department, vars.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos });
      queryClient.invalidateQueries({ queryKey: queryKeys.borrowLogs });
    },
  });
}

export function useReturnPO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poId: string }) => apiReturnPO(vars.poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos });
      queryClient.invalidateQueries({ queryKey: queryKeys.borrowLogs });
    },
  });
}

export function useDeleteBox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { boxId: string }) => apiDeleteBox(vars.boxId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boxes });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos });
      queryClient.invalidateQueries({ queryKey: queryKeys.borrowLogs });
    },
  });
}

// ---- Rack CRUD mutations ----

export function useAddRack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { code: string; name: string }) =>
      apiAddRack(vars.code, vars.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.racks });
    },
  });
}

export function useAddRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { rackId: string; code: string }) =>
      apiAddRow(vars.rackId, vars.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rows });
    },
  });
}

export function useAddLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { rowId: string; code: string }) =>
      apiAddLevel(vars.rowId, vars.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.levels });
    },
  });
}

export function useAddBin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { levelId: string; code: string }) =>
      apiAddBin(vars.levelId, vars.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bins });
    },
  });
}

export function useDeleteRack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { rackId: string }) => apiDeleteRack(vars.rackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.racks });
    },
  });
}

export function useDeleteRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { rowId: string }) => apiDeleteRow(vars.rowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rows });
    },
  });
}

export function useDeleteLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { levelId: string }) => apiDeleteLevel(vars.levelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.levels });
    },
  });
}

export function useDeleteBin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { binId: string }) => apiDeleteBin(vars.binId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bins });
    },
  });
}

// ---- File Upload mutations ----

export function useUploadPOFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poId: string; file: File; onProgress?: (progress: number) => void }) =>
      apiUploadPOFile(vars.poId, vars.file, vars.onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos });
    },
  });
}

export function useDeletePOFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poId: string; fileUrl: string }) =>
      apiDeletePOFile(vars.poId, vars.fileUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos });
    },
  });
}

