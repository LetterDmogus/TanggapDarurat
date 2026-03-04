# Roadmap Pengembangan Aplikasi Tanggap Darurat

## Status Reset (2026-03-04)
- Phase 0: `DONE`
- Phase 1: `DONE` (reset baseline auth + role routing + dashboard skeleton)
- Phase 2: `DONE`
- Phase 3+: `PENDING`

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

## FASE 3 - Sistem Pelaporan (Pending)
### Backend
- API create report
- Upload multi-image report
- Simpan metadata dinamis dan koordinat

### Frontend
- Form laporan dinamis berdasarkan `emergency_type`
- Map picker (leaflet)
- Upload multi-image

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
