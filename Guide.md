📋 Rencana Pengembangan: AI Emergency System

1. Alur Utama Aplikasi (User Journey)
Tahap	Aktor	Proses Teknis
Lapor	Warga	React mengirim koordinat GPS + Pesan/Suara/Foto ke API Laravel.
AnalisisAI (Backend)	Laravel Queue memproses input via Gemini API untuk Triage (Urgensi & Kategori).
BroadcastSystem	Laravel Reverb mengirim sinyal real-time ke Dashboard Dispatcher.
Siren	Dispatcher	React (Frontend Admin) menangkap sinyal dan memutar suara sirine.
Dispatch	Dispatcher	Memilih unit terdekat berdasarkan kalkulasi Geospatial.
Response	Petugas	Menerima notifikasi di aplikasi, navigasi via Leaflet/Google Maps.
First Aid	Warga	Chatbot memberikan instruksi P3K sambil menunggu petugas.
2. Fitur Spesifik & Implementasi Teknis
A. Websocket & Sirine (Laravel Reverb + React)
Logic: Gunakan Private Channel untuk Dispatcher.
Trigger: Saat Report tersimpan di DB, jalankan ReportCreated Event.
React Side: Gunakan useEffect untuk mendengarkan (listen) event tersebut. Jika event diterima, panggil fungsi audio.play() untuk membunyikan sirine.
B. Geospatial & Leaflet.js
Alur: 1. User kirim lat dan lng.2. Laravel melakukan query database menggunakan rumus Haversine (untuk MySQL) atau fungsi ST_Distance (untuk PostgreSQL/PostGIS).3. Cari unit dengan status available dalam radius tertentu (misal: 10km).4. Leaflet: Tampilkan titik user (merah) dan titik unit (hijau) di peta. Gunakan Routing Machine untuk garis jalan.
C. AI Queue & Chatbot Agent
Laravel Queue: Gunakan Redis atau Database driver. Jangan biarkan user menunggu API AI yang lambat.
Implementation Agent: Buat class EmergencyAgent.Jika kategori "Medis" -> Berikan instruksi CPR/P3K.Jika kategori "Kebakaran" -> Berikan jalur evakuasi.Chatbot: Gunakan API streaming agar teks muncul satu per satu (seperti ChatGPT) di UI React.
D. Voice-to-Text Integration
Frontend: Gunakan Web Speech API (bawaan browser) di React untuk mengubah suara user jadi teks secara lokal sebelum dikirim ke Laravel.Backend: Jika ingin lebih akurat, kirim file audio (.wav/.mp3) ke Laravel, lalu gunakan model OpenAI Whisper untuk transkripsi.
3. Struktur Tabel Tambahan (Untuk Chatbot)
Table conversations: id, report_id, message, sender (user/ai), timestamp.
Catatan Kecil: Jangan lupa untuk menambahkan validasi "Laporan Palsu" (Fake Report) di dashboard admin agar sistem tidak mudah di-spam.