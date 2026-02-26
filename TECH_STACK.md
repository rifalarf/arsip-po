# Tech Stack -- Arsip PO

Dokumentasi lengkap teknologi yang digunakan dalam proyek Aplikasi Arsip PO.

---

## Gambaran Umum

Aplikasi ini adalah **single-tier frontend** (tidak ada backend/server terpisah). Semua
logika bisnis, state, dan data berjalan sepenuhnya di sisi klien (browser).

```
┌─────────────────────────────────────────────┐
│              Browser (Client)               │
│                                             │
│  Next.js App Router  +  React 19            │
│  ┌─────────────────────────────────────┐    │
│  │  React Context  (state global)      │    │
│  │  in-memory mock data                │    │
│  └─────────────────────────────────────┘    │
│  Tailwind CSS v4  +  shadcn/ui              │
│  TanStack Table  +  Lucide Icons            │
└─────────────────────────────────────────────┘
```

---

## 1. Framework & Runtime

### Next.js 16.1.6

- **Peran**: Framework utama aplikasi
- **Fitur yang digunakan**:
  - App Router (`src/app/`)
  - Route Groups: `(auth)` dan `(dashboard)` untuk pemisahan layout
  - Dynamic Routes: `/boxes/[id]`
  - Turbopack sebagai dev bundler (konfigurasi di `next.config.ts`)
- **Catatan**: Karena tidak ada backend, semua halaman berjalan sebagai Client Components (`"use client"`)

```ts
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
};
```

### React 19.2.3

- **Peran**: UI library
- **Fitur yang digunakan**:
  - `useState`, `useCallback`, `useContext` untuk state management
  - `use(params)` -- React 19 API untuk unwrap Promise params di page components
  - `createContext` + custom hook `useApp()` sebagai pola global state

### React DOM 19.2.3

- Renderer untuk React di browser environment

---

## 2. Bahasa & Type Safety

### TypeScript 5.x

- **Konfigurasi**: `tsconfig.json` dengan strict mode aktif
- **Target**: ES2017
- **Module resolution**: `bundler` (Next.js/Turbopack native)
- **Path alias**: `@/*` -> `./src/*`
- **Key settings**:
  ```json
  {
    "strict": true,
    "noEmit": true,
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
  ```
- Semua types domain aplikasi didefinisikan di `src/lib/types.ts`:
  `UserRole`, `BoxStatus`, `BorrowStatus`, `Rack`, `Row`, `Level`, `Bin`,
  `Box`, `PO`, `BorrowLog`, `User`, `POTransferHistory`, `BoxLocationHistory`, `SearchResult`

---

## 3. Styling

### Tailwind CSS v4 (`tailwindcss: ^4`)

- **Peran**: Utility-first CSS framework
- **Versi**: v4 (major upgrade -- tidak pakai `tailwind.config.js`, config via CSS `@theme`)
- **Integrasi**: Via PostCSS plugin `@tailwindcss/postcss`
- **CSS entry**: `src/app/globals.css` menggunakan `@import "tailwindcss"` dan `@theme { ... }`
- **Design tokens**: Semua warna pakai CSS custom properties (HSL variables) untuk
  mendukung dark mode:
  ```css
  @theme {
    --color-primary: hsl(var(--primary));
    --color-background: hsl(var(--background));
    ...
  }
  ```
- **Dark mode**: Konfigurasi via `@custom-variant dark (&:is(.dark *))`

### tailwind-merge v3.5.0

- **Peran**: Menggabungkan class Tailwind tanpa konflik (menghindari duplikasi class)
- **Digunakan di**: `src/lib/utils.ts` via fungsi `cn()`
  ```ts
  import { clsx } from "clsx";
  import { twMerge } from "tailwind-merge";
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```

### clsx v2.1.1

- **Peran**: Conditional class name builder
- **Digunakan bersama** `tailwind-merge` via fungsi `cn()`

### tailwindcss-animate v1.0.7

- **Peran**: Plugin animasi untuk Tailwind (keyframes & utilities)
- **Digunakan untuk**: Animasi fade-in, slide-in pada beberapa halaman

### tw-animate-css v1.4.0 (devDep)

- Plugin tambahan animasi CSS untuk Tailwind v4

---

## 4. Komponen UI

### shadcn/ui v3.8.5 (via `shadcn` CLI)

- **Peran**: Component library berbasis Radix UI + Tailwind
- **Style preset**: `new-york`
- **Base color**: `neutral`
- **Icon library**: `lucide`
- **Konfigurasi**: `components.json`
- **Komponen yang digunakan** (di `src/components/ui/`):

  | Komponen        | Digunakan di                            |
  | --------------- | --------------------------------------- |
  | `badge`         | Status box, borrow status               |
  | `button`        | Semua aksi/form                         |
  | `card`          | Dashboard KPI, box grid cards           |
  | `dialog`        | Konfirmasi buat arsip, borrow, relokasi |
  | `dropdown-menu` | (tersedia, belum dipakai langsung)      |
  | `form`          | (tersedia, via react-hook-form)         |
  | `input`         | Form input teks                         |
  | `label`         | Label field form                        |
  | `popover`       | AutoFilter dropdown di tabel Arsip PO   |
  | `progress`      | Progress bar kapasitas                  |
  | `scroll-area`   | Area scroll pada beberapa panel         |
  | `select`        | Dropdown pilih bin, box tujuan          |
  | `separator`     | Pemisah visual antar section            |
  | `sheet`         | Mobile sidebar drawer                   |
  | `sonner`        | Toast notifications                     |
  | `table`         | Tabel PO, borrow log, histori           |
  | `tabs`          | Filter status box, histori, settings    |

### Radix UI v1.4.3 (`radix-ui`)

- **Peran**: Primitive headless components yang menjadi basis shadcn/ui
- **Komponen primitif yang dipakai** (via shadcn): Dialog, Popover, Select, Tabs,
  Separator, Scroll Area, Sheet, Dropdown Menu, Label, Progress

---

## 5. Tabel Data

### TanStack React Table v8.21.3 (`@tanstack/react-table`)

- **Peran**: Headless table library dengan fitur lengkap
- **Digunakan di**: Halaman Arsip PO (`/po-list`)
- **Fitur yang diaktifkan**:
  - `getCoreRowModel` -- render dasar
  - `getFilteredRowModel` -- filtering per kolom + global
  - `getFacetedRowModel` + `getFacetedUniqueValues` -- enumerasi nilai unik per kolom
  - `getPaginationRowModel` -- pagination
  - `getSortedRowModel` -- sorting klik header
- **Custom filter functions**:
  - `includesFilter` -- global search substring
  - `multiSelectFilter` -- per-kolom multi-select dropdown (Excel AutoFilter style)
- **Column helper**: `createColumnHelper<PORow>()` dengan tipe data flat join PO + Box

---

## 6. Forms & Validasi

### React Hook Form v7.71.1 (`react-hook-form`)

- **Peran**: Form state management yang performant
- **Digunakan via**: `@hookform/resolvers` untuk integrasi dengan Zod

### @hookform/resolvers v5.2.2

- **Peran**: Adapter yang menghubungkan React Hook Form dengan schema validator (Zod)

### Zod v4.3.6

- **Peran**: Runtime type-safe schema validation
- **Digunakan untuk**: Validasi schema form (tersedia di setup, dapat dikembangkan)

---

## 7. Notifikasi & Feedback

### Sonner v2.0.7

- **Peran**: Toast notification library
- **Provider**: `<Toaster />` dipasang di root layout
- **Digunakan di**: Semua halaman untuk feedback sukses/error setelah aksi
  ```ts
  toast.success("Arsip dibuat", { description: result.message });
  toast.error("Gagal", { description: result.message });
  ```

---

## 8. Icons

### Lucide React v0.574.0 (`lucide-react`)

- **Peran**: Icon library SVG-based, tree-shakeable
- **Icon yang digunakan** (sebagian):
  `Archive`, `PackagePlus`, `LayoutDashboard`, `Boxes`, `BookOpen`, `Settings`,
  `LogOut`, `List`, `Search`, `Filter`, `MapPin`, `User2`, `CalendarDays`,
  `Printer`, `ArrowLeft`, `ArrowRightLeft`, `Plus`, `X`, `Trash2`,
  `ChevronRight`, `ChevronDown`, `ChevronUp`, `Layers`, `BarChart3`,
  `CheckCircle2`, `Activity`, `Clock`, `ArrowUpRight`, `Eye`, `Package`,
  `ArrowUpAZ`, `ArrowDownAZ`, `ChevronsUpDown`, `ChevronLeft`, `Check`,
  `Menu`, `Separator`, `ScrollArea`

---

## 9. Theming

### next-themes v0.4.6

- **Peran**: Dark/light mode toggle dengan SSR support
- **Provider**: `<ThemeProvider>` di root layout (tersedia, UI toggle belum diekspos ke user)

---

## 10. Linting & Code Quality

### ESLint v9 + eslint-config-next 16.1.6

- **Konfigurasi**: `eslint.config.mjs`
- **Preset**: Next.js recommended rules (includes React Hooks rules, accessibility)
- **Menjalankan**: `npm run lint`

---

## 11. State Management

### React Context API (built-in)

- **Peran**: Global state management tanpa library eksternal
- **File**: `src/lib/context.tsx`
- **Pattern**:
  - `AppProvider` membungkus seluruh aplikasi
  - `useApp()` custom hook untuk konsumsi
- **State yang dikelola**:
  ```
  user, boxes, pos, borrowLogs,
  racks, rows, levels, bins,
  poTransferHistory, boxLocationHistory
  ```
- **Actions yang tersedia**:
  ```
  login / logout
  createBox
  assignBoxToBin / relocateBox
  movePOToBox
  borrowPO / returnPO
  addRack / addRow / addLevel / addBin
  deleteRack / deleteRow / deleteLevel / deleteBin
  searchPO
  getBoxById / getPOsByBoxId / getBoxesByStatus
  getBinById / getOccupiedBinIds / getRackLabel
  ```

---

## 12. Struktur Proyek

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── globals.css             # Tailwind v4 CSS entry + design tokens
│   │   ├── layout.tsx              # Root layout (ThemeProvider, AppProvider, Toaster)
│   │   ├── page.tsx                # Redirect root ke /dashboard
│   │   ├── (auth)/
│   │   │   └── login/page.tsx      # Halaman login (pilih role)
│   │   └── (dashboard)/
│   │       ├── layout.tsx          # Dashboard layout (Sidebar + Topbar)
│   │       ├── dashboard/page.tsx  # KPI + overview
│   │       ├── input/page.tsx      # Buat arsip baru
│   │       ├── po-list/page.tsx    # Tabel PO (TanStack Table)
│   │       ├── boxes/
│   │       │   ├── page.tsx        # Daftar box (grid cards)
│   │       │   └── [id]/page.tsx   # Detail box + admin actions
│   │       ├── borrow/page.tsx     # Manajemen peminjaman
│   │       ├── history/page.tsx    # Histori perpindahan
│   │       ├── settings/page.tsx   # Manajemen rak + heatmap
│   │       └── search/page.tsx     # Pencarian PO
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx         # Sidebar navigasi (role-based)
│   │   │   └── topbar.tsx          # Header + mobile drawer
│   │   └── ui/                     # shadcn/ui components
│   └── lib/
│       ├── types.ts                # Semua TypeScript interfaces & types
│       ├── mock-data.ts            # Data awal (racks, rows, levels, bins, boxes, POs)
│       ├── context.tsx             # AppContext + AppProvider + useApp hook
│       └── utils.ts                # cn() utility function
├── public/                         # Static assets
├── components.json                 # shadcn/ui konfigurasi
├── next.config.ts                  # Next.js config (Turbopack)
├── tsconfig.json                   # TypeScript config
├── postcss.config.mjs              # PostCSS config (Tailwind v4)
├── eslint.config.mjs               # ESLint config
└── package.json                    # Dependencies
```

---

## 13. Scripts

```bash
# Development server (dengan Turbopack)
npm run dev

# Production build
npm run build

# Production server (setelah build)
npm run start

# Lint
npm run lint
```

---

## 14. Versi Node & Package Manager

| Tool       | Versi          |
| ---------- | -------------- |
| Node.js    | >= 20.x        |
| npm        | bawaan Node 20 |
| TypeScript | ^5.x           |

---

## 15. Ringkasan Dependencies

### Production Dependencies

| Package                    | Versi    | Fungsi                                   |
| -------------------------- | -------- | ---------------------------------------- |
| `next`                     | 16.1.6   | Framework (App Router, routing, SSR/SSG) |
| `react`                    | 19.2.3   | UI library                               |
| `react-dom`                | 19.2.3   | DOM renderer                             |
| `typescript`               | ^5       | Bahasa (devDep, tapi inti proyek)        |
| `tailwindcss`              | ^4       | Utility CSS framework                    |
| `radix-ui`                 | ^1.4.3   | Headless UI primitives                   |
| `@tanstack/react-table`    | ^8.21.3  | Tabel data (filter, sort, paging)        |
| `react-hook-form`          | ^7.71.1  | Form state management                    |
| `@hookform/resolvers`      | ^5.2.2   | Adapter RHF + Zod                        |
| `zod`                      | ^4.3.6   | Schema validation                        |
| `sonner`                   | ^2.0.7   | Toast notifications                      |
| `lucide-react`             | ^0.574.0 | Icon library SVG                         |
| `next-themes`              | ^0.4.6   | Dark/light mode                          |
| `class-variance-authority` | ^0.7.1   | Variant-based className builder (shadcn) |
| `clsx`                     | ^2.1.1   | Conditional class names                  |
| `tailwind-merge`           | ^3.5.0   | Merge Tailwind classes tanpa konflik     |
| `tailwindcss-animate`      | ^1.0.7   | Plugin animasi Tailwind                  |

### Dev Dependencies

| Package                | Versi  | Fungsi                                |
| ---------------------- | ------ | ------------------------------------- |
| `shadcn`               | ^3.8.5 | CLI untuk generate komponen shadcn/ui |
| `@tailwindcss/postcss` | ^4     | PostCSS plugin Tailwind v4            |
| `tw-animate-css`       | ^1.4.0 | Animasi tambahan untuk Tailwind v4    |
| `eslint`               | ^9     | Linter                                |
| `eslint-config-next`   | 16.1.6 | ESLint rules untuk Next.js            |
| `@types/node`          | ^20    | TypeScript types Node.js              |
| `@types/react`         | ^19    | TypeScript types React                |
| `@types/react-dom`     | ^19    | TypeScript types React DOM            |
