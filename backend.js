/* ADAPTER BACKEND DEMO DENGAN LOCALSTORAGE
   Data disimpan di localStorage peramban sehingga tidak hilang saat berpindah halaman HTML (Beranda, Belanja, Keranjang, Checkout, Profil, dll).
   Refresh atau ganti halaman tetap mempertahankan sesi dan keranjang.
   Dapat direset kapan saja dengan Backend.resetDemo().
*/
const STORAGE_PREFIX = 'sb_demo_';

function muatStorage(kunci, nilaiBawaan) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + kunci);
    if (raw !== null) return JSON.parse(raw);
  } catch (e) {
    console.warn('Gagal memuat ' + kunci + ' dari storage:', e);
  }
  return structuredClone(nilaiBawaan);
}

function simpanStorage(kunci, nilai) {
  try {
    if (nilai === null || nilai === undefined) {
      localStorage.removeItem(STORAGE_PREFIX + kunci);
    } else {
      localStorage.setItem(STORAGE_PREFIX + kunci, JSON.stringify(nilai));
    }
  } catch (e) {
    console.warn('Gagal menyimpan ' + kunci + ' ke storage:', e);
  }
}

const Backend = {
  data: typeof DATA !== 'undefined' ? muatStorage('data', DATA) : { akun: [], produk: [], promo: [], kategori: [], inspirasi: [] },
  sesi: muatStorage('sesi', null),
  pesanan: muatStorage('pesanan', []),
  keranjang: muatStorage('keranjang', {}),

  simpanSemua() {
    simpanStorage('data', this.data);
    simpanStorage('sesi', this.sesi);
    simpanStorage('pesanan', this.pesanan);
    simpanStorage('keranjang', this.keranjang);
  },

  resetDemo() {
    localStorage.removeItem(STORAGE_PREFIX + 'data');
    localStorage.removeItem(STORAGE_PREFIX + 'sesi');
    localStorage.removeItem(STORAGE_PREFIX + 'pesanan');
    localStorage.removeItem(STORAGE_PREFIX + 'keranjang');
    this.data = structuredClone(DATA);
    this.sesi = null;
    this.pesanan = [];
    this.keranjang = {};
  },

  pengguna() {
    return this.data.akun.find(a => a.username === this.sesi && a.aktif) || null;
  },

  wajib(peran) {
    const akun = this.pengguna();
    if (!akun) throw Error('Silakan masuk terlebih dahulu.');
    if (peran && !peran.includes(akun.peran)) throw Error('Akun ini tidak memiliki akses.');
    return akun;
  },

  async masuk(username, password) {
    const akun = this.data.akun.find(a => a.username === username.trim().toLowerCase() && a.password === password && a.aktif);
    if (!akun) throw Error('Username atau kata sandi salah, atau akun tidak aktif.');
    this.sesi = akun.username;
    simpanStorage('sesi', this.sesi);
    return akun;
  },

  async daftar(nama, username, password) {
    username = username.trim().toLowerCase();
    if (!nama.trim() || !/^[a-z0-9_]{3,30}$/.test(username) || password.length < 6) {
      throw Error('Nama wajib diisi. Username 3–30 huruf/angka/garis bawah; password minimal 6 karakter.');
    }
    if (this.data.akun.some(a => a.username === username)) throw Error('Username sudah dipakai.');
    this.data.akun.push({ username, password, nama: nama.trim(), peran: 'Pembeli', aktif: true, alamat: '', favorit: [] });
    simpanStorage('data', this.data);
    return this.masuk(username, password);
  },

  async keluar() {
    this.sesi = null;
    this.keranjang = {};
    simpanStorage('sesi', null);
    simpanStorage('keranjang', {});
  },

  produkPublik() {
    return this.data.produk.filter(p => p.aktif);
  },

  produkMilik() {
    const akun = this.wajib(['Admin', 'Penjual']);
    return this.data.produk.filter(p => akun.peran === 'Admin' || p.penjual === akun.username);
  },

  produk(id) {
    return this.data.produk.find(p => p.id === id);
  },

  tambahTas(id, jumlah = 1) {
    const p = this.produk(id);
    if (!p || !p.aktif) throw Error('Produk tidak tersedia.');
    const total = (this.keranjang[id] || 0) + jumlah;
    if (!Number.isInteger(total) || total < 0 || total > p.stok) throw Error('Jumlah melebihi stok yang tersedia.');
    if (total === 0) delete this.keranjang[id];
    else this.keranjang[id] = total;
    simpanStorage('keranjang', this.keranjang);
  },

  hapusDariTas(id) {
    delete this.keranjang[id];
    simpanStorage('keranjang', this.keranjang);
  },

  ringkasan(kode = '', pengiriman = 'kirim') {
    const item = Object.entries(this.keranjang).map(([id, jumlah]) => ({ ...this.produk(id), jumlah })).filter(p => p.nama);
    const subtotal = item.reduce((total, p) => total + p.harga * p.jumlah, 0);
    let diskon = 0;
    if (kode.trim()) {
      const promo = this.data.promo.find(p => p.kode === kode.toUpperCase().trim() && p.aktif);
      if (!promo) throw Error('Kode promo tidak berlaku.');
      if (subtotal < promo.minimum) throw Error('Minimal belanja promo ' + promo.minimum.toLocaleString('id-ID') + ' rupiah.');
      diskon = Math.min(Math.floor(subtotal * promo.persen / 100), promo.maksimum);
    }
    const ongkir = !subtotal || pengiriman === 'ambil' || subtotal >= 1500000 ? 0 : 85000;
    return { item, subtotal, diskon, ongkir, total: subtotal - diskon + ongkir };
  },

  async buatPesanan(form) {
    const akun = this.wajib(['Pembeli']);
    if (!form.nama.trim() || !form.alamat.trim() || !/^\+?[0-9 -]{8,18}$/.test(form.telepon)) throw Error('Lengkapi nama, nomor telepon, dan alamat contoh.');
    if (!['QRIS', 'Virtual Account', 'Transfer bank'].includes(form.metode)) throw Error('Pilih metode pembayaran.');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const date = new Date(form.tanggal + 'T00:00:00');
    if (!Number.isFinite(date.getTime()) || date < today) throw Error('Pilih jadwal hari ini atau sesudahnya.');
    const nilai = this.ringkasan(form.kode || '', form.pengiriman);
    if (!nilai.item.length) throw Error('Keranjang masih kosong.');
    if (new Set(nilai.item.map(i => i.penjual)).size > 1) throw Error('Demo mendukung satu penjual per pesanan. Pisahkan produk dari penjual lain.');
    for (const item of nilai.item) {
      const produk = this.produk(item.id);
      if (!produk.aktif || produk.stok < item.jumlah) throw Error('Stok ' + item.nama + ' berubah. Periksa keranjang.');
    }
    nilai.item.forEach(item => this.produk(item.id).stok -= item.jumlah);
    const pesanan = {
      id: 'SB-' + Date.now().toString().slice(-9) + '-' + (this.pesanan.length + 1),
      pemilik: akun.username,
      nama: form.nama.trim(),
      alamat: form.alamat.trim(),
      telepon: form.telepon,
      tanggal: form.tanggal,
      slot: form.slot,
      metode: form.metode,
      pengiriman: form.pengiriman,
      ...nilai,
      status: 'Menunggu pembayaran',
      dibuat: new Date().toISOString(),
      riwayat: [{ status: 'Pesanan dibuat', waktu: new Date().toISOString() }]
    };
    this.pesanan.unshift(pesanan);
    this.keranjang = {};
    simpanStorage('data', this.data);
    simpanStorage('pesanan', this.pesanan);
    simpanStorage('keranjang', this.keranjang);
    return pesanan;
  },

  daftarPesanan() {
    const akun = this.wajib();
    return this.pesanan.filter(p => akun.peran === 'Admin' || (akun.peran === 'Penjual' ? p.item.some(i => i.penjual === akun.username) : p.pemilik === akun.username));
  },

  lihatPesanan(id) {
    const pesanan = this.pesanan.find(p => p.id === id);
    if (!pesanan) throw Error('Pesanan tidak ditemukan.');
    const akun = this.pengguna();
    if (!akun) throw Error('Silakan masuk terlebih dahulu.');
    if (akun.peran !== 'Admin' && akun.peran !== 'Penjual' && pesanan.pemilik !== akun.username) {
      throw Error('Anda tidak memiliki akses ke pesanan ini.');
    }
    return pesanan;
  },

  async bayarDemo(id) {
    const akun = this.wajib(['Pembeli']);
    const p = this.lihatPesanan(id);
    if (p.pemilik !== akun.username || p.status !== 'Menunggu pembayaran') throw Error('Pesanan ini tidak menunggu pembayaran.');
    p.status = 'Disiapkan';
    p.riwayat.push({ status: 'Pembayaran simulasi berhasil', waktu: new Date().toISOString() });
    simpanStorage('pesanan', this.pesanan);
    return p;
  },

  async ubahStatus(id, status) {
    this.wajib(['Admin', 'Penjual']);
    const p = this.lihatPesanan(id);
    const langkah = {
      'Disiapkan': ['Siap kirim', 'Dibatalkan'],
      'Siap kirim': ['Dalam perjalanan', 'Dibatalkan'],
      'Dalam perjalanan': ['Terkirim'],
      'Menunggu pembayaran': ['Dibatalkan']
    };
    if (!(langkah[p.status] || []).includes(status)) throw Error('Perubahan status tidak valid.');
    if (status === 'Dibatalkan') p.item.forEach(i => { const barang = this.produk(i.id); if (barang) barang.stok += i.jumlah; });
    p.status = status;
    p.riwayat.push({ status, waktu: new Date().toISOString() });
    simpanStorage('data', this.data);
    simpanStorage('pesanan', this.pesanan);
  },

  async simpanProduk(form) {
    const akun = this.wajib(['Admin', 'Penjual']);
    const lama = form.id ? this.produkMilik().find(p => p.id === form.id) : null;
    if (form.id && !lama) throw Error('Produk tidak dapat diedit.');
    if (!form.nama.trim() || !this.data.kategori.includes(form.kategori) || !Number.isFinite(form.harga) || form.harga <= 0 || !Number.isInteger(form.stok) || form.stok < 0 || !form.satuan.trim()) {
      throw Error('Isi nama, kategori, harga positif, satuan, dan stok bulat minimal 0.');
    }
    if (!form.foto) throw Error('Pilih foto produk.');
    const isi = {
      ...form,
      nama: form.nama.trim(),
      penjual: lama?.penjual || akun.username,
      id: lama?.id || 'PRD-' + Date.now(),
      aktif: true,
      rating: lama?.rating || 0,
      label: lama?.label || '',
      berat: lama?.berat || 1
    };
    if (lama) Object.assign(lama, isi);
    else this.data.produk.push(isi);
    simpanStorage('data', this.data);
    return isi;
  },

  async aktifProduk(id) {
    const p = this.produkMilik().find(p => p.id === id);
    if (!p) throw Error('Produk tidak ditemukan.');
    p.aktif = !p.aktif;
    simpanStorage('data', this.data);
  },

  async ubahAkun(username, peran, aktif) {
    const saya = this.wajib(['Admin']);
    if (username === saya.username) throw Error('Tidak dapat mengubah akun admin yang sedang dipakai.');
    if (!['Pembeli', 'Penjual', 'Admin'].includes(peran)) throw Error('Peran tidak valid.');
    const akun = this.data.akun.find(a => a.username === username);
    if (!akun) throw Error('Akun tidak ditemukan.');
    akun.peran = peran;
    akun.aktif = aktif;
    simpanStorage('data', this.data);
  },

  async simpanPromo(form) {
    this.wajib(['Admin']);
    const kode = form.kode.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,24}$/.test(kode) || !(form.persen > 0 && form.persen <= 100) || !Number.isFinite(form.maksimum) || form.maksimum <= 0 || !Number.isFinite(form.minimum) || form.minimum < 0) {
      throw Error('Periksa kode, diskon 1–100%, minimum, dan maksimum.');
    }
    if (this.data.promo.some(p => p.kode === kode)) throw Error('Kode promo sudah ada.');
    this.data.promo.push({ ...form, kode, aktif: true });
    simpanStorage('data', this.data);
  },

  toggleFavorit(id) {
    const a = this.wajib();
    a.favorit = a.favorit || [];
    if (a.favorit.includes(id)) {
      a.favorit = a.favorit.filter(x => x !== id);
    } else {
      a.favorit.push(id);
    }
    simpanStorage('data', this.data);
    return a.favorit.includes(id);
  }
};
