🧭 1. Tujuan Aplikasi

Aplikasi kamu adalah:

Sistem distribusi laporan darurat berbasis tipe kejadian dan instansi penanggung jawab

Bukan sekadar aplikasi laporan.

Sistem harus bisa:

menerima berbagai jenis darurat (fisik, sosial, digital)

menentukan instansi tujuan otomatis

memastikan respon terjadi

🧱 2. Konsep inti desain sistem
✔️ Tipe Darurat = pusat sistem

Bukan lokasi.

Karena:

tidak semua kasus punya lokasi

tiap jenis punya cara penanganan berbeda

✔️ Routing Rule menentukan instansi

Sistem melihat:

tipe darurat

aturan routing

baru menentukan instansi tujuan

✔️ Lokasi bersifat opsional

Gunakan:

satu tabel locations

kolom tipe lokasi

metadata JSON untuk data khusus

✔️ Instansi dihubungkan lewat mapping tabel

Bukan API otomatis.

Gunakan:

tabel instansi

tabel relasi tipe darurat → instansi

opsional: mapping wilayah

🎯 Ringkasan satu kalimat proyekmu

Sistem tanggap darurat multi-instansi berbasis tipe kejadian dengan routing otomatis menggunakan pendekatan OOAD dan pengembangan iteratif Scrum.

Catat semua fitur tambahan dibawah ini:
Backlog for agents:
