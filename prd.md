PRD -- Aplikasi Arsip PO (Sesuai Implementasi Aktual)

---

1. Ringkasan Produk

Aplikasi Arsip PO adalah sistem manajemen arsip fisik Purchase Order (PO) berbasis web
untuk Departemen Pengadaan. Sistem mencatat PO per box, melacak lokasi box pada struktur
rak 4-level (Rack -> Row -> Level -> Bin) yang dikonfigurasi admin, menyediakan pencarian
PO, manajemen peminjaman, monitoring kapasitas, heatmap kepadatan rak, dan histori
perpindahan PO/box.

Karakteristik utama implementasi saat ini:
- Frontend-only (Next.js + React), state management via React Context
- Data disimpan di in-memory state (mock data); belum ada backend persisten
- Autentikasi berbasis pemilihan role (tanpa password/SSO)
- Dua role: Buyer dan Admin

---

2. Peran Pengguna

Buyer:
- Membuat arsip baru (1 batch = 1 box langsung berstatus READY_FOR_ARCHIVE)
- Melihat daftar box (semua box, bukan hanya milik sendiri)
- Melihat detail box dan daftar PO di dalamnya
- Mengakses tabel Arsip PO (read + filter)

Admin:
- Semua akses Buyer
- Assign box ke bin (READY_FOR_ARCHIVE -> ARCHIVED)
- Relokasi box ke bin lain
- Pindahkan PO antar box
- Kelola peminjaman PO (borrow & return)
- Lihat histori (perpindahan PO + relokasi box)
- CRUD struktur rak (Rack/Row/Level/Bin)
- Lihat heatmap kapasitas rak

---

3. Login & Navigasi

Login dilakukan dengan memilih role (Buyer atau Admin) tanpa autentikasi username/password.

Sidebar navigasi berdasarkan role:

| Menu           | Buyer | Admin |
|----------------|-------|-------|
| Dashboard      |  v    |  v    |
| Buat Arsip     |  v    |  v    |
| Arsip PO       |  v    |  v    |
| Daftar Box     |  v    |  v    |
| Peminjaman     |  -    |  v    |
| Histori        |  -    |  v    |
| Manajemen Rak  |  -    |  v    |

Halaman /search tersedia via URL langsung (belum masuk sidebar navigasi).

---

4. Alur Aplikasi

4.1 Buat Arsip (Buyer/Admin)
1. Buka menu Buat Arsip (/input)
2. Isi form: setiap baris berisi pasangan Tahun + NO. PO
   - Default tahun = tahun berjalan
   - Sistem menyarankan awalan NO. PO: 51000 (PI) dan 52000 (PKC)
   - Paste multi-baris didukung (split by newline/comma/semicolon/tab)
3. Klik Lanjut -> preview daftar PO yang akan dibuat
4. Klik Konfirmasi -> sistem membuat 1 box baru dengan status READY_FOR_ARCHIVE
   - Box tahun = tahun dari baris pertama
   - finalized_at = waktu pembuatan (tidak ada tahap DRAFT)
5. Notifikasi sukses -> form reset

4.2 Assign Box ke Rak (Admin)
1. Buka Daftar Box (/boxes) -> pilih box berstatus READY_FOR_ARCHIVE
2. Di halaman detail box (/boxes/[id]), pilih bin dari dropdown (hanya bin kosong + aktif)
3. Klik Assign ke Rak
4. Sistem:
   - Mengubah status box -> ARCHIVED
   - Men-generate no_gungyu format GY-XXXX (counter sequential berdasarkan jumlah box ARCHIVED)
   - Mengisi bin_id, location_code, archived_at
   - Mencatat entri ke BoxLocationHistory (from_bin = null, to_bin = target bin)

4.3 Relokasi Box (Admin)
1. Dari halaman detail box berstatus ARCHIVED, klik Relokasi
2. Pilih bin tujuan (kosong + aktif, bukan bin saat ini) + isi catatan
3. Sistem update bin_id dan location_code, catat BoxLocationHistory

4.4 Pindah PO Antar Box (Admin)
1. Dari halaman detail box, klik ikon pindah pada baris PO
2. Pilih box tujuan (status apapun kecuali CANCELLED) + isi alasan
3. Sistem update box_id pada PO, catat POTransferHistory

4.5 Peminjaman PO (Admin)
1. Buka menu Peminjaman (/borrow)
2. Klik Pinjam PO -> cari PO (by NO. PO / Nama Barang)
3. Pilih satu atau lebih PO (multi-select) -> isi nama peminjam + catatan -> Konfirmasi
4. Sistem mengubah borrow_status -> BORROWED, catat BorrowLog
5. Untuk pengembalian: dari tabel PO yang dipinjam, klik Kembalikan -> konfirmasi
6. Sistem mengubah borrow_status -> AVAILABLE, mengisi returned_at pada BorrowLog

4.6 Histori (Admin)
1. Buka menu Histori (/history)
2. Tab Perpindahan PO: tabel POTransferHistory (NO. PO, dari box, ke box, oleh, waktu, alasan)
3. Tab Relokasi Box: tabel BoxLocationHistory (box, dari bin, ke bin, oleh, waktu, catatan)

4.7 Manajemen Rak (Admin)
1. Buka menu Manajemen Rak (/settings)
2. Tab Manajemen Rak: tree view hierarki Rack -> Row -> Level -> Bin
   - Setiap node dapat di-expand/collapse
   - Tambah Rack: input kode (auto uppercase) + nama
   - Tambah Row/Level/Bin: inline input di dalam parent yang di-expand
   - Hapus node: tombol ikon (diblokir jika masih ada children atau bin terisi)
   - Bincode digenerate otomatis: {RackCode}-{RowCode}-{LevelCode}-{BinCode} (mis. A-01-A-01)
3. Tab Heatmap: visualisasi kepadatan rak
   - Summary global: total slot, terisi, kosong
   - Per rack: progress bar kepadatan + persentase penuh
   - Drill-down per row -> level -> grid bin kecil
   - Warna bin: kosong (abu), terisi (hijau), terisi + ada PO dipinjam (kuning), nonaktif (abu putus)
   - Hover bin -> tooltip: bin_code, no_gungyu, tahun box, owner, jumlah PO dipinjam

4.8 Pencarian PO
- Halaman /search: pencarian real-time berdasarkan NO. PO atau Nama Barang
- Hasil menampilkan info PO + info box (tahun, status, lokasi, no_gungyu)
- Belum masuk navigasi sidebar (aksesible via URL langsung)

---

5. Halaman & Fitur Per Halaman

| Halaman        | Route          | Deskripsi                                                                  |
|----------------|----------------|----------------------------------------------------------------------------|
| Dashboard      | /dashboard     | KPI cards (total PO, box diarsipkan, dipinjam, kapasitas rak%), box terbaru|
| Buat Arsip     | /input         | Form input tahun+NO.PO per baris, paste multi-baris, preview, konfirmasi   |
| Arsip PO       | /po-list       | TanStack Table: global search, filter kolom multi-select, sorting, paging  |
| Daftar Box     | /boxes         | Grid card box, filter tab by status                                        |
| Detail Box     | /boxes/[id]    | Info box, tabel PO, aksi admin: assign/relokasi/pindah PO, cetak label     |
| Peminjaman     | /borrow        | Tabel PO dipinjam, dialog borrow multi-PO, dialog return                   |
| Histori        | /history       | Dua tab: perpindahan PO & relokasi box                                     |
| Manajemen Rak  | /settings      | Dua tab: tree CRUD rak & heatmap                                           |
| Cari PO        | /search        | Search bar animasi, hasil card per PO                                      |
| Login          | /login         | Pilih role (Buyer / Admin)                                                 |

---

6. Kebutuhan Fungsional

6.1 Buat Box (Buyer/Admin)
- Input: array baris { tahun, no_po } (minimal 1 baris terisi)
- Validasi:
  - Tahun: integer 4 digit, 2000 <= tahun <= (tahun sekarang + 1)
  - NO. PO tidak duplikat dalam batch yang sama
  - NO. PO tidak duplikat di seluruh database
- Box tahun diambil dari tahun baris pertama
- Box langsung dibuat dengan status READY_FOR_ARCHIVE (tidak ada tahap DRAFT)
- finalized_at diisi = created_at saat pembuatan

6.2 Status Box

| Status            | Deskripsi                             | Transisi                      |
|-------------------|---------------------------------------|-------------------------------|
| READY_FOR_ARCHIVE | Baru dibuat, menunggu assign bin      | -> ARCHIVED (oleh admin)      |
| ARCHIVED          | Sudah di-assign ke bin                | Bisa direlokasi oleh admin    |
| CANCELLED         | Dibatalkan (terminal)                 | PO tidak bisa dipindah ke sini|

6.3 Assign Box ke Bin (Admin)
- Hanya box berstatus READY_FOR_ARCHIVE
- Bin harus is_active=true dan occupied < max_boxes (default 1)
- no_gungyu digenerate: "GY-" + counter 4 digit (jumlah box ARCHIVED + 1)
- Mencatat BoxLocationHistory (from_bin_id = null)

6.4 Relokasi Box (Admin)
- Hanya box berstatus ARCHIVED
- Bin tujuan harus aktif, kosong, bukan bin saat ini
- Mencatat BoxLocationHistory

6.5 Pindah PO Antar Box (Admin)
- Dari box berstatus apapun ke box berstatus apapun kecuali CANCELLED
- Tidak bisa pindah ke box yang sama
- Mencatat POTransferHistory

6.6 Kapasitas Bin
- max_boxes default = 1 (constraint diperiksa saat assign dan relokasi)

6.7 Manajemen Struktur Rak
- CRUD: Rack, Row (per Rack), Level (per Row), Bin (per Level)
- Kode unik dalam scope parent
- Hapus node diblokir jika masih punya children
- Hapus bin diblokir jika ada box ARCHIVED di bin tersebut
- Bin_code: {RackCode}-{RowCode}-{LevelCode}-{BinCode}

6.8 Peminjaman PO
- Multi-select borrow: pilih beberapa PO sekaligus, 1 nama peminjam + catatan bersama
- Return: satu per satu dengan konfirmasi dialog
- BorrowLog: po_id, no_po, borrower_name, borrowed_at, returned_at (nullable), notes

6.9 Heatmap
- Dihitung dari struktur bin aktual (dinamis mengikuti CRUD rak)
- Occupied = bin yang memiliki box berstatus ARCHIVED
- Global summary -> per rack (progress bar) -> drilldown row/level/bin grid
- Tooltip per bin: detail box + jumlah PO sedang dipinjam

6.10 Histori
- POTransferHistory: po_id, no_po, from_box_id, to_box_id, moved_by, moved_at, reason
- BoxLocationHistory: box_id, from_bin_id(nullable), to_bin_id, moved_by, moved_at, notes
- Tampilan: terbaru di atas (reverse chronological)

---

7. Model Data

7.1 Struktur Rak

  Rack  { id, code, name, is_active }
  Row   { id, rack_id, code }
  Level { id, row_id, code }
  Bin   { id, level_id, code, bin_code, max_boxes=1, is_active }

7.2 Box

  Box {
    id, owner_id, owner_name,
    tahun          -- integer, dari tahun baris pertama input
    status         -- READY_FOR_ARCHIVE | ARCHIVED | CANCELLED
    no_gungyu      -- nullable, format GY-XXXX, diisi saat ARCHIVED
    bin_id         -- nullable
    location_code  -- nullable, = bin.bin_code
    created_at, finalized_at (= created_at), archived_at (nullable)
  }

7.3 PO

  PO {
    id, no_po, box_id,
    tahun         -- dari input per baris, bisa berbeda antar PO dalam 1 box
    nama_barang, dok_date, keterangan,
    buyer_name,
    borrow_status -- AVAILABLE | BORROWED
    created_at
  }

7.4 BorrowLog

  BorrowLog { id, po_id, no_po, borrower_name, borrowed_at, returned_at, notes }

7.5 Histories

  POTransferHistory  { id, po_id, no_po, from_box_id, to_box_id, moved_by, moved_at, reason }
  BoxLocationHistory { id, box_id, from_bin_id, to_bin_id, moved_by, moved_at, notes }

7.6 User

  User { id, name, role: buyer | admin }

---

8. Aturan & Kebijakan

- 1 batch input = 1 box baru, langsung berstatus READY_FOR_ARCHIVE (tidak ada tahap DRAFT)
- Tahun box = tahun dari baris pertama input
- NO. PO unik di seluruh database
- Default kapasitas bin = 1 box per bin
- no_gungyu digenerate saat box di-ARCHIVED (format GY-XXXX, sequential counter)
- Admin memindah PO dan merelokasi box dari halaman detail box (/boxes/[id])
- Hapus node rak hanya jika tidak ada children / bin tidak terisi
- Borrow mencatat peminjam + catatan; return mengisi returned_at

---

9. Batasan & Status Implementasi Saat Ini

- State in-memory (React Context + mock data) -- tidak persisten antar refresh halaman
- Login = pemilihan role saja, tanpa autentikasi
- Halaman /search belum masuk sidebar navigasi
- Tidak ada backend/API; belum ada integrasi SAP atau import XLS
- Tidak ada role non-buyer (read-only) yang terpisah
- Tidak ada fitur edit/hapus PO atau box setelah dibuat (kecuali pindah PO oleh admin)
- Cetak label box (print browser) tersedia di halaman detail box berstatus ARCHIVED
