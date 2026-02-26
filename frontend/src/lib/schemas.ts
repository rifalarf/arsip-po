// ==========================================
// Arsip PO — Zod Validation Schemas
// ==========================================

import { z } from "zod";

const currentYear = new Date().getFullYear();

// ---- Buat Arsip (Create Box) ----
export const createBoxEntrySchema = z.object({
  tahun: z
    .number({ error: "Tahun harus berupa angka" })
    .int("Tahun harus bilangan bulat")
    .min(2000, "Tahun minimal 2000")
    .max(currentYear + 1, `Tahun maksimal ${currentYear + 1}`),
  no_po: z.string().trim().min(1, "NO. PO wajib diisi"),
});

export const createBoxSchema = z.object({
  entries: z
    .array(createBoxEntrySchema)
    .min(1, "Minimal 1 NO. PO harus diisi")
    .refine(
      (entries) => {
        const noPOs = entries.map((e) => e.no_po);
        return new Set(noPOs).size === noPOs.length;
      },
      { message: "Ada NO. PO yang duplikat dalam input" },
    ),
  ownerId: z.string().optional(),
});

export type CreateBoxInput = z.infer<typeof createBoxSchema>;

// ---- Borrow PO ----
export const borrowPOSchema = z.object({
  selectedPOIds: z.array(z.string()).min(1, "Pilih minimal 1 PO"),
  borrowerName: z.string().trim().min(1, "Nama peminjam wajib diisi"),
  borrowNotes: z.string().optional(),
});

export type BorrowPOInput = z.infer<typeof borrowPOSchema>;

// ---- Assign Box to Bin ----
export const assignBoxSchema = z.object({
  binId: z.string().min(1, "Pilih bin terlebih dahulu"),
});

export type AssignBoxInput = z.infer<typeof assignBoxSchema>;

// ---- Relocate Box ----
export const relocateBoxSchema = z.object({
  binId: z.string().min(1, "Pilih bin tujuan terlebih dahulu"),
  notes: z.string().optional(),
});

export type RelocateBoxInput = z.infer<typeof relocateBoxSchema>;

// ---- Move PO to another Box ----
export const movePOSchema = z.object({
  targetBoxId: z.string().min(1, "Pilih box tujuan terlebih dahulu"),
  reason: z.string().optional(),
});

export type MovePOInput = z.infer<typeof movePOSchema>;

// ---- Add Rack/Row/Level/Bin (inline forms) ----
export const addInlineSchema = z.object({
  code: z.string().trim().min(1, "Kode tidak boleh kosong"),
});

export type AddInlineInput = z.infer<typeof addInlineSchema>;
