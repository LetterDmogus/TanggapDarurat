# 🛡️ Project Specification: AI-Emergency Response System

## 1. Project Overview & Tech Stack
Sistem tanggap darurat yang menghubungkan warga dengan responden terdekat secara real-time, dibantu oleh AI Agent untuk klasifikasi laporan dan panduan bantuan pertama.

### **Backend & Real-time**
*   **Framework:** Laravel 11 (PHP 8.3)
*   **Real-time:** Laravel Reverb (Websockets)

### **Frontend & State Management**
*   **Framework:** React (Vite)
*   **Styling:** Tailwind CSS + Shadcn/UI
*   **State Management:** React Query (TanStack)

### **Maps & AI Engine**
*   **Maps:** Leaflet.js
*   **AI Engine:** Groq AI API (Structured and Quick Output)
*   **AI Integration:** Youtube Data API (untuk saran video instruksi)

---

## 2. Role & Menu Structure (RBAC)

| Role | Deskripsi | Menu Utama |
| :--- | :--- | :--- |
| **User (Warga)** | Pelapor darurat | Panic Button, Active Report Tracking, AI First-Aid Chat, History Laporan, Profil Medis. |
| **Responder** | Petugas Lapangan | Dashboard Tugas (Incoming), Peta Navigasi, Update Status (Available/Busy), Laporan Selesai. |
| **Admin** | Dispatcher/Operator | Global Live Map, Validasi Laporan, Assignment Manual, Manajemen User & Responder. |
| **Manager** | Petinggi/Analyst | Heatmap Bencana, Statistik Performa Responder, Laporan Bulanan (PDF Export), Audit Log. |

---

## 3. Fitur Utama & Alur Kerja (Walkthrough)

### **A. The AI Agent Brain (The "Emergency Dispatcher")**
AI tidak hanya pasif, tapi bertindak sebagai Agent.
1.  **Input:** User mengirim teks/suara ("Ada orang pingsan di jalan").
2.  **Processing:** Laravel mengirim ke AI Agent dengan prompt khusus untuk:
    *   Mendeteksi kategori & tingkat urgensi.
    *   Mencari kata kunci untuk video bantuan (misal: "CPR technique").
3.  **YouTube Integration:** Backend memanggil YouTube API mencari video resmi dari channel kesehatan terverifikasi.
4.  **Output:** Chatbot menampilkan teks instruksi + Embed Video YouTube yang relevan secara instan.

### **B. Geospatial & "Finding Nearest"**
1.  Sistem mengambil koordinat `lat`, `lng` dari browser user.
2.  Query database menggunakan **Haversine Formula** untuk mencari `emergency_units` yang `status = available` dalam radius terdekat.
3.  **Leaflet.js** merender rute (Polyline) antara posisi Responder dan posisi User.

### **C. Real-time Siren & Notification**
1.  Saat laporan masuk, Laravel melempar `broadcast(new EmergencyReported($data))` via Reverb.
2.  React Admin menggunakan `window.Echo.private('admin-channel')` untuk mendengarkan.
3.  **Trigger:** Memunculkan modal popup merah berkedip + memainkan audio sirine (`assets/siren.mp3`).

### **D. Admin Page**
1.  Admin dapat melakukan CRUD pada tabel.
2.  Pada setiap halaman CRUD, terdapat sistem soft delete dengan filter dan sidebar

---

## 4. Library & Framework List (Dependencies)

### **Backend (Laravel)**
*   `laravel/reverb`: High-performance websocket.
*   `spatie/laravel-permission`: Untuk mengelola role (Admin, Responder, dll).
*   `groq/groq-php`: Untuk integrasi AI.
*   `barryvdh/laravel-dompdf`: Untuk laporan Manager.

### **Frontend (React)**
*   `leaflet` & `react-leaflet`: Library peta.
*   `lucide-react`: Icon set.
*   `shadcn/ui`: Komponen UI premium (Button, Card, Dialog).
*   `framer-motion`: Untuk animasi sirine dan transisi UI.
*   `react-speech-recognition`: Untuk fitur Voice-to-Text.

---

## 5. Roadmap Pembuatan (Context for AI Agent)

1.  **Phase 1: Database & Auth**
    *   Setup migrations sesuai skema sebelumnya.
    *   Implementasi Role & Permission.
    *   Buat halaman CRUD, Untuk manajemen inventory, operational_costs, categories, emergency_units, users, reports, assignments. Tabel tabel yang memang perlu di kelola.
2.  **Phase 2: Reporting System**
    *   Buat API untuk User mengirim laporan (termasuk upload foto).
3.  **Phase 3: AI Integration**
    *   Hubungkan ke Groq API.
    *   Buat logic "If Category X, then search Youtube Y".
4.  **Phase 4: Real-time Dispatcher**
    *   Setup Laravel Reverb.
    *   Pastikan saat laporan masuk, dashboard Admin berbunyi sirine.
5.  **Phase 5: Responder App**
    *   Buat view untuk responder menerima tugas dan melihat navigasi peta.
6.  **Phase 6: Manager Dashboard**
    *   Buat grafik (Chart.js) dan heatmap lokasi darurat terbanyak.
