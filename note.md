# Catatan Teknis Proyek TanggapDarurat

## Stack Utama
- Backend: Laravel 12 (PHP >= 8.2)
- Frontend: React 18 + Inertia.js
- Build tool: Vite
- Styling: Tailwind CSS
- Peta: Leaflet + React Leaflet
- Icon: Lucide React

## Package Composer (PHP)
### Runtime
- `laravel/framework`
- `inertiajs/inertia-laravel`
- `laravel/sanctum`
- `laravel/tinker`
- `maatwebsite/excel`
- `barryvdh/laravel-dompdf`
- `tightenco/ziggy`

### Development
- `laravel/breeze`
- `fakerphp/faker`
- `phpunit/phpunit`
- `nunomaduro/collision`
- `laravel/pint`
- `laravel/sail`
- `laravel/pail`
- `mockery/mockery`

## Package NPM
### Dependencies
- `leaflet`
- `react-leaflet`
- `lucide-react`

### Dev Dependencies
- `@inertiajs/react`
- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`
- `laravel-vite-plugin`
- `tailwindcss`
- `@tailwindcss/forms`
- `@tailwindcss/vite`
- `postcss`
- `autoprefixer`
- `axios`
- `concurrently`
- `@headlessui/react`

## Sistem Inti yang Dipakai
- Auth + role-based routing (`superadmin`, `admin`, `manager`, `instansi`, `pelapor`).
- Master data admin: CRUD + pagination + search/filter + soft delete/recycle bin.
- Pelaporan pelapor:
  - dynamic metadata berdasarkan `emergency_type.form_schema`
  - upload multi-foto
  - map picker untuk lokasi
  - timeline steps
- Routing engine (`RoutingAssignmentEngine`):
  - rule by emergency type + area
  - prioritas assignment (`pending`, `queued`)
  - auto-step log
- Workflow assignment instansi:
  - primary/secondary behavior
  - update status terkontrol
  - submit completion (catatan + bukti foto)
- Verifikasi admin:
  - status `resolved_waiting_validation` -> `resolved` / `validation_failed`
  - validasi wajib cek bukti assignment
  - jika fail, assignment dibuka ulang untuk rework
- Triage kategori `Lainnya`:
  - laporan masuk status `triage`
  - admin bisa klasifikasi ke tipe resmi
  - atau shortcut create emergency type baru (dengan form builder) lalu klasifikasi
  - setelah routing rule dibuat, sistem backfill assignment untuk laporan `submitted` yang belum punya assignment
- Optimasi gambar:
  - kompres saat upload via service `ImageOptimizer`
  - command kompres gambar lama: `php artisan photos:optimize-existing`

## Catatan Operasional
- Extension/package baru terpasang (Maret 2026):
  - `maatwebsite/excel` untuk export `.xlsx`
  - `barryvdh/laravel-dompdf` untuk export `.pdf`
- Jika membuat/mengubah skema tabel, jalankan:
  - `php artisan migrate`
- Jika ingin cek test utama flow:
  - `php artisan test tests/Feature/ReportFlowTest.php`
  - `php artisan test tests/Feature/InstansiAssignmentWorkflowTest.php`
  - `php artisan test tests/Feature/AdminReportValidationTest.php`
  - `php artisan test tests/Feature/AdminOtherEmergencyClassificationTest.php`
