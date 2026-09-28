# SakuBangun — HTML, CSS, dan JavaScript Modular

Prototipe marketplace bahan bangunan SakuBangun dari desain Figma **gardaTech / SakuBangun**.
Kode telah **dipisah-pisah** secara modular per halaman/fitur (Beranda, Belanja, Produk, Keranjang, Checkout, Pembayaran, Login, Regis, Profil, Pesanan, Lacak, Favorit, Inspirasi, Promo, dan Dashboard).

---

## 🚀 Cara Membuka

1. Buka folder `sakubangun`.
2. Klik dua kali `index.html` (atau buka dengan VS Code Live Server).
3. Anda dapat langsung berpindah halaman lewat tautan navigasi browser.
4. **Semua sesi dan transaksi tersimpan otomatis di `localStorage` peramban**, sehingga data tidak hilang saat berpindah halaman HTML!

---

## 📁 Struktur Pemisahan File (Modular)

Setiap halaman dan kode kini telah dipisahkan sesuai fungsinya:

### 1. File Halaman HTML
| File | Kegunaan |
| --- | --- |
| `index.html` / `beranda.html` | **Halaman Beranda**: Hero promo, kategori populer, produk pilihan proyek, benefit belanja, dan inspirasi. |
| `belanja.html` | **Katalog Belanja**: Filter produk berdasarkan kategori, batas harga, rating, stok tersedia, serta pengurutan harga/rating. |
| `produk.html` | **Detail Produk**: Foto & galeri, rincian spesifikasi, tab deskripsi & cara pakai, kalkulator kebutuhan semen, tombol beli & tambah tas. |
| `keranjang.html` | **Keranjang Belanja**: Daftar item terpilih, atur jumlah (+/-), hapus item, pasang voucher promo, dan ringkasan biaya. |
| `checkout.html` | **Checkout Pemesanan**: Formulir penerima & alamat proyek, metode pengiriman (Kirim/Ambil Gudang), tanggal & slot waktu, metode bayar simulasi. |
| `pembayaran.html` | **Simulasi Pembayaran**: Konfirmasi pembayaran pesanan demo, rincian transaksi, unduh ringkasan pesanan, dan link pelacakan. |
| `login.html` | **Halaman Masuk**: Formulir login dengan tombol **⚡ Akses Login Cepat (1-Klik Demo)** untuk Pembeli, Penjual, dan Admin. |
| `register.html` / `regis.html` | **Halaman Pendaftaran**: Formulir buat akun baru (nama, username, kata sandi). |
| `profil.html` / `akun.html` | **Profil Akun Pembeli**: Kelola nama dan alamat pengiriman proyek, pintasan pesanan, favorit, voucher, dan riwayat belanja. |
| `pesanan.html` | **Riwayat Pesanan**: Cari pesanan berdasarkan nomor atau produk, filter status pesanan, tombol bayar demo, lacak, atau beli ulang. |
| `lacak.html` | **Pelacakan Pesanan**: Simulasi peta armada, status tahapan pesanan (timeline riwayat), dan detail rincian produk. |
| `favorit.html` | **Produk Tersimpan**: Daftar wishlist material yang ditandai dengan ikon hati. |
| `inspirasi.html` | **Inspirasi Proyek**: Kumpulan ide desain dan tata ruang baru lengkap dengan pop-up detail tips material. |
| `promo.html` | **Voucher & Promo**: Daftar kode promo aktif dengan tombol langsung gunakan kode ke keranjang. |
| `dashboard.html` | **Panel Admin & Penjual**: Pengelolaan katalog produk, stok, pemrosesan pesanan, pengguna, voucher promo, analitik, dan ekspor CSV. |

### 2. File JavaScript & Logika
| File | Kegunaan |
| --- | --- |
| `backend.js` | Adapter data demo yang tersinkronisasi otomatis dengan `localStorage`. Menyimpan akun, produk, pesanan, dan keranjang belanja. |
| `common.js` | Fungsi bersama di seluruh halaman: format rupiah, toast notifikasi, sinkronisasi badge keranjang di navbar, status sesi user, modal bantuan, dan pemuat aset gambar. |
| `data.js` | Data awal untuk kategori, produk, inspirasi, promo, dan akun contoh. |
| `assets.js` | Daftar aset gambar lokal yang tersedia. |
| `js/beranda.js` | Logika interaksi khusus halaman beranda. |
| `js/belanja.js` | Logika filter, pencarian, dan pengurutan katalog belanja. |
| `js/produk.js` | Logika galeri, kalkulator sak semen, dan tambah ke tas. |
| `js/keranjang.js` | Logika keranjang belanja, manipulasi kuantitas item, dan penerapan kupon. |
| `js/checkout.js` | Logika validasi checkout dan pembuatan pesanan baru. |
| `js/pembayaran.js` | Logika simulasi pembayaran dan konfirmasi lunas. |
| `js/login.js` | Logika autentikasi dan tombol 1-klik akses cepat. |
| `js/register.js` | Logika pendaftaran akun demo baru. |
| `js/profil.js` | Logika update profil pengguna dan ringkasan pesanan terakhir. |
| `js/pesanan.js` | Logika pencarian pesanan, filter status, dan pesan ulang (re-order). |
| `js/lacak.js` | Logika pelacakan timeline riwayat status pengiriman. |
| `js/favorit.js` | Logika wishlist produk yang tersimpan. |
| `js/inspirasi.js` | Logika galeri inspirasi proyek dan modal detail ide. |
| `js/promo.js` | Logika salin dan pakai voucher promo. |
| `js/dashboard.js` | Logika panel admin/penjual, kelola stok & produk, ubah status pesanan, dan grafik analitik. |

---

## 🔑 Akun Demo (Password: 123)

| Username | Password | Peran | Akses Demo |
| --- | --- | --- | --- |
| `user` | `123` | Pembeli | Belanja, keranjang, checkout, profil, riwayat pesanan, favorit |
| `penjual` | `123` | Penjual | Dashboard gudang: kelola produk & stok, update status pesanan |
| `admin` | `123` | Admin | Seluruh akses toko, pengawasan pesanan, kelola pengguna & voucher promo |

---

## 💡 Keunggulan Pemisahan Kode

1. **Struktur Bersih & Teratur**: Setiap fitur berada pada file HTML dan JS masing-masing, memudahkan modifikasi dan pemeliharaan kode.
2. **Tidak Saling Tumpang Tindih**: Perubahan kode pada halaman login tidak akan mengganggu halaman beranda maupun checkout.
3. **Data Persisten Antar Halaman**: Penggunaan `localStorage` memastikan keranjang belanja dan status login tetap utuh saat berpindah-pindah halaman `.html`.
