// ==========================================
// Arsip PO â€” Supabase API Layer
// ==========================================

import { supabase } from "./supabase";
import {
  Box,
  PO,
  BorrowLog,
  Rack,
  Row,
  Level,
  Bin,
  POTransferHistory,
  BoxLocationHistory,
  ActionResult,
  User,
  DashboardMetrics,
} from "./types";

// ============================================================
// QUERIES
// ============================================================

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchBoxes(): Promise<Box[]> {
  const { data, error } = await supabase
    .from("boxes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPOs(): Promise<PO[]> {
  const { data, error } = await supabase
    .from("pos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchBorrowLogs(): Promise<BorrowLog[]> {
  const { data, error } = await supabase
    .from("borrow_logs")
    .select("*")
    .order("borrowed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRacks(): Promise<Rack[]> {
  const { data, error } = await supabase
    .from("racks")
    .select("*")
    .order("code");
  if (error) throw error;
  return data ?? [];
}

export async function fetchRows(): Promise<Row[]> {
  const { data, error } = await supabase.from("rows").select("*").order("code");
  if (error) throw error;
  return data ?? [];
}

export async function fetchLevels(): Promise<Level[]> {
  const { data, error } = await supabase
    .from("levels")
    .select("*")
    .order("code");
  if (error) throw error;
  return data ?? [];
}

export async function fetchBins(): Promise<Bin[]> {
  const { data, error } = await supabase.from("bins").select("*").order("code");
  if (error) throw error;
  return data ?? [];
}

export async function fetchPOTransferHistory(): Promise<POTransferHistory[]> {
  const { data, error } = await supabase
    .from("po_transfer_history")
    .select("*")
    .order("moved_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchBoxLocationHistory(): Promise<BoxLocationHistory[]> {
  const { data, error } = await supabase
    .from("box_location_history")
    .select("*")
    .order("moved_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data, error } = await supabase.rpc("get_dashboard_metrics");
  if (error) throw error;
  return data as DashboardMetrics;
}

// ============================================================
// MUTATIONS
// ============================================================

// ---- Create Box (auto-archived with auto no_gungyu) ----
export async function apiCreateBox(
  entries: { tahun: number; no_po: string }[],
  user: { id: string; name: string },
): Promise<ActionResult> {
  if (entries.length === 0) {
    return { success: false, message: "Minimal 1 NO. PO harus diisi." };
  }

  const currentYear = new Date().getFullYear();
  const invalidTahun = entries.find(
    (e) => isNaN(e.tahun) || e.tahun < 2000 || e.tahun > currentYear + 1,
  );
  if (invalidTahun) {
    return {
      success: false,
      message: `Tahun tidak valid: ${invalidTahun.tahun}`,
    };
  }

  const noPOs = entries.map((e) => e.no_po);
  const uniqueInBatch = new Set(noPOs);
  if (uniqueInBatch.size !== noPOs.length) {
    return { success: false, message: "Ada NO. PO yang duplikat dalam input." };
  }

  // Check existing POs
  const { data: existingPOs } = await supabase
    .from("pos")
    .select("no_po")
    .in("no_po", noPOs);

  if (existingPOs && existingPOs.length > 0) {
    const dups = existingPOs.map((p) => p.no_po);
    return {
      success: false,
      message: `NO. PO sudah ada dalam sistem: ${dups.join(", ")}`,
    };
  }

  // Generate no_gungyu via DB function
  const { data: gungyuResult, error: gungyuError } =
    await supabase.rpc("generate_no_gungyu");
  if (gungyuError) {
    return {
      success: false,
      message: `Gagal generate No Gungyu: ${gungyuError.message}`,
    };
  }
  const noGungyu = "32-H-" + (gungyuResult as string).split("-")[-1]; // Temporary start from 32-H

  const now = new Date().toISOString();

  // Insert box (directly ARCHIVED, no location yet)
  const { data: newBox, error: boxError } = await supabase
    .from("boxes")
    .insert({
      owner_id: user.id,
      owner_name: user.name,
      status: "ARCHIVED",
      no_gungyu: noGungyu,
      bin_id: null,
      location_code: null,
      created_at: now,
      finalized_at: now,
      archived_at: now,
    })
    .select()
    .single();

  if (boxError) {
    return {
      success: false,
      message: `Gagal membuat box: ${boxError.message}`,
    };
  }

  // Insert POs
  const newPOs = entries.map((entry) => ({
    no_po: entry.no_po,
    box_id: newBox.id,
    tahun: entry.tahun,
    nama_barang: "",
    dok_date: "",
    keterangan: "",
    buyer_name: user.name,
    borrow_status: "AVAILABLE" as const,
    created_at: now,
  }));

  const { error: posError } = await supabase.from("pos").insert(newPOs);
  if (posError) {
    return {
      success: false,
      message: `Box dibuat tapi PO gagal: ${posError.message}`,
    };
  }

  // ---- Auto-assign bin (Fill Sequential) ----
  try {
    // 1. Fetch all active bins sorted by bin_code
    const { data: bins } = await supabase
      .from("bins")
      .select("id, bin_code, max_boxes")
      .eq("is_active", true)
      .order("bin_code", { ascending: true })
        .gte("bin_code", "C-04")
        .lte("bin_code", "C-09");

    if (bins && bins.length > 0) {
      // 2. Count current occupancy per bin
      const binIds = bins.map((b) => b.id);
      const { data: occupancy } = await supabase
        .from("boxes")
        .select("bin_id")
        .in("bin_id", binIds)
        .not("bin_id", "is", null);

      const countMap: Record<string, number> = {};
      if (occupancy) {
        for (const row of occupancy) {
          countMap[row.bin_id] = (countMap[row.bin_id] || 0) + 1;
        }
      }

      // 3. Find first bin with available capacity
      const target = bins.find((b) => {
        const used = countMap[b.id] || 0;
        return used < (b.max_boxes ?? 1);
      });

      if (target) {
        // 4. Update box with assigned bin
        await supabase
          .from("boxes")
          .update({ bin_id: target.id, location_code: target.bin_code })
          .eq("id", newBox.id);

        // 5. Record in box_location_history
        await supabase.from("box_location_history").insert({
          box_id: newBox.id,
          from_bin_id: null,
          to_bin_id: target.id,
          moved_by: user.name,
          moved_at: now,
          notes: "Auto-assign saat pembuatan arsip",
        });

        return {
          success: true,
          message: `Arsip ${noGungyu} dibuat dengan ${entries.length} PO (lokasi ${target.bin_code}).`,
          data: {
            boxId: newBox.id,
            no_gungyu: noGungyu,
            location_code: target.bin_code,
            pos: entries.map((e) => ({ no_po: e.no_po, tahun: e.tahun })),
          },
        };
      }
    }
  } catch {
    // Auto-assign failed silently â€” box is still created without location
  }

  return {
    success: true,
    message: `Arsip ${noGungyu} dibuat dengan ${entries.length} PO.`,
    data: {
      boxId: newBox.id,
      no_gungyu: noGungyu,
      location_code: null,
      pos: entries.map((e) => ({ no_po: e.no_po, tahun: e.tahun })),
    },
  };
}

// ---- Assign Box to Bin (place archived box without location) ----
export async function apiAssignBoxToBin(
  boxId: string,
  binId: string,
  userName: string,
): Promise<ActionResult> {
  const { data: box } = await supabase
    .from("boxes")
    .select("*")
    .eq("id", boxId)
    .single();
  if (!box) return { success: false, message: "Box tidak ditemukan." };
  if (box.status !== "ARCHIVED") {
    return {
      success: false,
      message: "Hanya box ARCHIVED yang bisa ditempatkan.",
    };
  }
  if (box.bin_id) {
    return {
      success: false,
      message: "Box sudah memiliki lokasi. Gunakan relokasi.",
    };
  }

  const { data: bin } = await supabase
    .from("bins")
    .select("*")
    .eq("id", binId)
    .single();
  if (!bin) return { success: false, message: "Bin tidak ditemukan." };
  if (!bin.is_active) return { success: false, message: "Bin tidak aktif." };

  // Check capacity
  const { count } = await supabase
    .from("boxes")
    .select("*", { count: "exact", head: true })
    .eq("bin_id", binId)
    .eq("status", "ARCHIVED");
  if ((count ?? 0) >= bin.max_boxes) {
    return {
      success: false,
      message: `Bin ${bin.bin_code} sudah penuh (kapasitas ${bin.max_boxes}).`,
    };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("boxes")
    .update({
      bin_id: binId,
      location_code: bin.bin_code,
    })
    .eq("id", boxId);

  if (updateError) {
    return {
      success: false,
      message: `Gagal update box: ${updateError.message}`,
    };
  }

  await supabase.from("box_location_history").insert({
    box_id: boxId,
    from_bin_id: null,
    to_bin_id: binId,
    moved_by: userName,
    moved_at: now,
    notes: "Penempatan awal",
  });

  return {
    success: true,
    message: `Box berhasil ditempatkan di ${bin.bin_code}.`,
  };
}

// ---- Relocate Box (admin) ----
export async function apiRelocateBox(
  boxId: string,
  newBinId: string,
  notes: string,
  userName: string,
): Promise<ActionResult> {
  const { data: box } = await supabase
    .from("boxes")
    .select("*")
    .eq("id", boxId)
    .single();
  if (!box) return { success: false, message: "Box tidak ditemukan." };
  if (box.status !== "ARCHIVED") {
    return {
      success: false,
      message: "Hanya box ARCHIVED yang bisa direlokasi.",
    };
  }

  const { data: bin } = await supabase
    .from("bins")
    .select("*")
    .eq("id", newBinId)
    .single();
  if (!bin) return { success: false, message: "Bin tujuan tidak ditemukan." };
  if (!bin.is_active)
    return { success: false, message: "Bin tujuan tidak aktif." };

  // Check capacity (exclude current box)
  const { count } = await supabase
    .from("boxes")
    .select("*", { count: "exact", head: true })
    .eq("bin_id", newBinId)
    .eq("status", "ARCHIVED")
    .neq("id", boxId);
  if ((count ?? 0) >= bin.max_boxes) {
    return { success: false, message: `Bin ${bin.bin_code} sudah penuh.` };
  }

  const prevBinId = box.bin_id;
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("boxes")
    .update({ bin_id: newBinId, location_code: bin.bin_code })
    .eq("id", boxId);

  if (updateError) {
    return {
      success: false,
      message: `Gagal relokasi: ${updateError.message}`,
    };
  }

  await supabase.from("box_location_history").insert({
    box_id: boxId,
    from_bin_id: prevBinId,
    to_bin_id: newBinId,
    moved_by: userName,
    moved_at: now,
    notes: notes || "Relokasi box",
  });

  return {
    success: true,
    message: `Box berhasil direlokasi ke ${bin.bin_code}.`,
  };
}

// ---- Move PO to another Box (admin) ----
export async function apiMovePOToBox(
  poId: string,
  targetBoxId: string,
  reason: string,
  userName: string,
): Promise<ActionResult> {
  const { data: po } = await supabase
    .from("pos")
    .select("*")
    .eq("id", poId)
    .single();
  if (!po) return { success: false, message: "PO tidak ditemukan." };

  const { data: targetBox } = await supabase
    .from("boxes")
    .select("*")
    .eq("id", targetBoxId)
    .single();
  if (!targetBox)
    return { success: false, message: "Box tujuan tidak ditemukan." };
  if (targetBox.status === "CANCELLED")
    return {
      success: false,
      message: "Tidak bisa memindahkan PO ke box yang dibatalkan.",
    };
  if (po.box_id === targetBoxId)
    return { success: false, message: "PO sudah ada di box ini." };

  const prevBoxId = po.box_id;
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("pos")
    .update({ box_id: targetBoxId })
    .eq("id", poId);

  if (updateError) {
    return {
      success: false,
      message: `Gagal pindahkan PO: ${updateError.message}`,
    };
  }

  await supabase.from("po_transfer_history").insert({
    po_id: poId,
    no_po: po.no_po,
    from_box_id: prevBoxId,
    to_box_id: targetBoxId,
    moved_by: userName,
    moved_at: now,
    reason: reason || "Dipindahkan oleh admin",
  });

  // CLEANUP: Check if previous box is empty
  const { count } = await supabase
    .from("pos")
    .select("*", { count: "exact", head: true })
    .eq("box_id", prevBoxId);

  if (count === 0) {
    // FIX: Hapus semua referensi box di transfer history & location history sebelum menghapus box untuk mencegah FK error
    await supabase.from("po_transfer_history").delete().or(`from_box_id.eq.${prevBoxId},to_box_id.eq.${prevBoxId}`);
    await supabase.from("box_location_history").delete().eq("box_id", prevBoxId);
    await supabase.from("boxes").delete().eq("id", prevBoxId);
  }

  return { success: true, message: `PO ${po.no_po} berhasil dipindahkan.` };
}

// ---- Edit PO ----
export async function apiEditPO(
  poId: string,
  fields: {
    no_po: string;
    tahun: number;
    nama_barang: string;
    dok_date: string;
    buyer_name: string;
    keterangan: string;
    borrow_status: string;
    no_gungyu: string;
  },
): Promise<ActionResult> {
  const { data: po } = await supabase
    .from("pos")
    .select("*")
    .eq("id", poId)
    .single();
  if (!po) return { success: false, message: "PO tidak ditemukan." };

  const { error } = await supabase
    .from("pos")
    .update({
      no_po: fields.no_po,
      tahun: fields.tahun,
      nama_barang: fields.nama_barang,
      dok_date: fields.dok_date,
      buyer_name: fields.buyer_name,
      keterangan: fields.keterangan,
      borrow_status: fields.borrow_status,
    })
    .eq("id", poId);

  if (error) {
    return { success: false, message: `Gagal edit PO: ${error.message}` };
  }

  if (po.box_id) {
    await supabase
      .from("boxes")
      .update({ no_gungyu: fields.no_gungyu || null })
      .eq("id", po.box_id);
  }

  return { success: true, message: `PO ${fields.no_po} berhasil diupdate.` };
}

// ---- Delete PO ----
export async function apiDeletePO(poId: string): Promise<ActionResult> {
  const { data: po } = await supabase
    .from("pos")
    .select("*")
    .eq("id", poId)
    .single();
  if (!po) return { success: false, message: "PO tidak ditemukan." };

  const boxId = po.box_id;

  // Clean up transfer history
  await supabase.from("po_transfer_history").delete().eq("po_id", poId);

  // Clean up borrow logs
  await supabase.from("borrow_logs").delete().eq("po_id", poId);

  const { error } = await supabase.from("pos").delete().eq("id", poId);
  if (error) {
    return { success: false, message: `Gagal hapus PO: ${error.message}` };
  }

  // CLEANUP: Check if the box is empty
  const { count } = await supabase
    .from("pos")
    .select("*", { count: "exact", head: true })
    .eq("box_id", boxId);

  if (count === 0) {
    // FIX: Hapus semua referensi box di transfer history & location history sebelum menghapus box untuk mencegah FK error
    await supabase.from("po_transfer_history").delete().or(`from_box_id.eq.${boxId},to_box_id.eq.${boxId}`);
    await supabase.from("box_location_history").delete().eq("box_id", boxId);
    await supabase.from("boxes").delete().eq("id", boxId);
  }

  return { success: true, message: `PO ${po.no_po} berhasil dihapus.` };
}

// ---- Borrow PO (admin) ----
export async function apiBorrowPO(
  poId: string,
  borrowerName: string,
  department: string,
  notes: string,
): Promise<ActionResult> {
  const { data: po } = await supabase
    .from("pos")
    .select("*")
    .eq("id", poId)
    .single();
  if (!po) return { success: false, message: "PO tidak ditemukan." };

  // Gunakan filter .eq("borrow_status", "AVAILABLE") untuk memastikan atomicity
  const { data: updatedPo, error: updateError } = await supabase
    .from("pos")
    .update({ borrow_status: "BORROWED" })
    .eq("id", poId)
    .eq("borrow_status", "AVAILABLE")
    .select()
    .single();

  if (updateError || !updatedPo) {
    return {
      success: false,
      message: `Gagal pinjam PO: PO mungkin sudah dipinjam.`,
    };
  }

  const { error: insertError } = await supabase.from("borrow_logs").insert({
    po_id: poId,
    no_po: po.no_po,
    borrower_name: borrowerName,
    department: department || "",
    borrowed_at: new Date().toISOString(),
    notes: notes || "",
  });

  if (insertError) {
    // Rollback if insert fails
    await supabase
      .from("pos")
      .update({ borrow_status: "AVAILABLE" })
      .eq("id", poId);

    return {
      success: false,
      message: `Gagal buat log peminjaman: ${insertError.message}`,
    };
  }

  return { success: true, message: `PO ${po.no_po} berhasil dipinjam.` };
}

// ---- Return PO (admin) ----
export async function apiReturnPO(poId: string): Promise<ActionResult> {
  const { error: updateError } = await supabase
    .from("pos")
    .update({ borrow_status: "AVAILABLE" })
    .eq("id", poId);

  if (updateError) {
    return {
      success: false,
      message: `Gagal kembalikan PO: ${updateError.message}`,
    };
  }

  await supabase
    .from("borrow_logs")
    .update({ returned_at: new Date().toISOString() })
    .eq("po_id", poId)
    .is("returned_at", null);

  return { success: true, message: "PO berhasil dikembalikan." };
}

// ---- Delete Box (admin) ----
export async function apiDeleteBox(boxId: string): Promise<ActionResult> {
  const { data: box } = await supabase
    .from("boxes")
    .select("no_gungyu")
    .eq("id", boxId)
    .single();

  if (!box) {
    return { success: false, message: "Box tidak ditemukan." };
  }

  // 1. Dapatkan daftar seluruh po_id yang terikat pada box_id
  const { data: posToDel } = await supabase
    .from("pos")
    .select("id")
    .eq("box_id", boxId);

  if (posToDel && posToDel.length > 0) {
    const poIds = posToDel.map((p) => p.id);

    // 2. Hapus transfer history untuk PO yang ada di box saat ini
    await supabase.from("po_transfer_history").delete().in("po_id", poIds);

    // 3. Hapus borrow logs untuk semua po_id
    await supabase.from("borrow_logs").delete().in("po_id", poIds);

    // 4. Hapus PO-nya itu sendiri
    await supabase.from("pos").delete().in("id", poIds);
  }

  // 5. FIX: Hapus SEMUA sisa transfer history dimana box ini menjadi asal atau tujuan (mencegah FK violation constraint)
  await supabase.from("po_transfer_history").delete().or(`from_box_id.eq.${boxId},to_box_id.eq.${boxId}`);

  // 6. Hapus location history box
  await supabase.from("box_location_history").delete().eq("box_id", boxId);

  // 7. Hapus box-nya
  const { error } = await supabase.from("boxes").delete().eq("id", boxId);

  if (error) {
    return { success: false, message: `Gagal menghapus box: ${error.message}` };
  }

  return { success: true, message: `Box ${box.no_gungyu} beserta isinya berhasil dihapus permanen.` };
}

// ============================================================
// RACK CRUD
// ============================================================

export async function apiAddRack(
  code: string,
  name: string,
): Promise<ActionResult> {
  const trimCode = code.trim().toUpperCase();
  if (!trimCode)
    return { success: false, message: "Kode rack tidak boleh kosong." };

  const { error } = await supabase.from("racks").insert({
    code: trimCode,
    name: name.trim() || `Rack ${trimCode}`,
    is_active: true,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: `Rack dengan kode ${trimCode} sudah ada.`,
      };
    }
    return { success: false, message: `Gagal tambah rack: ${error.message}` };
  }
  return { success: true, message: `Rack ${trimCode} berhasil ditambahkan.` };
}

export async function apiAddRow(
  rackId: string,
  code: string,
): Promise<ActionResult> {
  const trimCode = code.trim();
  if (!trimCode)
    return { success: false, message: "Kode row tidak boleh kosong." };

  const { data: rack } = await supabase
    .from("racks")
    .select("name")
    .eq("id", rackId)
    .single();
  if (!rack) return { success: false, message: "Rack tidak ditemukan." };

  const { error } = await supabase.from("rows").insert({
    rack_id: rackId,
    code: trimCode,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: `Row ${trimCode} sudah ada di rack ini.`,
      };
    }
    return { success: false, message: `Gagal tambah row: ${error.message}` };
  }
  return {
    success: true,
    message: `Row ${trimCode} berhasil ditambahkan ke ${rack.name}.`,
  };
}

export async function apiAddLevel(
  rowId: string,
  code: string,
): Promise<ActionResult> {
  const trimCode = code.trim().toUpperCase();
  if (!trimCode)
    return { success: false, message: "Kode level tidak boleh kosong." };

  const { error } = await supabase.from("levels").insert({
    row_id: rowId,
    code: trimCode,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: `Level ${trimCode} sudah ada di row ini.`,
      };
    }
    return { success: false, message: `Gagal tambah level: ${error.message}` };
  }
  return {
    success: true,
    message: `Level ${trimCode} berhasil ditambahkan.`,
  };
}

export async function apiAddBin(
  levelId: string,
  code: string,
): Promise<ActionResult> {
  const trimCode = code.trim();
  if (!trimCode)
    return { success: false, message: "Kode bin tidak boleh kosong." };

  // Build bin_code from parent hierarchy
  const { data: level } = await supabase
    .from("levels")
    .select("code, row_id")
    .eq("id", levelId)
    .single();
  if (!level) return { success: false, message: "Level tidak ditemukan." };

  const { data: row } = await supabase
    .from("rows")
    .select("code, rack_id")
    .eq("id", level.row_id)
    .single();

  const { data: rack } = row
    ? await supabase.from("racks").select("code").eq("id", row.rack_id).single()
    : { data: null };

  const rackCode = rack?.code ?? "";
  const rowCode = row?.code ?? "";
  const binCode = `${rackCode}-${rowCode}-${level.code}-${trimCode}`;

  const { error } = await supabase.from("bins").insert({
    level_id: levelId,
    code: trimCode,
    bin_code: binCode,
    max_boxes: 1,
    is_active: true,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: `Bin ${trimCode} sudah ada di level ini.`,
      };
    }
    return { success: false, message: `Gagal tambah bin: ${error.message}` };
  }
  return { success: true, message: `Bin ${binCode} berhasil ditambahkan.` };
}

export async function apiDeleteRack(rackId: string): Promise<ActionResult> {
  // 1. Ambil semua row di bawah rack ini
  const { data: childRows } = await supabase
    .from("rows")
    .select("id")
    .eq("rack_id", rackId);

  const rowIds = (childRows ?? []).map((r) => r.id);

  // 2. Ambil semua level di bawah row-row tersebut
  let levelIds: string[] = [];
  if (rowIds.length > 0) {
    const { data: childLevels } = await supabase
      .from("levels")
      .select("id")
      .in("row_id", rowIds);
    levelIds = (childLevels ?? []).map((l) => l.id);
  }

  // 3. Ambil semua bin di bawah level-level tersebut
  let binIds: string[] = [];
  if (levelIds.length > 0) {
    const { data: childBins } = await supabase
      .from("bins")
      .select("id")
      .in("level_id", levelIds);
    binIds = (childBins ?? []).map((b) => b.id);
  }

  // 4. Cek apakah ada box ARCHIVED di salah satu bin
  if (binIds.length > 0) {
    const { count: activeBoxCount } = await supabase
      .from("boxes")
      .select("*", { count: "exact", head: true })
      .in("bin_id", binIds)
      .eq("status", "ARCHIVED");

    if ((activeBoxCount ?? 0) > 0) {
      return {
        success: false,
        message: "Rack masih memiliki bin yang terisi box. Relokasi box terlebih dahulu.",
      };
    }
  }

  // 5. Cek apakah ada data historis
  let hasHistory = false;
  if (binIds.length > 0) {
    const { count: historyCount } = await supabase
      .from("box_location_history")
      .select("*", { count: "exact", head: true })
      .or(binIds.map((id) => `from_bin_id.eq.${id},to_bin_id.eq.${id}`).join(","));

    if ((historyCount ?? 0) > 0) {
      hasHistory = true;
    }
  }

  if (hasHistory) {
    // SOFT DELETE: Nonaktifkan rack dan seluruh isinya
    if (binIds.length > 0) {
      await supabase.from("bins").update({ is_active: false }).in("id", binIds);
    }
    if (levelIds.length > 0) {
      await supabase.from("levels").update({ is_active: false }).in("id", levelIds);
    }
    if (rowIds.length > 0) {
      await supabase.from("rows").update({ is_active: false }).in("id", rowIds);
    }
    const { error } = await supabase
      .from("racks")
      .update({ is_active: false })
      .eq("id", rackId);
    if (error)
      return { success: false, message: `Gagal nonaktifkan rack: ${error.message}` };
    return {
      success: true,
      message: `Rack beserta ${rowIds.length} row, ${levelIds.length} level, dan ${binIds.length} bin telah dinonaktifkan.`,
    };
  }

  // HARD DELETE (CASCADE): Hapus semua bin â†’ level â†’ row â†’ rack
  if (binIds.length > 0) {
    await supabase.from("bins").delete().in("id", binIds);
  }
  if (levelIds.length > 0) {
    await supabase.from("levels").delete().in("id", levelIds);
  }
  if (rowIds.length > 0) {
    await supabase.from("rows").delete().in("id", rowIds);
  }
  const { error } = await supabase.from("racks").delete().eq("id", rackId);
  if (error)
    return { success: false, message: `Gagal hapus rack: ${error.message}` };
  return {
    success: true,
    message: `Rack beserta ${rowIds.length} row, ${levelIds.length} level, dan ${binIds.length} bin berhasil dihapus.`,
  };
}

export async function apiDeleteRow(rowId: string): Promise<ActionResult> {
  // 1. Ambil semua level di bawah row ini
  const { data: childLevels } = await supabase
    .from("levels")
    .select("id")
    .eq("row_id", rowId);

  const levelIds = (childLevels ?? []).map((l) => l.id);

  // 2. Ambil semua bin di bawah level-level tersebut
  let binIds: string[] = [];
  if (levelIds.length > 0) {
    const { data: childBins } = await supabase
      .from("bins")
      .select("id")
      .in("level_id", levelIds);
    binIds = (childBins ?? []).map((b) => b.id);
  }

  // 3. Cek apakah ada box ARCHIVED di salah satu bin
  if (binIds.length > 0) {
    const { count: activeBoxCount } = await supabase
      .from("boxes")
      .select("*", { count: "exact", head: true })
      .in("bin_id", binIds)
      .eq("status", "ARCHIVED");

    if ((activeBoxCount ?? 0) > 0) {
      return {
        success: false,
        message: "Row masih memiliki bin yang terisi box. Relokasi box terlebih dahulu.",
      };
    }
  }

  // 4. Cek apakah ada data historis
  let hasHistory = false;
  if (binIds.length > 0) {
    const { count: historyCount } = await supabase
      .from("box_location_history")
      .select("*", { count: "exact", head: true })
      .or(binIds.map((id) => `from_bin_id.eq.${id},to_bin_id.eq.${id}`).join(","));

    if ((historyCount ?? 0) > 0) {
      hasHistory = true;
    }
  }

  if (hasHistory) {
    // SOFT DELETE: Nonaktifkan row, semua level, dan semua bin di bawahnya
    if (binIds.length > 0) {
      await supabase.from("bins").update({ is_active: false }).in("id", binIds);
    }
    if (levelIds.length > 0) {
      await supabase.from("levels").update({ is_active: false }).in("id", levelIds);
    }
    const { error } = await supabase
      .from("rows")
      .update({ is_active: false })
      .eq("id", rowId);
    if (error)
      return { success: false, message: `Gagal nonaktifkan row: ${error.message}` };
    return {
      success: true,
      message: `Row beserta ${levelIds.length} level dan ${binIds.length} bin telah dinonaktifkan.`,
    };
  }

  // HARD DELETE (CASCADE): Hapus semua bin â†’ level â†’ row
  if (binIds.length > 0) {
    await supabase.from("bins").delete().in("id", binIds);
  }
  if (levelIds.length > 0) {
    await supabase.from("levels").delete().in("id", levelIds);
  }
  const { error } = await supabase.from("rows").delete().eq("id", rowId);
  if (error)
    return { success: false, message: `Gagal hapus row: ${error.message}` };
  return {
    success: true,
    message: `Row beserta ${levelIds.length} level dan ${binIds.length} bin berhasil dihapus.`,
  };
}

export async function apiDeleteLevel(levelId: string): Promise<ActionResult> {
  // 1. Ambil semua bin di bawah level ini
  const { data: childBins } = await supabase
    .from("bins")
    .select("id, is_active")
    .eq("level_id", levelId);

  const binIds = (childBins ?? []).map((b) => b.id);

  // 2. Cek apakah ada box ARCHIVED di salah satu bin
  if (binIds.length > 0) {
    const { count: activeBoxCount } = await supabase
      .from("boxes")
      .select("*", { count: "exact", head: true })
      .in("bin_id", binIds)
      .eq("status", "ARCHIVED");

    if ((activeBoxCount ?? 0) > 0) {
      return {
        success: false,
        message: "Level masih memiliki bin yang terisi box. Relokasi box terlebih dahulu.",
      };
    }
  }

  // 3. Cek apakah ada data historis di bin-bin milik level ini
  let hasHistory = false;
  if (binIds.length > 0) {
    const { count: historyCount } = await supabase
      .from("box_location_history")
      .select("*", { count: "exact", head: true })
      .or(binIds.map((id) => `from_bin_id.eq.${id},to_bin_id.eq.${id}`).join(","));

    if ((historyCount ?? 0) > 0) {
      hasHistory = true;
    }
  }

  if (hasHistory) {
    // SOFT DELETE: Nonaktifkan level dan semua bin di bawahnya
    if (binIds.length > 0) {
      await supabase.from("bins").update({ is_active: false }).in("id", binIds);
    }
    const { error } = await supabase
      .from("levels")
      .update({ is_active: false })
      .eq("id", levelId);
    if (error)
      return { success: false, message: `Gagal nonaktifkan level: ${error.message}` };
    return {
      success: true,
      message: `Level beserta ${binIds.length} bin telah dinonaktifkan (data historis dipertahankan).`,
    };
  }

  // HARD DELETE (CASCADE): Hapus semua bin lalu level
  if (binIds.length > 0) {
    await supabase.from("bins").delete().in("id", binIds);
  }
  const { error } = await supabase.from("levels").delete().eq("id", levelId);
  if (error)
    return { success: false, message: `Gagal hapus level: ${error.message}` };
  return {
    success: true,
    message: `Level beserta ${binIds.length} bin berhasil dihapus.`,
  };
}

export async function apiDeleteBin(binId: string): Promise<ActionResult> {
  // 1. Cek apakah bin sedang menampung box ARCHIVED
  const { count: activeBoxCount } = await supabase
    .from("boxes")
    .select("*", { count: "exact", head: true })
    .eq("bin_id", binId)
    .eq("status", "ARCHIVED");

  if ((activeBoxCount ?? 0) > 0) {
    return {
      success: false,
      message: "Bin masih terisi oleh box. Relokasi box terlebih dahulu.",
    };
  }

  // 2. Cek apakah bin PERNAH digunakan (ada di box_location_history)
  const { count: historyCount } = await supabase
    .from("box_location_history")
    .select("*", { count: "exact", head: true })
    .or(`from_bin_id.eq.${binId},to_bin_id.eq.${binId}`);

  if ((historyCount ?? 0) > 0) {
    // SOFT DELETE: Bin pernah dipakai, nonaktifkan saja
    const { error } = await supabase
      .from("bins")
      .update({ is_active: false })
      .eq("id", binId);
    if (error)
      return { success: false, message: `Gagal nonaktifkan bin: ${error.message}` };
    return { success: true, message: "Bin telah dinonaktifkan (data historis dipertahankan)." };
  }

  // 3. HARD DELETE: Bin belum pernah dipakai sama sekali
  const { error } = await supabase.from("bins").delete().eq("id", binId);
  if (error)
    return { success: false, message: `Gagal hapus bin: ${error.message}` };
  return { success: true, message: "Bin berhasil dihapus." };
}

// ============================================================
// FILE UPLOAD (Cloudflare R2)
// ============================================================

// ---- Upload PO File ----
export async function apiUploadPOFile(
  poId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ActionResult<{ file_url: string }>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && result.success) {
          resolve({
            success: true,
            message: result.message,
            data: { file_url: result.file_url },
          });
        } else {
          resolve({
            success: false,
            message: result.message || "Gagal upload file.",
          });
        }
      } catch (e) {
        // Handle server errors that return HTML instead of JSON
        console.error("Upload response error:", xhr.responseText);
        resolve({
          success: false,
          message: `Gagal upload file (Error ${xhr.status}). Cek kredensial R2 di .env.local`,
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        message: "Network error saat upload. Cek koneksi internet.",
      });
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("poId", poId);

    xhr.send(formData);
  });
}

// ---- Delete PO File ----
export async function apiDeletePOFile(
  poId: string,
  fileUrl: string,
): Promise<ActionResult> {
  const res = await fetch("/api/files", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ poId, fileUrl }),
  });

  const result = await res.json();

  if (!res.ok || !result.success) {
    return {
      success: false,
      message: result.message || "Gagal hapus file.",
    };
  }

  return { success: true, message: result.message };
}


