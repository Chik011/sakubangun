// DATA CONTOH DARI DESAIN FIGMA. Semua harga, stok, ulasan, dan pesanan adalah demo.
const DATA = {
  kategori: ['Semen & Beton', 'Bata & Blok', 'Baja & Besi', 'Cat & Finishing', 'Atap', 'Keramik', 'Plumbing', 'Elektrikal', 'Perkakas', 'Sanitary'],
  produk: [
    { id: 'SMN-001', nama: 'Semen Portland Komposit Tiga Roda 40 kg', kategori: 'Semen & Beton', harga: 64500, satuan: 'sak', stok: 184, rating: 4.9, merek: 'Tiga Roda', berat: 40, label: 'Terlaris', foto: 'assets/catalog-f9e9e.png', fotoHome: 'assets/home-fb260.png', penjual: 'penjual', aktif: true },
    { id: 'BAT-002', nama: 'Bata Ringan AAC Presisi 60 × 20 × 10 cm', kategori: 'Bata & Blok', harga: 12900, satuan: 'buah', stok: 240, rating: 4.8, merek: 'AAC', berat: 8, label: 'Hemat 8%', foto: 'assets/catalog-93de8.png', fotoHome: 'assets/home-255c8.png', penjual: 'penjual', aktif: true },
    { id: 'BBU-010', nama: 'Besi Beton Ulir SNI 10 mm × 12 m', kategori: 'Baja & Besi', harga: 89000, satuan: 'batang', stok: 8, rating: 4.8, merek: 'SNI', berat: 7.4, label: '', foto: 'assets/catalog-000a2.png', fotoHome: 'assets/home-a03cc.png', penjual: 'penjual', aktif: true },
    { id: 'CAT-112', nama: 'Cat Interior Low Odor Soft Linen 5 kg', kategori: 'Cat & Finishing', harga: 178000, satuan: 'pail', stok: 12, rating: 4.7, merek: 'Soft Linen', berat: 5, label: 'Warna baru', foto: 'assets/catalog-b22c0.png', fotoHome: 'assets/home-3d829.png', penjual: 'penjual', aktif: true },
    { id: 'ATB-033', nama: 'Atap UPVC Twinwall Cool Roof 3 m', kategori: 'Atap', harga: 245000, satuan: 'lembar', stok: 64, rating: 4.6, merek: 'Cool Roof', berat: 12, label: '', foto: 'assets/catalog-cba2f.png', fotoHome: 'assets/home-54495.png', penjual: 'penjual', aktif: true },
    { id: 'KRM-605', nama: 'Keramik Teraso Cloud 60 × 60 cm', kategori: 'Keramik', harga: 189500, satuan: 'dus', stok: 86, rating: 4.9, merek: 'Cloud', berat: 18, label: 'Favorit arsitek', foto: 'assets/catalog-56788.png', penjual: 'penjual', aktif: true },
    { id: 'PIP-041', nama: 'Pipa PVC AW 1 inch × 4 m', kategori: 'Plumbing', harga: 72000, satuan: 'batang', stok: 18, rating: 4.7, merek: 'AW', berat: 2, label: '', foto: 'assets/catalog-054b9.png', penjual: 'penjual', aktif: true },
    { id: 'SAN-284', nama: 'Kloset Duduk Dual Flush Elara', kategori: 'Sanitary', harga: 1249000, satuan: 'set', stok: 0, rating: 4.8, merek: 'Elara', berat: 30, label: 'Gratis kirim', foto: 'assets/catalog-427a1.png', penjual: 'penjual', aktif: true }
  ],
  akun: [
    { username: 'user', password: '123', nama: 'Dina Puspita', peran: 'Pembeli', aktif: true, alamat: 'Ciputat Timur, Tangerang Selatan 15412', favorit: [] },
    { username: 'penjual', password: '123', nama: 'Maya — Gudang Ciputat', peran: 'Penjual', aktif: true, alamat: '', favorit: [] },
    { username: 'admin', password: '123', nama: 'Admin SakuBangun', peran: 'Admin', aktif: true, alamat: '', favorit: [] }
  ],
  promo: [ { kode: 'BANGUNHEMAT', persen: 10, maksimum: 250000, minimum: 500000, aktif: true } ],
  inspirasi: [
    { judul: 'Dapur 3×4 m, hangat dan mudah dirawat', kategori: 'Dapur', foto: 'assets/home-c9afd.png', catatan: 'Estimasi material Rp8,7 jt', isi: 'Mulai dari mengukur ruang dan mencatat titik air. Pilih lantai yang mudah dibersihkan, cat tahan lembap, dan sediakan ventilasi. Estimasi pada desain merupakan ilustrasi; buat RAB dengan ukuran serta harga sebenarnya.' },
    { judul: 'Kamar mandi mungil terasa lega', kategori: 'Kamar mandi', foto: 'assets/home-f3a89.png', catatan: 'Daftar belanja lengkap', isi: 'Pilih keramik terang, sanitair berukuran proporsional, serta cermin untuk membantu pencahayaan. Susun kebutuhan keramik, pipa, nat, dan perlengkapan sanitair sebelum membeli.' },
    { judul: 'Warna baru dalam satu akhir pekan', kategori: 'Cat', foto: 'assets/home-03741.png', catatan: 'Panduan 4 langkah', isi: '1. Bersihkan permukaan. 2. Lindungi lantai dan perabot. 3. Gunakan lapisan dasar sesuai petunjuk produk. 4. Aplikasikan cat dan tunggu waktu pengeringan pada label.' }
  ]
};
