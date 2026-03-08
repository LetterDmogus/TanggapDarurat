# Roadmap Pengembangan Aplikasi Tanggap Darurat

## Status Reset (2026-03-04)
- Phase 0: `DONE`
- Phase 1: `DONE` (reset baseline auth + role routing + dashboard skeleton)
- Phase 2: `DONE`
- Phase 3: `DONE`
- Phase 4: `DONE`
- Phase 5: `DONE` (2026-03-08)
- Phase 6+: `PENDING`

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

## FASE 3 - Sistem Pelaporan (DONE)
### Tujuan
Menyediakan alur end-to-end untuk `pelapor` membuat laporan darurat beserta bukti pendukung agar siap diproses engine routing di Fase 4.

### Scope Fungsional
- `pelapor` dapat membuat laporan baru.
- Form laporan menyesuaikan field metadata berdasarkan `emergency_type`.
- Laporan mendukung lokasi opsional (pin map + koordinat).
- Laporan mendukung upload multi-foto.
- `pelapor` dapat melihat detail dan riwayat laporan miliknya.
- `admin/superadmin/manager` dapat melihat daftar laporan (read-only pada fase ini).

### Status
- DONE: alur pelaporan pelapor lengkap (create, foto, metadata, detail, timeline).

## FASE 4 - Routing & Assignment Engine (DONE)
### Backend
- DONE: service routing rule -> assignment instansi (`RoutingAssignmentEngine`)
- DONE: priority handling awal (`pending` untuk prioritas utama, `queued` untuk prioritas berikutnya)
- DONE: status lifecycle baseline via konstanta + transition map di model `Assignment`
- DONE: penyempurnaan transition workflow dan endpoint operasional instansi
- DONE: triage flow untuk kategori `Lainnya` + klasifikasi admin ke tipe resmi/tipe baru

## FASE 5 - Dashboard Instansi & Verifikasi (DONE)
### Backend
- DONE: API assignment list by instansi
- DONE: update status + upload bukti + kompres gambar upload
- DONE: validasi admin (`resolved_waiting_validation` -> `resolved` / `validation_failed`)
- DONE: guard rails workflow (primary/secondary, cascade reject, rework setelah validation fail)
- DONE: backfill assignment otomatis saat routing rule dibuat setelah klasifikasi laporan

### Frontend
- DONE: task list instansi
- DONE: filter status + detail laporan + metadata + foto
- DONE: panel validasi admin yang menonjol di detail laporan
- DONE: notifikasi dashboard admin untuk antrian validasi dan triage
- DONE: panel klasifikasi laporan `Lainnya` + shortcut create emergency type baru + form builder

## FASE 6+ (Pending)
- Real-time update
- Monitoring manager
- Superadmin tools
- Security hardening
- Deployment dan optimasi
