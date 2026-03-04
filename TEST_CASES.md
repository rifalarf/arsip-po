# Skenario Pengujian (Test Cases) - Aplikasi Arsip PO

Dokumen ini berisi daftar skenario pengujian manual (manual test cases) untuk memastikan seluruh fitur pada aplikasi Arsip PO berjalan dengan baik. Pengujian mencakup Autentikasi, Manajemen PO, Manajemen Box, Peminjaman Dokumen, dan Integrasi File (Cloudflare R2).

## 1. Modul Autentikasi (Auth)

| ID | Skenario Pengujian (Test Case) | Langkah-Langkah (Steps) | Hasil yang Diharapkan (Expected Result) | Status |
|--------|-----------------------------------|--------------------------|----------------------------------------|--------|
| **TC-AUTH-01** | Login dengan kredensial valid | 1. Buka halaman login.<br>2. Masukkan email & password yang benar.<br>3. Klik tombol Login. | Pengguna berhasil masuk dan diarahkan ke halaman Dashboard. | [ ] |
| **TC-AUTH-02** | Login dengan kredensial salah | 1. Buka halaman login.<br>2. Masukkan email / password yang salah.<br>3. Klik Login. | Muncul pesan error "Kredensial tidak valid" dan pengguna tetap di halaman login. | [ ] |
| **TC-AUTH-03** | Pengujian durasi sesi (Session) | 1. Login menggunakan kredensial valid.<br>2. Tutup tab/browser dan buka kembali keesokan harinya. | Pengguna masih dalam kondisi login (sesi bertahan selama 1 minggu). | [ ] |
| **TC-AUTH-04** | Logout dari aplikasi | 1. Klik nama profil pada Topbar.<br>2. Pilih menu Logout. | Sesi berakhir dan pengguna diarahkan kembali ke halaman Login. | [ ] |
| **TC-AUTH-05** | Akses rute aman tanpa login | 1. Akses rute `/dashboard` atau rute lain secara langsung via URL tanpa login. | Aplikasi secara otomatis mengarahkan (redirect) ke halaman `/login`. | [ ] |

## 2. Modul Manajemen PO (Purchase Order)

| ID | Skenario Pengujian (Test Case) | Langkah-Langkah (Steps) | Hasil yang Diharapkan (Expected Result) | Status |
|--------|-----------------------------------|--------------------------|----------------------------------------|--------|
| **TC-PO-01** | Input PO menggunakan File | 1. Buka menu Input PO.<br>2. Isi semua form mandatory.<br>3. Unggah (upload) dokumen scan PO.<br>4. Klik Submit. | Data PO baru berhasil disimpan beserta URL file (R2) dan muncul di daftar PO. | [ ] |
| **TC-PO-02** | Input PO tanpa File | 1. Buka menu Input PO.<br>2. Isi semua form mandatory (kosongkan opsi file).<br>3. Klik Submit. | Data PO baru berhasil disimpan dengan status file opsional kosong. | [ ] |
| **TC-PO-03** | Lihat List PO | 1. Buka menu PO List.<br>2. Periksa apakah Pagination & Table berfungsi. | Daftar PO tampil lengkap, pagination berfungsi dengan lancar. | [ ] |
| **TC-PO-04** | Edit Data PO | 1. Di PO List, pilih salah satu PO dan klik tombol Edit.<br>2. Ubah beberapa data teks (misal: Vendor).<br>3. Simpan. | Perubahan tersimpan dengan sukses dan data terupdate di tabel. | [ ] |
| **TC-PO-05** | Upload/Replace File via Edit PO | 1. Buka modal Edit PO.<br>2. Pilih file PDF baru pada input file.<br>3. Simpan. | File berhasil terunggah ke Cloudflare R2, dan disematkan (attach) pada PO tersebut. | [ ] |
| **TC-PO-06** | Lihat (View) File Scanned | 1. Pada tabel PO, klik icon "Mata" (Eye) pada baris PO yang memiliki file bersangkutan. | File PDF berhasil dibuka pada tab baru. | [ ] |
| **TC-PO-07** | Hapus PO | 1. Di tabel PO, pilih opsi Delete.<br>2. Konfirmasi penghapusan. | Data PO hilang dari daftar. Jika memiliki file, file di R2 juga terhapus. | [ ] |

## 3. Modul Manajemen Box

| ID | Skenario Pengujian (Test Case) | Langkah-Langkah (Steps) | Hasil yang Diharapkan (Expected Result) | Status |
|--------|-----------------------------------|--------------------------|----------------------------------------|--------|
| **TC-BOX-01** | Buat Box Baru | 1. Buka halaman Boxes.<br>2. Klik tombol Tambah Box.<br>3. Isi Lokasi (tanpa input Tahun) & simpan. | Box baru berhasil ditambahkan pada tabel box. | [ ] |
| **TC-BOX-02** | Edit Box | 1. Pada daftar Box, klik Edit.<br>2. Ubah kolom lokasi/deskripsi.<br>3. Simpan. | Informasi Box berhasil terupdate. | [ ] |
| **TC-BOX-03** | Tambahkan PO dkk Box | 1. Pada menu Input PO atau Edit PO, kaitkan PO tersebut ke salah satu box yang tersedia. | PO terkait berhasil masuk dan diasosiasikan dengan Box tersebut. | [ ] |
| **TC-BOX-04** | Cetak Label (Print Label) | 1. Buka detail Box.<br>2. Klik cetak label.<br>3. Cek layout pada fitur Print Preview. | Fitur cetak mencontohkan struktur label berupa 1 kolom yang menampilkan informasi Box, daftar PO, dengan maksimal ruang hingga 40 slot. | [ ] |
| **TC-BOX-05** | Hapus Box | 1. Pilih Hapus pada baris Box (jika tidak ada PO yang terikat). | Box berhasil dihapus. | [ ] |

## 4. Modul Pencarian (Search)

| ID | Skenario Pengujian (Test Case) | Langkah-Langkah (Steps) | Hasil yang Diharapkan (Expected Result) | Status |
|--------|-----------------------------------|--------------------------|----------------------------------------|--------|
| **TC-SRC-01** | Pencarian Berdasarkan No. PO | 1. Ke menu Search.<br>2. Masukkan nomor PO yang spesifik. | Data PO terkait muncul seketika di hasil pencarian. | [ ] |
| **TC-SRC-02** | Pencarian Multi Keyword | 1. Cari dengan kata kunci sebagian (Nama Vendor atau sebagian nomor PO). | Sistem menampilkan list seluruh PO yang mencocoki query tersebut. | [ ] |

## 5. Modul Peminjaman (Borrow) & Riwayat (History)

| ID | Skenario Pengujian (Test Case) | Langkah-Langkah (Steps) | Hasil yang Diharapkan (Expected Result) | Status |
|--------|-----------------------------------|--------------------------|----------------------------------------|--------|
| **TC-BRW-01** | Pinjam Dokumen PO | 1. Buka menu Borrow.<br>2. Pilih PO yang ingin dipinjam.<br>3. Isi form peminjam.<br>4. Simpan. | Status PO berubah (sedang dipinjam) dan tercatat di riwayat Peminjaman (History). | [ ] |
| **TC-BRW-02** | Kembalikan Dokumen PO | 1. Cari PO yang sedang dipinjam.<br>2. Tandai sebagai dikembalikan. | Status PO berubah (tersedia/Arsip) dan tanggal pengembalian tercatat di History. | [ ] |
| **TC-BRW-03** | Lihat Riwayat Transaksi | 1. Buka halaman History. | Semua urutan (audit trail) dokumen dipinjam & diretur tampil dan sesuai dengan waktu transaksinya. | [ ] |
| **TC-BRW-04** | Validasi Pinjam Dokumen Ganda | 1. Coba pinjam dokumen PO yang statusnya MASIH dipinjam oleh orang lain. | Sistem menolak / memunculkan notifikasi validasi dokumen tidak tersedia. | [ ] |

---
**Catatan Penting:** 
Dokumen ini difokuskan sebagai User Acceptance Testing (UAT) dan pengujian manual QA (Manual Testing). Apabila ingin diotomatisasi melalui CI/CD, dapat digunakan *framework* seperti Cypress atau Playwright.
