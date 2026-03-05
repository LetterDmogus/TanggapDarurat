# Roadmap Pengembangan Aplikasi Tanggap Darurat

## Status Reset (2026-03-04)
- Phase 0: `DONE`
- Phase 1: `DONE` (reset baseline auth + role routing + dashboard skeleton)
- Phase 2: `DONE`
- Phase 3: `PLANNED`
- Phase 4+: `PENDING`

## Arsitektur Inti
- Backend: Laravel 11 (PHP 8.3)
- Frontend: React + Inertia + Vite
- Styling: Tailwind CSS
- Database model utama: `agencies`, `emergency_types`, `routing_rules`, `locations`, `reports`, `assignments`, `report_photos`, `assignment_photos`

## Role Sistem (standar aktif)
- `superadmin`
- `admin`
- `manager`
- `instansi`
- `pelapor`

## FASE 0 - Finalisasi Arsitektur & Setup
### Tujuan
Menyiapkan fondasi project fullstack.

### Output
- Struktur Laravel + Inertia berjalan.
- Auth dasar (login/register/forgot password) aktif.

## FASE 1 - Core Authentication & Role System
### Tujuan
Menjadikan sistem role-based sebagai baseline implementasi.

### Yang sudah dikerjakan
- Legacy backend/page lama diarsipkan ke namespace/folder `Legacy`.
- Routing aktif dibersihkan hanya untuk:
  - `/dashboard` (redirect berbasis role)
  - `/admin/dashboard`
  - `/instansi/dashboard`
  - `/pelapor/dashboard`
  - route auth + profile
- Database telah diganti ke schema baru sesuai `database.md`.
- Registrasi default role: `pelapor`.
- Middleware role disesuaikan dengan role standar roadmap.
- Dashboard fase 1 disederhanakan (skeleton) untuk `admin`, `instansi`, `pelapor`.

### Output Phase 1
- User login sesuai role.
- Redirect dashboard sesuai role.
- Kode lama tidak aktif namun tetap tersimpan untuk reuse.

## FASE 2 - Master Data Management (DONE)
### Backend
- CRUD `agencies`
- CRUD `emergency_types`
- CRUD `locations`
- CRUD `routing_rules`
- CRUD `user`

- Implementasi leaflet.js untuk CRUD locations
- Fitur soft delete untuk setiap data, hanya admin yang bisa lihat isi recycle bin nya

### Frontend
- Halaman admin untuk CRUD master data
- Table + pagination 
- filter + search bar + order by
- Halaman CRUD locations ada map preview untuk lihat lokasi yang di pin

### Progress (2026-03-04)
- DONE: CRUD `agencies`
- DONE: CRUD `emergency_types`
- DONE: CRUD `locations`
- DONE: CRUD `routing_rules`
- DONE: CRUD `user`
- DONE: Halaman admin CRUD + filter + pagination
- DONE: Soft delete + recycle bin (superadmin-only) untuk master data
- DONE: Map preview Leaflet di halaman locations

## FASE 3 - Sistem Pelaporan (Planned)
### Tujuan
Menyediakan alur end-to-end untuk `pelapor` membuat laporan darurat beserta bukti pendukung agar siap diproses engine routing di Fase 4.

### Scope Fungsional
- `pelapor` dapat membuat laporan baru.
- Form laporan menyesuaikan field metadata berdasarkan `emergency_type`.
- Laporan mendukung lokasi opsional (pin map + koordinat).
- Laporan mendukung upload multi-foto.
- `pelapor` dapat melihat detail dan riwayat laporan miliknya.
- `admin/superadmin/manager` dapat melihat daftar laporan (read-only pada fase ini).

### Backend Deliverables
- Endpoint `POST /reports` untuk create report (auth: `pelapor`).
- Endpoint `GET /reports/my` untuk list laporan milik pelapor.
- Endpoint `GET /reports/{report}` untuk detail laporan dengan policy akses.
- Validasi server-side:
  - `emergency_type_id` wajib dan aktif.
  - `description` wajib, min karakter.
  - metadata wajib mengikuti schema field di emergency type.
  - `lat/lng` nullable, tetapi jika salah satu diisi maka keduanya wajib.
  - file upload: image only, max size per file, max jumlah file.
- Penyimpanan:
  - `reports`: data utama + metadata JSON + koordinat.
  - `report_photos`: relasi file foto per laporan.
  - storage disk `public` dengan path terstruktur `reports/{report_id}/`.
- Standarisasi status awal laporan: `submitted`.
- Logging aktivitas minimal: created report + uploaded photos.

### Frontend Deliverables
- Halaman `pelapor/reports/create`:
  - pilih tipe darurat.
  - render field dinamis dari konfigurasi tipe darurat.
  - map picker Leaflet (opsional).
  - multi-image uploader (preview + hapus sebelum submit).
- Halaman `pelapor/reports/index`:
  - daftar laporan pribadi.
  - filter sederhana status + rentang tanggal.
- Halaman `pelapor/reports/show`:
  - detail laporan, metadata, koordinat, dan galeri foto.
- Halaman `admin/reports/index` (read-only):
  - daftar laporan global untuk monitoring awal.

### Kontrak Data Metadata (Phase 3)
- Sumber schema: `emergency_types.metadata_schema` (JSON).
- Format nilai tersimpan: `reports.metadata` (JSON object).
- Versi schema disimpan per laporan (`metadata_schema_version`) untuk menjaga kompatibilitas saat schema berubah.

### Non-Functional & Security
- Authorization wajib via policy (`report owner` atau role internal).
- Rate limiting endpoint create report.
- Sanitasi input teks.
- Error response konsisten (422 validation, 403 forbidden, 404 not found).

### Rencana Implementasi (2 Sprint)
#### Sprint 3.1 - Fondasi API & Data
- migration/finalisasi kolom `reports` dan `report_photos`.
- model relation + factory + seeder minimum.
- implement endpoint create/list/detail + policy.
- unit test + feature test API utama.

#### Sprint 3.2 - UI Pelapor & Hardening
- implement form dinamis + map picker + uploader.
- implement halaman list/detail laporan pelapor.
- implement read-only admin report list.
- validasi UX error state, loading, dan empty state.
- hardening upload/security + perbaikan performa query.

### Acceptance Criteria
- `pelapor` berhasil submit laporan dengan metadata valid dan >=1 foto.
- laporan tersimpan lengkap (metadata JSON, koordinat opsional, foto tersimpan).
- `pelapor` hanya bisa melihat laporan miliknya sendiri.
- `admin/superadmin/manager` dapat melihat semua laporan dalam mode read-only.
- semua skenario validasi utama tercakup automated test dan lulus.

### Dependencies ke Fase 4
- data `reports.submitted` siap dikonsumsi routing engine.
- metadata tersimpan konsisten untuk rule-based assignment.
- struktur foto laporan siap dipakai saat verifikasi/assignment.

## FASE 4 - Routing & Assignment Engine (Pending)
### Backend
- Service routing rule -> assignment instansi
- Priority handling
- Status lifecycle assignment

## FASE 5 - Dashboard Instansi & Verifikasi (Pending)
### Backend
- API assignment list by instansi
- Update status + upload bukti

### Frontend
- Task list instansi
- Filter status + detail modal

## FASE 6+ (Pending)
- Real-time update
- Monitoring manager
- Superadmin tools
- Security hardening
- Deployment dan optimasi
