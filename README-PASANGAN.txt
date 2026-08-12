DASHBOARD BENGKEL STEM AI PPD PETALING UTAMA 2026
=================================================

FAIL DI DALAM PAKEJ
-------------------
1. index.html  - muat naik ke repository GitHub Pages.
2. favicon.svg - muat naik ke folder yang sama dengan index.html.
3. Code.gs     - salin seluruh kandungan ke Google Apps Script.

LANGKAH A — GOOGLE SHEETS
------------------------
Pastikan nama tab berikut tepat (huruf dan jarak mesti sama):

1. Senarai Sekolah
   A: Nama Sekolah
   B: Kod Sekolah
   C: Kategori
   D: Status

2. Pendaftaran
   A: ID
   B: Masa
   C: Nama Penuh
   D: Nombor IC
   E: Emel
   F: Telefon
   G: Nama Sekolah
   H: Kod Sekolah
   I: Jawatan / Panitia
   J: Hari
   K: Status

3. Laporan
   A: ID
   B: Masa
   C: ID Peserta
   D: Hari
   E: Nama Peserta
   F: Sekolah
   G: Ringkasan
   H: Impak
   I: Pautan Evidens
   J: Status

4. Bahan
   A: ID
   B: Tajuk
   C: Kategori
   D: Penerangan
   E: URL
   F: Susunan
   G: Status

Status sekolah dan bahan boleh dikosongkan atau diisi "Aktif".

Sekolah yang telah dijamin tersedia oleh Code.gs:
- BBA8210 — SK Taman Dato Harun (Satu)
- BBA8101 — SK Taman Dato Harun (2)

LANGKAH B — GOOGLE APPS SCRIPT
-----------------------------
1. Buka Extensions > Apps Script daripada Google Sheet.
2. Padam kod lama dan salin semua kandungan Code.gs baharu.
3. Klik Save.
4. Klik Deploy > Manage deployments.
5. Klik ikon pensel pada deployment sedia ada.
6. Pilih New version.
7. Execute as: Me.
8. Who has access: Anyone.
9. Klik Deploy.

Jika URL /exec kekal sama, index.html tidak perlu diubah.
Jika Google memberi URL /exec baharu, cari URL lama dalam index.html dan
gantikan dengan URL deployment baharu.

Ujian sambungan:
Tambah ?action=ping pada hujung URL /exec. Respons yang betul mengandungi:
{"ok":true,"message":"Sambungan Google Sheets aktif."}

LANGKAH C — GITHUB PAGES
------------------------
1. Muat naik index.html dan favicon.svg ke folder utama repository.
2. Jangan muat naik Code.gs ke GitHub jika tidak diperlukan.
3. Tunggu 1 hingga 3 minit.
4. Buka laman dalam Incognito atau tekan Ctrl+Shift+R / Cmd+Shift+R.

FUNGSI YANG DISEDIAKAN
----------------------
- Dashboard dan analisis hanya mengira Ketua Panitia Sains/Matematik.
- Fasilitator/Urus Setia tidak dikira sebagai Ketua Panitia.
- Pendaftaran terus direkod sebagai kehadiran.
- Kod sekolah mengeluarkan nama sekolah secara automatik.
- Sekolah antarabangsa/lain-lain boleh memasukkan nama sendiri.
- Nombor IC pendua tidak boleh didaftarkan dua kali.
- Senarai peserta bagi laporan diambil daripada tab Pendaftaran.
- Bahan dipaparkan automatik daripada tab Bahan.

NOTA KESELAMATAN
----------------
Jangan jadikan Google Sheet boleh dilihat oleh orang awam. Hanya Web App
Apps Script ditetapkan kepada Anyone; Google Sheet kekal milik urus setia.
