// ==========================================
// Arsip PO — TypeScript Types
// ==========================================

// ---- Roles ----
export type UserRole = "buyer" | "admin";

// ---- Box Status ----
export type BoxStatus = "ARCHIVED" | "CANCELLED";

// ---- Borrow Status ----
export type BorrowStatus = "AVAILABLE" | "BORROWED";

// ---- Storage Structure ----
export interface Rack {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface Row {
  id: string;
  rack_id: string;
  code: string;
}

export interface Level {
  id: string;
  row_id: string;
  code: string;
}

export interface Bin {
  id: string;
  level_id: string;
  code: string;
  bin_code: string; // denormalized: e.g. "A-01-A-01"
  max_boxes: number; // default 1
  is_active: boolean;
}

// ---- Box ----
export interface Box {
  id: string;
  owner_id: string;
  owner_name: string;
  status: BoxStatus;
  no_gungyu: string | null;
  bin_id: string | null;
  location_code: string | null;
  created_at: string;
  finalized_at: string | null;
  archived_at: string | null;
}

// ---- PO ----
export interface PO {
  id: string;
  no_po: string;
  box_id: string;
  tahun: number;
  nama_barang: string;
  dok_date: string;
  keterangan: string;
  buyer_name: string;
  borrow_status: BorrowStatus;
  created_at: string;
  file_url: string | null;
}

// ---- Borrow Log ----
export interface BorrowLog {
  id: string;
  po_id: string;
  no_po: string;
  borrower_name: string;
  department: string;
  borrowed_at: string;
  returned_at: string | null;
  notes: string;
}

// ---- User ----
export interface User {
  id: string;
  auth_id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

// ---- History ----
export interface POTransferHistory {
  id: string;
  po_id: string;
  no_po: string;
  from_box_id: string;
  to_box_id: string;
  moved_by: string;
  moved_at: string;
  reason: string;
}

export interface BoxLocationHistory {
  id: string;
  box_id: string;
  from_bin_id: string | null;
  to_bin_id: string;
  moved_by: string;
  moved_at: string;
  notes: string;
}

// ---- Action Result ----
export interface ActionResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// ---- Search ----
export interface SearchResult extends PO {
  box_tahun: number;
  box_status: BoxStatus;
  location_code: string | null;
  no_gungyu: string | null;
}

// ---- Dashboard Metrics ----
export interface DashboardMetrics {
  total_po: number;
  total_archived: number;
  total_borrowed: number;
  active_borrows: number;
  occupied_bins: number;
  total_bins: number;
  this_month_boxes: number;
  last_month_boxes: number;
  overdue_borrows: number;
  six_month_trend: {
    month_start: string;
    month_val: number;
    year_val: number;
    count: number;
  }[];
  top_buyers: {
    buyer_name: string;
    count: number;
  }[];
  activities: {
    type: "create" | "relocate" | "borrow" | "return";
    label: string;
    detail: string;
    time: string;
  }[];
  recent_boxes: {
    id: string;
    status: BoxStatus;
    no_gungyu: string | null;
    location_code: string | null;
  }[];
}
