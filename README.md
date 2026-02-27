# Arsip PO

Aplikasi manajemen arsip fisik **Purchase Order (PO)** berbasis web untuk Departemen Pengadaan.

## Tentang Proyek

Sistem ini mencatat PO per box, melacak lokasi box pada struktur rak 4-level
(**Rack → Row → Level → Bin**), menyediakan pencarian PO, manajemen peminjaman,
monitoring kapasitas rak, heatmap kepadatan rak, dan histori perpindahan PO/box.

Implementasi saat ini berjalan sepenuhnya di sisi klien (frontend-only) menggunakan
Next.js + React dengan state in-memory (mock data), tanpa backend terpisah.

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| Buat Arsip | Input batch PO (tahun + NO. PO), langsung membuat 1 box berstatus `READY_FOR_ARCHIVE` |
| Manajemen Box | Assign box ke bin, relokasi box, pindah PO antar box |
| Arsip PO | Tabel PO dengan filter multi-kolom, sorting, dan pagination |
| Peminjaman | Borrow & return PO dengan pencatatan peminjam dan histori |
| Manajemen Rak | CRUD struktur Rack/Row/Level/Bin + heatmap kepadatan |
| Histori | Riwayat perpindahan PO dan relokasi box |
| Pencarian | Pencarian real-time PO berdasarkan NO. PO atau Nama Barang |

## Role Pengguna

- **Buyer** — membuat arsip, melihat daftar box dan PO
- **Admin** — semua akses Buyer + assign/relokasi box, kelola peminjaman, CRUD rak, lihat histori

## Tech Stack

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 16.1.6 | Framework utama (App Router) |
| React | 19.2.3 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Styling |
| shadcn/ui | — | Komponen UI (berbasis Radix UI) |
| TanStack Table | ^8 | Tabel data dengan filter & sorting |
| React Hook Form + Zod | — | Form & validasi |
| Sonner | ^2 | Toast notifications |

Lihat [`TECH_STACK.md`](TECH_STACK.md) untuk dokumentasi lengkap teknologi.

## Struktur Proyek

```
arsip-po/
├── frontend/        # Aplikasi Next.js
├── supabase/        # Konfigurasi Supabase (opsional/masa depan)
├── prd.md           # Product Requirements Document
└── TECH_STACK.md    # Dokumentasi tech stack
```

## Menjalankan Aplikasi

```bash
cd frontend
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Login dengan memilih role
**Buyer** atau **Admin** (tidak memerlukan password).

## Scripts

```bash
npm run dev    # Development server (Turbopack)
npm run build  # Production build
npm run start  # Production server
npm run lint   # Lint kode
```

## Dokumentasi Tambahan

- [`prd.md`](prd.md) — Product Requirements Document (alur, model data, aturan bisnis)
- [`TECH_STACK.md`](TECH_STACK.md) — Dokumentasi lengkap teknologi dan arsitektur
