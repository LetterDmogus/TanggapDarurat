Untuk tabel user, tambahkan 2 column ini:
1. Tabel `users`

• `role`: Enum ('user', 'responder', 'admin', 'manager', 'super_admin')

• `phone`: Nomor telepon

Tabel baru:

2. Tabel `reports` (Laporan Masuk)
• `id`: Primary Key

• `user_id`: Foreign Key ke `users`

• `description`: Deskripsi kejadian

• `category`: Foreign key ke tabel categories

• `status`: Enum ('pending', 'assigned', 'on_site', 'resolved', 'fake')

• `urgency_level`: Enum ('low', 'medium', 'high', 'critical') - Diisi oleh AI

• `latitude`: Koordinat lintang (Decimal 10,8)

• `longitude`: Koordinat bujur (Decimal 11,8)

• `photo_url`: Path foto kejadian

• `created_at`: Timestamp

3. Tabel `ai_analyses` (Data Agent AI)
• `id`: Primary Key

• `report_id`: Foreign Key ke `reports`

• `summary`: Ringkasan AI untuk dispatcher

• `first_aid_instructions`: Teks panduan P3K

• `youtube_links`: JSON (Berisi daftar URL video bantuan yang relevan)

• `raw_response`: JSON (Data mentah dari API AI)

4. Tabel `emergency_units` (Armada)
• `id`: Primary Key

• `unit_name`: Nama armada (e.g., 'Ambulans 01')

• `type`: Enum ('ambulance', 'fire_truck', 'police_car')

• `status`: Enum ('available', 'busy', 'offline')

• `current_latitude`: Posisi real-time

• `current_longitude`: Posisi real-time

• `user_id`: Foreign Key ke `users` (yang login)

• `location_name`: Nama lokasi

5. Tabel `assignments` (Penugasan)
• `id`: Primary Key

• `report_id`: Foreign Key ke `reports`

• `unit_id`: Foreign Key ke `emergency_units`

• `responder_id`: Foreign Key ke `users` (Role responder)

• `dispatched_at`: Waktu penugasan

• `arrived_at`: Waktu sampai lokasi

• `resolved_at`: Waktu selesai penanganan

6. Tabel `chat_messages` (Chatbot & Komunikasi)
• `id`: Primary Key

• `report_id`: Foreign Key ke `reports`

• `sender_id`: Foreign Key ke `users` (Nullable jika dikirim AI)

• `message`: Isi pesan

• `is_ai`: Boolean (True jika respon dari agent)

• `youtube_metadata`: JSON (Jika AI mengirim preview video)

7. Tabel categories
• `id`: Primary Key

• `name`: Nama kategori

• `icon`: Icon kategori

• `color`: Warna kategori

8. Tabel operational_costs
Menyimpan biaya yang keluar per penugasan.

• `id`: Primary Key

• `assignment_id`: Foreign Key ke `assignments`

• `expense_type`: Enum ('BBM', 'Alat Medis', 'Konsumsi', 'Lainnya')

• `amount`: Jumlah biaya

• `notes`: Catatan

9. Tabel inventory
Stok barang yang ada di gudang pusat atau di dalam unit.

• `id`: Primary Key

• `item_name`: Nama barang

• `unit_price`: Harga satuan

• `stock_quantity`: Jumlah stok

• `description`: Deskripsi barang

10. Tabel inventory_movements
Log keluar masuk barang.

• `id`: Primary Key

• `inventory_id`: Foreign Key ke `inventory`

• `report_id`: Foreign Key ke `reports` (nullable)

• `quantity_change`: Jumlah perubahan (+/-)

• `notes`: Catatan