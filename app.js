// Beberapa aset menunggu ekspor Figma. Sumber asli tetap tercatat pada data-src.
// Sesudah aset disalin dan assets.js diperbarui, gambar tampil otomatis.
function siapkanAset(root = document) {
  root.querySelectorAll('img[data-asset]').forEach(img => {
    const src = img.dataset.asset;
    const tersedia = !src.startsWith('assets/') || ASET_TERSEDIA.includes(src);
    if (tersedia) {
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      img.hidden = false;
      if (img.nextElementSibling?.classList.contains('asset-pending')) img.nextElementSibling.remove();
      return;
    }
    img.hidden = true;
    if (src.endsWith('.png') && !img.nextElementSibling?.classList.contains('asset-pending')) {
      const label = document.createElement('span');
      label.className = img.className + ' asset-pending'; label.textContent = 'Foto menunggu ekspor Figma';
      img.after(label);
    }
  });
}
new MutationObserver(() => siapkanAset()).observe(document.documentElement, { childList: true, subtree: true });
siapkanAset();

/* SAKUBANGUN — INTERAKSI HALAMAN
   HTML berada di index.html, gaya di style.css, data awal di data.js.
   Seluruh perubahan data melalui backend.js agar mudah diganti nanti.
*/
const $ = id => document.getElementById(id);
const uang = nilai => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nilai);
const aman = nilai => String(nilai ?? '').replace(/[&<>"']/g, huruf => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[huruf]));
const tanggal = nilai => new Date(nilai).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
let kodePromo = '';
let daftarMode = false;
let fotoEdit = '';
let timerToast;
let halamanDashboard = 'ringkasan';
let pesananDipilih = '';
let filterProduk = { kategori: '', cari: '', maksimum: '', rating: 0, stok: false };

// 1. BANTUAN UI: toast, dialog, dan navigasi.
function pesan(teks) {
  clearTimeout(timerToast);
  $('toast').textContent = teks;
  $('toast').hidden = false;
  timerToast = setTimeout(() => $('toast').hidden = true, 4500);
}
function info(judul, isi) {
  $('info-title').textContent = judul;
  $('info-body').innerHTML = isi;
  $('info-dialog').showModal();
}
function konfirmasi(teks, aksi) {
  $('confirm-text').textContent = teks;
  $('confirm-yes').onclick = async () => {
    try { await aksi(); $('confirm-dialog').close(); render(); }
    catch (error) { pesan(error.message); }
  };
  $('confirm-dialog').showModal();
}
function ikon(file) { return '<img data-asset="assets/' + file + '" alt="">'; }
function statusPill(status) {
  const warna = ['Terkirim', 'Aktif'].includes(status) ? 'green' : status === 'Dibatalkan' || status === 'Habis' ? 'red' : status === 'Menunggu pembayaran' ? 'yellow' : '';
  return '<span class="pill ' + warna + '">' + aman(status) + '</span>';
}
function kosong(judul, teks, link = '#belanja', tombol = 'Mulai belanja') {
  return '<div class="empty"><h3>' + aman(judul) + '</h3><p>' + aman(teks) + '</p><a class="button" href="' + link + '">' + tombol + '</a></div>';
}
function navigasi(hash) { location.hash = hash; render(); window.scrollTo(0, 0); }
function render() {
  const [tujuanAwal, parameter] = (location.hash.slice(1) || 'beranda').split('/');
  let tujuan = tujuanAwal;
  const terlindung = ['akun', 'pesanan', 'lacak', 'favorit', 'checkout', 'pembayaran', 'dashboard'];
  if (terlindung.includes(tujuan) && !Backend.pengguna()) {
    bukaLogin(); tujuan = 'beranda';
  }
  if (tujuan === 'dashboard' && !['Admin', 'Penjual'].includes(Backend.pengguna()?.peran)) {
    tujuan = 'akun'; pesan('Dashboard hanya untuk admin dan penjual.');
  }
  if (!$(tujuan)?.classList.contains('page')) tujuan = 'beranda';
  document.querySelectorAll('.page').forEach(p => p.hidden = p.id !== tujuan);
  $('store-header').hidden = tujuan === 'dashboard';
  $('store-footer').hidden = tujuan === 'dashboard';
  $('mobile-nav').hidden = tujuan === 'dashboard';
  document.querySelectorAll('.store-nav a').forEach(a => a.classList.toggle('active', a.hash === '#' + tujuan));
  $('cart-count').textContent = Object.values(Backend.keranjang).reduce((a, b) => a + b, 0);
  try {
    if (tujuan === 'beranda') $('home-products').innerHTML = Backend.produkPublik().slice(0, 5).map(p => kartuProduk(p, true)).join('');
    if (tujuan === 'belanja') tampilKatalog();
    if (tujuan === 'produk') tampilDetail(parameter);
    if (tujuan === 'keranjang') tampilKeranjang();
    if (tujuan === 'checkout') tampilCheckout();
    if (tujuan === 'akun') tampilAkun();
    if (tujuan === 'pesanan') tampilPesanan();
    if (tujuan === 'pembayaran') tampilPembayaran(parameter || pesananDipilih);
    if (tujuan === 'lacak') tampilLacak(parameter);
    if (tujuan === 'favorit') tampilFavorit();
    if (tujuan === 'promo') tampilPromo();
    if (tujuan === 'dashboard') { halamanDashboard = parameter || 'ringkasan'; tampilDashboard(); }
  } catch (error) {
    pesan(error.message);
    if (tujuan === 'lacak' || tujuan === 'pembayaran') $(tujuan === 'lacak' ? 'tracking-content' : 'payment-content').innerHTML = kosong('Pesanan tidak tersedia', error.message, '#pesanan', 'Lihat pesanan');
  }
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

// 2. KARTU PRODUK, PENCARIAN, DAN DETAIL.
function kartuProduk(p, beranda = false) {
  const favorit = Backend.pengguna()?.favorit.includes(p.id);
  return `<article class="product-card">
    <div class="product-media"><a href="#produk/${aman(p.id)}"><img class="product-photo" data-asset="${aman(beranda ? p.fotoHome || p.foto : p.foto)}" alt="${aman(p.nama)}" loading="lazy"></a>
    ${p.label ? '<span class="pill">' + aman(p.label) + '</span>' : ''}
    <button class="favorite ${favorit ? 'selected' : ''}" data-favorite="${aman(p.id)}" aria-label="Simpan ${aman(p.nama)}" aria-pressed="${!!favorit}">${ikon('home-15923.svg')}<span aria-hidden="true">♡</span></button></div>
    <div class="product-meta"><span>${aman(p.kategori.toUpperCase())}</span><span>★ ${p.rating || 'Baru'}</span></div>
    <a href="#produk/${aman(p.id)}"><h3>${aman(p.nama)}</h3></a><strong class="product-price">${uang(p.harga)} <small>/${aman(p.satuan)}</small></strong>
    <button class="button pale" data-add="${aman(p.id)}" ${p.stok ? '' : 'disabled'}>${ikon('home-ad1e5.svg')} ${p.stok ? 'Tambah' : 'Stok habis'}</button>
  </article>`;
}
function tampilKatalog() {
  let produk = Backend.produkPublik().filter(p =>
    (!filterProduk.kategori || p.kategori === filterProduk.kategori) &&
    (!filterProduk.cari || (p.nama + p.merek).toLowerCase().includes(filterProduk.cari.toLowerCase())) &&
    (!filterProduk.maksimum || p.harga <= Number(filterProduk.maksimum)) &&
    p.rating >= Number(filterProduk.rating) && (!filterProduk.stok || p.stok > 0)
  );
  if ($('sort').value === 'low') produk.sort((a, b) => a.harga - b.harga);
  if ($('sort').value === 'high') produk.sort((a, b) => b.harga - a.harga);
  if ($('sort').value === 'rating') produk.sort((a, b) => b.rating - a.rating);
  $('catalog-count').textContent = produk.length + ' produk contoh ditemukan';
  $('catalog-products').innerHTML = produk.map(p => kartuProduk(p)).join('');
  $('catalog-empty').hidden = produk.length > 0;
  $('filter-category').value = filterProduk.kategori;
  $('catalog-search').value = filterProduk.cari;
}
function tampilDetail(id) {
  const p = Backend.produkPublik().find(p => p.id === id);
  if (!p) { $('product-detail').innerHTML = kosong('Produk tidak tersedia', 'Produk mungkin dinonaktifkan oleh penjual.'); return; }
  const semen = p.id === 'SMN-001';
  const foto = semen ? 'assets/detail-d6231.png' : p.foto;
  const thumbs = semen ? ['detail-80eaf.png', 'detail-87eef.png', 'detail-e9376.png', 'detail-efba0.png'] : [];
  $('product-detail').innerHTML = `
    <p class="breadcrumb"><a href="#beranda">Beranda</a> / <a href="#belanja">${aman(p.kategori)}</a> / ${aman(p.nama)}</p>
    <div class="product-hero"><div class="product-gallery">${semen ? '<div class="thumbnails">' + thumbs.map((f, i) => `<button data-gallery="assets/${f}" aria-label="Lihat foto produk ${i + 1}"><img data-asset="assets/${f}" alt="Sudut foto ${i + 1}"></button>`).join('') + '</div>' : ''}<div class="product-main-image"><img id="detail-image" data-asset="${aman(foto)}" alt="${aman(p.nama)}"><span class="pill yellow">${aman(p.label || 'PILIHAN PROYEK')}</span></div></div>
    <div class="product-description"><span class="pill">${aman(p.kategori)}</span><h1>${aman(p.nama)}</h1><div class="actions"><span class="stars">★ ${p.rating || 'Belum ada ulasan'} · ulasan contoh</span><small>SKU ${aman(p.id)}</small><span class="pill green">Stok ${p.stok} ${aman(p.satuan)}</span></div><div class="detail-price">${uang(p.harga)} <small>/${aman(p.satuan)}</small></div><p class="note">Harga dan spesifikasi merupakan data contoh dari desain.</p><div class="actions"><label>Jumlah<div class="quantity"><button type="button" data-detail-qty="-1">−</button><input id="detail-quantity" type="number" min="1" max="${p.stok}" value="1" aria-label="Jumlah produk"><button type="button" data-detail-qty="1">+</button></div></label></div><div class="actions"><button class="button" data-detail-add="${aman(p.id)}" ${p.stok ? '' : 'disabled'}>${ikon('detail-7dce5.svg')} Tambah ke keranjang</button><button class="button white" data-buy="${aman(p.id)}" ${p.stok ? '' : 'disabled'}>Beli sekarang</button></div><div class="delivery-box"><h3>Estimasi ke lokasi proyek</h3><p>Pengiriman demo Rp85.000 atau gratis untuk belanja minimal Rp1.500.000. Pilih tanggal saat checkout.</p></div></div></div>
    <div class="detail-lower"><div><div class="spec-tabs"><button class="active" data-tab="spec">Spesifikasi</button><button data-tab="desc">Deskripsi</button><button data-tab="use">Cara pakai</button></div><div id="spec-panel" class="card"><div class="spec-row"><span>Merek</span><span>${aman(p.merek || 'Belum ditentukan')}</span></div><div class="spec-row"><span>Satuan</span><span>${aman(p.satuan)}</span></div><div class="spec-row"><span>Berat contoh</span><span>${p.berat} kg</span></div><div class="spec-row"><span>Penjual</span><span>${aman(p.penjual)}</span></div><p class="note">Konfirmasi spesifikasi resmi pada kemasan sebelum pembelian nyata.</p></div><div id="desc-panel" class="card" hidden><p>${semen ? 'Semen serbaguna untuk pekerjaan pasangan bata, plester, acian, dan beton umum. Simpan di tempat kering.' : aman(p.nama) + ' untuk melengkapi kebutuhan proyek. Detail teknis perlu disesuaikan dengan data resmi produsen.'}</p></div><div id="use-panel" class="card" hidden><p>Ikuti instruksi pada kemasan, gunakan alat pelindung yang sesuai, dan konsultasikan kebutuhan struktural dengan tenaga ahli.</p></div></div>
    ${semen ? `<aside class="card calculator">${ikon('detail-7e038.svg')}<h3>Butuh berapa sak?</h3><p>Estimasi ilustratif plester dinding.</p><form id="calculator-form"><label>Luas (m²)<input id="calc-area" type="number" min="1" max="10000" value="48" required></label><p id="calc-result">Perkiraan 12–14 sak</p><button class="button" type="submit">Hitung estimasi</button><button class="button white" type="button" id="calc-add">Tambah estimasi ke tas</button></form><small>Asumsi demo 0,29 sak/m². Kebutuhan nyata bergantung ketebalan dan campuran.</small></aside>` : '<aside class="card"><h3>Butuh bantuan memilih?</h3><p>Catat ukuran, kebutuhan, dan satuan material untuk proyek Anda.</p><button class="button pale" data-help="Konsultasi proyek">Buka panduan</button></aside>'}</div>
    <section><h2>Ulasan pelanggan</h2><p class="note">Contoh ulasan dari desain, bukan ulasan terverifikasi.</p><div class="testimonials related">${['Datang kering, segel utuh. Kurir konfirmasi sebelum bongkar.', 'Pengiriman sesuai slot. Jumlah barang sesuai pesanan.', 'Tim membantu menjelaskan satuan dan estimasi kebutuhan.'].map((t, i) => `<article class="card"><span class="stars">★ ${[5, 4.8, 4.7][i]}</span><p>${t}</p><small>${['Fajar · Tangerang', 'Raka · Depok', 'Mita · Jakarta'][i]}</small></article>`).join('')}</div></section><section class="related"><h2>Sering dibeli bersama</h2><div class="product-grid four related">${Backend.produkPublik().filter(x => x.id !== p.id).slice(0, 4).map(x => kartuProduk(x)).join('')}</div></section>`;
}

// 3. KERANJANG, CHECKOUT, DAN PEMBAYARAN DEMO.
function ringkasanHTML(nilai) {
  return `<div class="summary-row"><span>Subtotal</span><strong>${uang(nilai.subtotal)}</strong></div><div class="summary-row"><span>Estimasi pengiriman</span><strong>${uang(nilai.ongkir)}</strong></div><div class="summary-row"><span>Diskon</span><strong>−${uang(nilai.diskon)}</strong></div><div class="summary-row summary-total"><span>Total</span><strong>${uang(nilai.total)}</strong></div>`;
}
function nilaiKeranjang(pengiriman = 'kirim') {
  try { return Backend.ringkasan(kodePromo, pengiriman); }
  catch (error) { kodePromo = ''; pesan(error.message); return Backend.ringkasan('', pengiriman); }
}
function tampilKeranjang() {
  const nilai = nilaiKeranjang();
  $('cart-list').innerHTML = nilai.item.length ? nilai.item.map(p => `<div class="cart-item"><img data-asset="${aman(p.foto)}" alt="${aman(p.nama)}"><div class="item-copy"><h3>${aman(p.nama)}</h3><p>${uang(p.harga)} /${aman(p.satuan)}</p><div class="quantity"><button data-qty="${p.id}" data-delta="-1" aria-label="Kurangi ${aman(p.nama)}">−</button><span>${p.jumlah}</span><button data-qty="${p.id}" data-delta="1" aria-label="Tambah ${aman(p.nama)}">+</button></div><button class="text-button" data-remove="${p.id}">Hapus</button></div><strong>${uang(p.harga * p.jumlah)}</strong></div>`).join('') : kosong('Keranjang masih kosong', 'Pilih material untuk mulai proyekmu.');
  $('cart-summary').innerHTML = ringkasanHTML(nilai);
  $('cart-coupon').value = kodePromo;
}
function tampilCheckout() {
  if (Backend.pengguna().peran !== 'Pembeli') { navigasi('keranjang'); pesan('Masuk sebagai user/pembeli untuk checkout.'); return; }
  const nilai = nilaiKeranjang($('shipping-method').value);
  if (!nilai.item.length) { navigasi('keranjang'); pesan('Tambahkan produk sebelum checkout.'); return; }
  const form = $('checkout-form');
  form.elements.nama.value ||= Backend.pengguna().nama;
  form.elements.alamat.value ||= Backend.pengguna().alamat;
  const today = new Date();
  const lokal = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  $('delivery-date').min = lokal;
  $('delivery-date').value ||= lokal;
  $('checkout-summary').innerHTML = ringkasanHTML(nilai);
}
function tampilPembayaran(id) {
  const p = Backend.lihatPesanan(id);
  const lunas = !['Menunggu pembayaran', 'Dibatalkan'].includes(p.status);
  $('payment-content').innerHTML = `<section class="card success-card"><div class="success-icon">${lunas ? '✓' : '◷'}</div><span class="pill ${lunas ? 'green' : ''}">${lunas ? 'PEMBAYARAN SIMULASI BERHASIL' : 'PESANAN DEMO DIBUAT'}</span><h1>${lunas ? 'Pesananmu sudah kami terima!' : 'Lanjutkan simulasi pembayaran'}</h1><p>Tidak ada uang yang ditagih atau dikirim. Ini bukan bukti pembayaran nyata.</p><div class="summary-row"><span>Nomor pesanan</span><strong>${aman(p.id)}</strong></div><div class="summary-row"><span>Total demo</span><strong>${uang(p.total)}</strong></div><div class="summary-row"><span>Metode</span><strong>${aman(p.metode)}</strong></div><div class="actions">${!lunas && p.status !== 'Dibatalkan' ? `<button class="button" data-pay="${p.id}">Simulasikan pembayaran berhasil</button>` : ''}<a class="button ${lunas ? '' : 'white'}" href="#lacak/${p.id}">Lacak pesanan</a><button class="button white" data-receipt="${p.id}">Unduh ringkasan demo</button></div></section><div class="card related"><h3>Yang terjadi selanjutnya</h3><ol class="timeline"><li><p>Pembayaran simulasi</p><small>Konfirmasi menggunakan tombol pada halaman ini.</small></li><li><p>Pesanan disiapkan</p><small>Penjual mengubah status dari dashboard.</small></li><li><p>Dikirim ke proyek</p><small>${aman(p.tanggal)} · ${aman(p.slot)}</small></li></ol></div>`;
}
function kartuPesanan(p) {
  const pertama = p.item[0];
  return `<article class="card order-card"><div class="order-top"><div><strong>${aman(p.id)}</strong><small>${tanggal(p.dibuat)}</small></div>${statusPill(p.status)}</div><div class="order-body"><img data-asset="${aman(pertama.foto)}" alt="${aman(pertama.nama)}"><div><h3>${aman(pertama.nama)} ${p.item.length > 1 ? '+ ' + (p.item.length - 1) + ' produk lain' : ''}</h3><small>Total</small><strong>${uang(p.total)}</strong></div><div class="actions">${p.status === 'Menunggu pembayaran' ? `<a class="button" href="#pembayaran/${p.id}">Bayar demo</a>` : ''}<a class="button white" href="#lacak/${p.id}">Lihat detail</a>${p.status === 'Terkirim' ? `<button class="button pale" data-reorder="${p.id}">Beli lagi</button>` : ''}</div></div></article>`;
}
function tampilPesanan() {
  const query = $('order-search').value.toLowerCase();
  const status = $('order-status').value;
  const pesanan = Backend.daftarPesanan().filter(p => (!status || p.status === status) && (p.id + p.item.map(i => i.nama).join(' ')).toLowerCase().includes(query));
  $('orders-list').innerHTML = pesanan.length ? pesanan.map(kartuPesanan).join('') : kosong('Belum ada pesanan yang cocok', 'Pesanan yang dibuat melalui checkout akan muncul di sini.');
}
function tampilLacak(id) {
  const p = Backend.lihatPesanan(id);
  $('tracking-content').innerHTML = `<p class="breadcrumb"><a href="#pesanan">Pesanan</a> / ${aman(p.id)}</p><div class="tracking-status">${statusPill(p.status)}<h2>${aman(p.id)} · ${aman(p.nama)}</h2><p>Jadwal demo ${aman(p.tanggal)}, ${aman(p.slot)}</p></div><div class="two-column"><div><div class="tracking-map"><div><h2>Pelacakan status pesanan</h2><p>Lokasi GPS belum terhubung. Status di bawah mengikuti pembaruan penjual atau admin.</p></div></div><div class="card related"><h3>Perjalanan pesanan</h3><ol class="timeline">${p.riwayat.map(r => `<li><p>${aman(r.status)}</p><small>${tanggal(r.waktu)}</small></li>`).join('')}</ol></div></div><aside class="card"><h3>Detail pengiriman</h3><p>${aman(p.nama)}<br>${aman(p.alamat)}<br>${aman(p.telepon)}</p><h3 class="related">Ringkasan produk</h3>${p.item.map(i => `<div class="summary-row"><span>${aman(i.nama)} × ${i.jumlah}</span><strong>${uang(i.harga * i.jumlah)}</strong></div>`).join('')}${ringkasanHTML(p)}<button class="button full" data-receipt="${p.id}">Unduh ringkasan demo</button></aside></div>`;
}

// 4. AKUN, FAVORIT, DAN PROMO.
function bukaLogin() {
  daftarMode = false; aturLogin();
  if (!$('auth-dialog').open) $('auth-dialog').showModal();
}
function aturLogin() {
  $('auth-title').textContent = daftarMode ? 'Mulai proyek pertamamu.' : 'Selamat datang kembali.';
  $('register-name-label').hidden = !daftarMode;
  $('register-name').required = daftarMode;
  $('auth-submit').textContent = daftarMode ? 'Daftar akun demo' : 'Masuk';
  $('auth-switch').textContent = daftarMode ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar';
  $('password').autocomplete = daftarMode ? 'new-password' : 'current-password';
  $('password').minLength = daftarMode ? 6 : 1;
  $('auth-error').textContent = '';
}
function tampilAkun() {
  const a = Backend.wajib();
  if (a.peran !== 'Pembeli') { navigasi('dashboard/ringkasan'); return; }
  $('greeting').textContent = 'Hai, ' + a.nama + '!';
  $('profile-name').textContent = a.nama;
  $('profile-role').textContent = a.peran + ' · Akun demo';
  $('profile-input').value = a.nama;
  $('profile-address').value = a.alamat;
  const orders = Backend.daftarPesanan().slice(0, 2);
  $('recent-orders').innerHTML = orders.length ? orders.map(kartuPesanan).join('') : '<p>Belum ada pesanan. Mulai dari katalog.</p>';
}
function tampilFavorit() {
  const a = Backend.wajib();
  const produk = Backend.produkPublik().filter(p => a.favorit.includes(p.id));
  $('favorites-list').innerHTML = produk.length ? produk.map(p => kartuProduk(p)).join('') : kosong('Belum ada produk tersimpan', 'Tekan ikon hati pada produk yang kamu suka.');
}
function tampilPromo() {
  $('promo-list').innerHTML = Backend.data.promo.filter(p => p.aktif).map(p => `<article class="card"><span class="pill green">PROMO DEMO</span><h2>${aman(p.kode)}</h2><p>Diskon ${p.persen}% hingga ${uang(p.maksimum)}.</p><p>Minimal belanja ${uang(p.minimum)}.</p><button class="button related" data-coupon="${aman(p.kode)}">Gunakan kode</button></article>`).join('') || '<p>Belum ada promo aktif.</p>';
}

// 5. DASHBOARD: DATA NYATA DARI SESI DEMO, BUKAN ANGKA PALSU.
const menuDashboard = [
  ['ringkasan', 'Ringkasan', 'admin-63a64.svg'], ['produk', 'Produk & Stok', 'admin-2dbd5.svg'],
  ['pesanan', 'Pesanan', 'admin-a807e.svg'], ['pengiriman', 'Pengiriman', 'admin-2689e.svg'],
  ['pelanggan', 'Pelanggan', 'admin-4be0c.svg'], ['promosi', 'Promosi', 'admin-8d734.svg'], ['analitik', 'Analitik', 'admin-387f6.svg']
];
function stat(nilai, judul, icon, color = 'green') {
  return `<article class="card stat-card"><div><span class="soft ${color}">${ikon(icon)}</span><span class="pill ${color}">Sesi demo</span></div><strong>${nilai}</strong><small>${judul}</small></article>`;
}
function tabelPesanan(daftar, kelola = false) {
  if (!daftar.length) return kosong('Belum ada pesanan', 'Buat pesanan melalui akun user, bayar secara simulasi, lalu masuk kembali sebagai penjual atau admin.', '#beranda', 'Buka toko');
  return `<div class="table-wrap"><table><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>${kelola ? 'Tindakan' : 'Detail'}</th></tr></thead><tbody>${daftar.map(p => `<tr><td><strong>${aman(p.id)}</strong><small>${aman(p.tanggal)}</small></td><td>${aman(p.nama)}</td><td>${uang(p.total)}</td><td>${statusPill(p.status)}</td><td>${kelola ? statusKontrol(p) : `<a class="text-button" href="#lacak/${p.id}">Lihat →</a>`}</td></tr>`).join('')}</tbody></table></div>`;
}
function statusKontrol(p) {
  const opsi = { 'Menunggu pembayaran': ['Dibatalkan'], Disiapkan: ['Siap kirim', 'Dibatalkan'], 'Siap kirim': ['Dalam perjalanan', 'Dibatalkan'], 'Dalam perjalanan': ['Terkirim'] };
  return `<div class="actions"><a class="text-button" href="#lacak/${p.id}">Detail</a>${opsi[p.status] ? `<select class="status-select" data-order-update="${p.id}" aria-label="Ubah status ${p.id}"><option value="">Ubah status...</option>${opsi[p.status].map(s => `<option>${s}</option>`).join('')}</select>` : ''}</div>`;
}
function tampilDashboard() {
  const a = Backend.wajib(['Admin', 'Penjual']);
  if (!menuDashboard.some(m => m[0] === halamanDashboard)) halamanDashboard = 'ringkasan';
  if (a.peran === 'Penjual' && ['pelanggan', 'promosi'].includes(halamanDashboard)) halamanDashboard = 'ringkasan';
  $('dashboard-role').textContent = a.peran.toUpperCase() + ' · DEMO';
  $('dashboard-nav').innerHTML = menuDashboard.filter(m => a.peran === 'Admin' || !['pelanggan', 'promosi'].includes(m[0])).map(m => `<a class="${m[0] === halamanDashboard ? 'active' : ''}" href="#dashboard/${m[0]}">${ikon(m[2])}${m[1]}</a>`).join('');
  $('dashboard-title').textContent = menuDashboard.find(m => m[0] === halamanDashboard)[1];
  const produk = Backend.produkMilik();
  const orders = Backend.daftarPesanan();
  const lunas = orders.filter(p => !['Dibatalkan', 'Menunggu pembayaran'].includes(p.status));
  const pendapatan = lunas.reduce((s, p) => s + p.total, 0);
  const stats = '<div class="stats">' + stat(uang(pendapatan), 'Penjualan simulasi', 'admin-a5796.svg') + stat(orders.length, 'Pesanan demo', 'admin-3c81d.svg', 'blue') + stat(produk.length, 'Produk dikelola', 'admin-93e95.svg', 'lilac') + stat(produk.filter(p => p.stok < 20).length, 'Stok perlu perhatian', 'admin-2613c.svg', 'peach') + '</div>';
  const konten = $('dashboard-content');
  if (['ringkasan', 'analitik'].includes(halamanDashboard)) {
    const perKategori = DATA.kategori.map(k => ({ nama: k, nilai: lunas.reduce((s, p) => s + p.item.filter(i => i.kategori === k).reduce((n, i) => n + i.harga * i.jumlah, 0), 0) })).filter(k => k.nilai > 0);
    const maks = Math.max(1, ...perKategori.map(k => k.nilai));
    const bars = Array.from({ length: 7 }, (_, i) => { const date = new Date(); date.setDate(date.getDate() - 6 + i); const nilai = lunas.filter(p => new Date(p.dibuat).toDateString() === date.toDateString()).reduce((s, p) => s + p.total, 0); return { label: date.toLocaleDateString('id-ID', { weekday: 'short' }), nilai }; });
    const maxBar = Math.max(1, ...bars.map(b => b.nilai));
    konten.innerHTML = `<div class="dashboard-banner"><div><h2>Halo, ${aman(a.nama)}! Kelola toko dari sini.</h2><p>${orders.filter(p => p.status === 'Disiapkan').length} pesanan perlu diproses, ${produk.filter(p => p.stok < 20).length} stok perlu perhatian.</p></div><div class="actions"><a class="button" href="#dashboard/pesanan">Proses pesanan</a><button class="button white" data-product-new>＋ Tambah produk</button></div></div>${stats}<div class="dashboard-grid"><section class="card"><div class="section-title"><h3>Tren penjualan</h3><span class="pill">7 hari terakhir</span></div><h2>${uang(pendapatan)}</h2><small>Transaksi simulasi pada sesi ini</small><div class="bar-chart" role="img" aria-label="Grafik penjualan 7 hari: ${aman(bars.map(b => b.label + ' ' + uang(b.nilai)).join(', '))}">${bars.map(b => `<div class="bar-column"><div style="height:${Math.max(1, b.nilai / maxBar * 160)}px" title="${uang(b.nilai)}"></div><small>${b.label}</small></div>`).join('')}</div></section><section class="card category-performance"><h3>Kinerja kategori</h3>${perKategori.length ? perKategori.map(k => `<div><div class="summary-row"><strong>${aman(k.nama)}</strong><span>${uang(k.nilai)}</span></div><div class="meter"><span style="width:${k.nilai / maks * 100}%"></span></div></div>`).join('') : '<p>Belum ada penjualan simulasi. Grafik akan terisi setelah pembeli mengonfirmasi pembayaran demo.</p>'}</section></div><div class="dashboard-grid"><section class="card"><div class="section-title"><h3>Pesanan terbaru</h3><a href="#dashboard/pesanan">Semua pesanan →</a></div>${tabelPesanan(orders.slice(0, 5))}</section><section class="card"><div class="section-title"><h3>Peringatan stok</h3><a href="#dashboard/produk">Kelola →</a></div>${produk.filter(p => p.stok < 20).map(p => `<div class="stock-alert">${ikon('admin-896e6.svg')}<div><strong>${aman(p.nama)}</strong><small>${p.stok} ${aman(p.satuan)} tersisa</small></div>${statusPill(p.stok ? 'Rendah' : 'Habis')}</div>`).join('') || '<p>Stok dalam kondisi baik.</p>'}</section></div><div class="dashboard-bottom">${['Menunggu pembayaran', 'Disiapkan', 'Dalam perjalanan', 'Terkirim'].map(s => `<div><strong>${orders.filter(p => p.status === s).length}</strong><small>${s}</small></div>`).join('')}</div>`;
  }
  if (halamanDashboard === 'produk') {
    konten.innerHTML = `${stats}<div class="inventory-tools"><input id="inventory-search" placeholder="Cari nama, SKU, atau merek..." aria-label="Cari inventori"><select id="inventory-stock" aria-label="Filter stok"><option value="">Semua stok</option><option value="low">Stok rendah</option><option value="empty">Habis</option></select><button class="button" data-product-new>＋ Tambah produk</button></div><section class="card"><h3>Daftar produk</h3><div id="inventory-table"></div></section>`;
    tampilInventori();
  }
  if (['pesanan', 'pengiriman'].includes(halamanDashboard)) {
    konten.innerHTML = `<div class="catalog-toolbar"><input id="admin-order-search" placeholder="Cari pesanan atau pelanggan..." aria-label="Cari pesanan"><select id="admin-order-status" aria-label="Filter status"><option value="">Semua status</option>${['Menunggu pembayaran', 'Disiapkan', 'Siap kirim', 'Dalam perjalanan', 'Terkirim', 'Dibatalkan'].map(s => '<option>' + s + '</option>').join('')}</select></div><section class="card"><h3>${halamanDashboard === 'pengiriman' ? 'Kelola pengiriman' : 'Daftar pesanan'}</h3><div id="admin-orders-table"></div></section>`;
    tampilOrderAdmin();
  }
  if (halamanDashboard === 'pelanggan') {
    konten.innerHTML = `<div class="notice">Akun baru terdaftar sebagai Pembeli. Admin dapat mengubah peran atau menonaktifkan akun demo lain.</div><section class="card related"><h3>Pengguna & penjual</h3><div class="table-wrap"><table><thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${Backend.data.akun.map(u => `<tr><td>${aman(u.nama)}</td><td>${aman(u.username)}</td><td><select class="customer-select" id="role-${aman(u.username)}" ${u.username === a.username ? 'disabled' : ''}>${['Pembeli', 'Penjual', 'Admin'].map(r => `<option ${u.peran === r ? 'selected' : ''}>${r}</option>`).join('')}</select></td><td><label class="check"><input type="checkbox" id="active-${aman(u.username)}" ${u.aktif ? 'checked' : ''} ${u.username === a.username ? 'disabled' : ''}>Aktif</label></td><td><button class="button pale small" data-user-save="${aman(u.username)}" ${u.username === a.username ? 'disabled' : ''}>Simpan</button></td></tr>`).join('')}</tbody></table></div></section>`;
  }
  if (halamanDashboard === 'promosi') {
    konten.innerHTML = `<div class="section-title"><div><h2>Promosi toko</h2><p>Promo aktif dapat dipakai pada keranjang.</p></div><button class="button" id="new-promo">Buat promosi</button></div><div class="shortcut-grid">${Backend.data.promo.map(p => `<article class="card">${statusPill(p.aktif ? 'Aktif' : 'Nonaktif')}<h2>${aman(p.kode)}</h2><p>${p.persen}% hingga ${uang(p.maksimum)}</p><p>Minimal ${uang(p.minimum)}</p><button class="button white related" data-promo-toggle="${aman(p.kode)}">${p.aktif ? 'Nonaktifkan' : 'Aktifkan'}</button></article>`).join('')}</div>`;
  }
}
function tampilInventori() {
  const q = $('inventory-search').value.toLowerCase();
  const status = $('inventory-stock').value;
  const produk = Backend.produkMilik().filter(p => (p.nama + p.id + p.merek).toLowerCase().includes(q) && (!status || (status === 'low' ? p.stok > 0 && p.stok < 20 : p.stok === 0)));
  $('inventory-table').innerHTML = produk.length ? `<div class="table-wrap"><table><thead><tr><th>Produk / SKU</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${produk.map(p => `<tr><td><div class="table-product"><img data-asset="${aman(p.foto)}" alt=""><div><strong>${aman(p.nama)}</strong><small>${aman(p.id)}</small></div></div></td><td>${aman(p.kategori)}</td><td>${uang(p.harga)}</td><td>${p.stok} ${aman(p.satuan)}</td><td>${statusPill(!p.aktif ? 'Nonaktif' : p.stok === 0 ? 'Habis' : p.stok < 20 ? 'Rendah' : 'Aktif')}</td><td><div class="actions"><button class="button pale small" data-product-edit="${aman(p.id)}">Edit</button><button class="button white small" data-product-toggle="${aman(p.id)}">${p.aktif ? 'Arsipkan' : 'Aktifkan'}</button></div></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Tidak ada produk yang cocok.</p>';
}
function tampilOrderAdmin() {
  const q = $('admin-order-search').value.toLowerCase();
  const status = $('admin-order-status').value;
  const list = Backend.daftarPesanan().filter(p => (p.id + p.nama).toLowerCase().includes(q) && (!status || status === p.status));
  $('admin-orders-table').innerHTML = tabelPesanan(list, true);
}
function bukaProdukForm(id = '') {
  Backend.wajib(['Admin', 'Penjual']);
  const p = id ? Backend.produkMilik().find(p => p.id === id) : null;
  if (id && !p) throw Error('Produk tidak ditemukan.');
  $('product-form').reset(); $('product-error').textContent = '';
  $('edit-product-title').textContent = p ? 'Edit produk & stok' : 'Tambah produk';
  $('edit-id').value = p?.id || '';
  $('edit-name').value = p?.nama || '';
  $('edit-category').value = p?.kategori || DATA.kategori[0];
  $('edit-brand').value = p?.merek || '';
  $('edit-price').value = p?.harga || '';
  $('edit-unit').value = p?.satuan || 'buah';
  $('edit-stock').value = p?.stok ?? 0;
  fotoEdit = p?.foto || '';
  $('edit-preview').hidden = !fotoEdit;
  if (fotoEdit) { $('edit-preview').dataset.asset = fotoEdit; siapkanAset(); }
  $('product-dialog').showModal();
}

// 6. AKSI KLIK DARI KOMPONEN DINAMIS.
document.addEventListener('click', async event => {
  const b = event.target.closest('button, a');
  if (!b) return;
  try {
    if (b.hasAttribute('data-close')) b.closest('dialog').close();
    if (b.dataset.category) { filterProduk.kategori = b.dataset.category; navigasi('belanja'); }
    if (b.dataset.add) { Backend.tambahTas(b.dataset.add); render(); pesan('Produk ditambahkan ke keranjang.'); }
    if (b.dataset.favorite) {
      const a = Backend.pengguna(); if (!a) { bukaLogin(); return; }
      const id = b.dataset.favorite;
      a.favorit = a.favorit.includes(id) ? a.favorit.filter(x => x !== id) : [...a.favorit, id];
      render(); pesan('Daftar produk tersimpan diperbarui.');
    }
    if (b.dataset.gallery) { $('detail-image').dataset.asset = b.dataset.gallery; siapkanAset(); }
    if (b.dataset.detailQty) $('detail-quantity').value = Math.min(Number($('detail-quantity').max), Math.max(1, Number($('detail-quantity').value) + Number(b.dataset.detailQty)));
    if (b.dataset.detailAdd || b.dataset.buy) {
      const jumlah = Number($('detail-quantity').value);
      if (!Number.isInteger(jumlah) || jumlah < 1) throw Error('Jumlah harus bilangan bulat minimal 1.');
      Backend.tambahTas(b.dataset.detailAdd || b.dataset.buy, jumlah);
      if (b.dataset.buy) navigasi('keranjang'); else { render(); pesan('Produk ditambahkan ke keranjang.'); }
    }
    if (b.dataset.tab) {
      ['spec', 'desc', 'use'].forEach(t => $(t + '-panel').hidden = t !== b.dataset.tab);
      document.querySelectorAll('[data-tab]').forEach(t => t.classList.toggle('active', t === b));
    }
    if (b.id === 'calc-add') { const total = Math.ceil(Number($('calc-area').value) * .29); if (!Number.isFinite(total) || total < 1) throw Error('Masukkan luas yang valid.'); Backend.tambahTas('SMN-001', total); render(); pesan(total + ' sak ditambahkan.'); }
    if (b.dataset.qty) { Backend.tambahTas(b.dataset.qty, Number(b.dataset.delta)); render(); }
    if (b.dataset.remove) { delete Backend.keranjang[b.dataset.remove]; render(); }
    if (b.dataset.pay) { await Backend.bayarDemo(b.dataset.pay); render(); pesan('Pembayaran simulasi berhasil.'); }
    if (b.dataset.receipt) unduhRingkasan(b.dataset.receipt);
    if (b.dataset.reorder) {
      const p = Backend.lihatPesanan(b.dataset.reorder);
      // Validasi semua produk sebelum menambahkan agar tidak setengah berhasil.
      p.item.forEach(i => { const produk = Backend.produk(i.id); if (!produk?.aktif || produk.stok < i.jumlah + (Backend.keranjang[i.id] || 0)) throw Error('Stok ' + i.nama + ' tidak cukup.'); });
      p.item.forEach(i => Backend.tambahTas(i.id, i.jumlah)); navigasi('keranjang');
    }
    if (b.dataset.coupon) { kodePromo = b.dataset.coupon; pesan('Kode ' + kodePromo + ' dipilih. Minimum belanja berlaku.'); navigasi('belanja'); }
    if (b.dataset.action === 'logout') { await Backend.keluar(); kodePromo = ''; $('checkout-form').reset(); navigasi('beranda'); pesan('Berhasil keluar. Data demo tetap ada sampai refresh.'); }
    if (b.hasAttribute('data-product-new')) bukaProdukForm();
    if (b.dataset.productEdit) bukaProdukForm(b.dataset.productEdit);
    if (b.dataset.productToggle) konfirmasi('Ubah status produk ini? Produk yang diarsipkan tidak muncul di toko.', () => Backend.aktifProduk(b.dataset.productToggle));
    if (b.dataset.userSave) { await Backend.ubahAkun(b.dataset.userSave, $('role-' + b.dataset.userSave).value, $('active-' + b.dataset.userSave).checked); render(); pesan('Pengguna diperbarui.'); }
    if (b.id === 'new-promo') { $('promo-form').reset(); $('promo-error').textContent = ''; $('promo-dialog').showModal(); }
    if (b.dataset.promoToggle) { Backend.wajib(['Admin']); const p = Backend.data.promo.find(p => p.kode === b.dataset.promoToggle); p.aktif = !p.aktif; render(); }
    if (b.dataset.help) bukaBantuan(b.dataset.help);
    if (b.dataset.inspiration) { const item = DATA.inspirasi[Number(b.dataset.inspiration)]; info(item.judul, `<img data-asset="${item.foto}" alt="${aman(item.judul)}" style="width:100%;border-radius:16px"><p style="margin-top:20px">${aman(item.isi)}</p>`); }
  } catch (error) { pesan(error.message); }
});
document.addEventListener('change', event => {
  const b = event.target;
  if (b.dataset.orderUpdate && b.value) {
    const status = b.value;
    konfirmasi('Ubah pesanan menjadi ' + status + '?' + (status === 'Dibatalkan' ? ' Stok dikembalikan; tidak ada refund uang nyata.' : ''), () => Backend.ubahStatus(b.dataset.orderUpdate, status));
    b.value = '';
  }
  if (b.id === 'inventory-stock') tampilInventori();
  if (b.id === 'admin-order-status') tampilOrderAdmin();
});
document.addEventListener('input', event => {
  if (event.target.id === 'inventory-search') tampilInventori();
  if (event.target.id === 'admin-order-search') tampilOrderAdmin();
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'calculator-form') return;
  event.preventDefault();
  const luas = Number($('calc-area').value);
  $('calc-result').textContent = 'Perkiraan ' + Math.ceil(luas * .25) + '–' + Math.ceil(luas * .29) + ' sak (ilustrasi).';
});

// 7. EVENT FORM STATIS.
$('account-button').onclick = () => Backend.pengguna() ? navigasi(Backend.pengguna().peran === 'Pembeli' ? 'akun' : 'dashboard/ringkasan') : bukaLogin();
$('auth-switch').onclick = () => { daftarMode = !daftarMode; aturLogin(); };
$('auth-form').onsubmit = async event => {
  event.preventDefault(); $('auth-submit').disabled = true;
  try {
    const a = daftarMode ? await Backend.daftar($('register-name').value, $('username').value, $('password').value) : await Backend.masuk($('username').value, $('password').value);
    $('auth-dialog').close(); $('auth-form').reset();
    navigasi(a.peran === 'Pembeli' ? 'akun' : 'dashboard/ringkasan');
  } catch (error) { $('auth-error').textContent = error.message; }
  finally { $('auth-submit').disabled = false; }
};
$('global-search').onsubmit = event => { event.preventDefault(); filterProduk.cari = $('query').value; filterProduk.kategori = ''; navigasi('belanja'); };
$('catalog-search').oninput = event => { filterProduk.cari = event.target.value; tampilKatalog(); };
$('filter-form').onsubmit = event => { event.preventDefault(); filterProduk = { ...filterProduk, kategori: $('filter-category').value, maksimum: $('filter-price').value, rating: $('filter-rating').value, stok: $('filter-stock').checked }; tampilKatalog(); };
$('filter-reset').onclick = () => { $('filter-form').reset(); filterProduk = { kategori: '', cari: '', maksimum: '', rating: 0, stok: false }; tampilKatalog(); };
$('sort').onchange = tampilKatalog;
$('apply-coupon').onclick = () => { try { const kode = $('cart-coupon').value.trim().toUpperCase(); Backend.ringkasan(kode); kodePromo = kode; $('coupon-message').textContent = kode ? 'Promo diterapkan.' : 'Promo dihapus.'; tampilKeranjang(); } catch (error) { $('coupon-message').textContent = error.message; } };
$('shipping-method').onchange = tampilCheckout;
$('checkout-form').onsubmit = async event => {
  event.preventDefault(); const button = event.target.querySelector('button[type=submit]'); button.disabled = true;
  try { const form = Object.fromEntries(new FormData(event.target)); const p = await Backend.buatPesanan({ ...form, kode: kodePromo }); kodePromo = ''; pesananDipilih = p.id; $('checkout-error').textContent = ''; navigasi('pembayaran/' + p.id); }
  catch (error) { $('checkout-error').textContent = error.message; }
  finally { button.disabled = false; }
};
$('profile-form').onsubmit = event => { event.preventDefault(); const a = Backend.wajib(); const nama = $('profile-input').value.trim(); if (nama.length < 2) { pesan('Nama minimal 2 karakter.'); return; } a.nama = nama; a.alamat = $('profile-address').value.trim(); tampilAkun(); pesan('Profil demo disimpan.'); };
$('order-search').oninput = tampilPesanan;
$('order-status').onchange = tampilPesanan;
$('product-form').onsubmit = async event => {
  event.preventDefault();
  try { await Backend.simpanProduk({ id: $('edit-id').value, nama: $('edit-name').value, kategori: $('edit-category').value, merek: $('edit-brand').value, harga: Number($('edit-price').value), satuan: $('edit-unit').value, stok: Number($('edit-stock').value), foto: fotoEdit }); $('product-dialog').close(); render(); pesan('Produk berhasil disimpan.'); }
  catch (error) { $('product-error').textContent = error.message; }
};
$('edit-photo').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { $('product-error').textContent = 'Pilih JPG, PNG, atau WebP maksimal 5 MB.'; event.target.value = ''; return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { fotoEdit = url; $('edit-preview').dataset.asset = url; $('edit-preview').src = url; $('edit-preview').hidden = false; $('product-error').textContent = ''; };
  img.onerror = () => { URL.revokeObjectURL(url); $('product-error').textContent = 'File gambar tidak dapat dibuka.'; };
  img.src = url;
};
$('promo-form').onsubmit = async event => { event.preventDefault(); const form = Object.fromEntries(new FormData(event.target)); try { await Backend.simpanPromo({ kode: form.kode, persen: Number(form.persen), maksimum: Number(form.maksimum), minimum: Number(form.minimum) }); $('promo-dialog').close(); render(); pesan('Promo dibuat.'); } catch (error) { $('promo-error').textContent = error.message; } };
$('coverage-form').onsubmit = event => { event.preventDefault(); $('coverage-result').textContent = 'Cek area masih demo. Tarif simulasi tersedia di checkout; belum ada verifikasi kode pos atau layanan logistik.'; };
$('newsletter-form').onsubmit = event => { event.preventDefault(); pesan('Form demo berhasil divalidasi. Email tidak disimpan atau dikirim.'); event.target.reset(); };
$('dashboard-export').onclick = () => {
  try { const orders = Backend.daftarPesanan(); unduh('laporan-pesanan-demo.csv', [['Nomor', 'Pelanggan', 'Total', 'Status'], ...orders.map(p => [p.id, p.nama, p.total, p.status])].map(row => row.map(v => '"' + String(v).replace(/^[=+@-]/, "'" + String(v)[0]).replace(/"/g, '""') + '"').join(',')).join('\r\n'), 'text/csv;charset=utf-8'); }
  catch (error) { pesan(error.message); }
};
function unduh(nama, isi, tipe = 'text/plain;charset=utf-8') { const url = URL.createObjectURL(new Blob(['\ufeff', isi], { type: tipe })); const a = document.createElement('a'); a.href = url; a.download = nama; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function unduhRingkasan(id) { const p = Backend.lihatPesanan(id); unduh('ringkasan-demo-' + id + '.txt', ['SAKUBANGUN — RINGKASAN DEMO', 'BUKAN BUKTI PEMBAYARAN NYATA', p.id, p.nama, p.status, ...p.item.map(i => i.nama + ' × ' + i.jumlah + ': ' + uang(i.harga * i.jumlah)), 'Total simulasi: ' + uang(p.total)].join('\n')); }
function bukaBantuan(judul) {
  const isi = {
    'Kebijakan privasi': 'Versi demo ini tidak terhubung ke database atau layanan eksternal. Data formulir hanya berada di memori halaman dan hilang saat refresh. Jangan gunakan data pribadi asli.',
    'Retur & refund': 'Layanan retur nyata belum terhubung. Pada demo, admin atau penjual dapat membatalkan pesanan sebelum dikirim. Stok kembali otomatis; tidak ada dana yang diproses.',
    'Cek ongkir': 'Simulasi pengiriman Rp85.000. Gratis untuk subtotal minimal Rp1.500.000 atau ambil di gudang. Belum ada integrasi jasa pengiriman.',
    'Karier': 'Belum ada lowongan pada prototipe ini. Informasi perusahaan perlu diisi pemilik usaha.',
    'Mitra pemasok': 'Gunakan akun penjual / 123 untuk mencoba pengelolaan produk. Admin dapat mengubah akun demo baru menjadi Penjual.',
    'Tentang kami': 'SakuBangun adalah konsep marketplace bahan bangunan dari file Figma gardaTech. Website ini merupakan prototipe; angka proyek, testimoni, dan cakupan merupakan konten contoh desain.',
    'Panduan pengelolaan toko': 'Buka Produk & Stok untuk menambah, mengedit, atau mengarsipkan produk. Pesanan dari pembeli masuk ke menu Pesanan. Proses status secara berurutan: Disiapkan → Siap kirim → Dalam perjalanan → Terkirim.'
  };
  info(judul, '<p>' + aman(isi[judul] || 'Catat jenis pekerjaan, luas, dan satuan material. Fitur percakapan dengan konsultan belum terhubung; tidak ada pesan yang dikirim dari prototipe ini.') + '</p>');
}

// 8. INISIALISASI BERANDA.
const ikonKategori = ['76da4', '6bba2', 'b8d40', '21a2c', 'b2a79', 'f9a86', '41ec9', 'cc35a', '12c16', '6e48e'];
const warnaKategori = ['#fff2b8', '#ffe5da', '#ddf2ff', '#efe4ff', '#ddf7e9', '#ffe1ef', '#ddf2ff', '#fff2b8', '#ffe5da', '#ddf7e9'];
$('categories').innerHTML = DATA.kategori.map((k, i) => `<button class="category" data-category="${aman(k)}" style="background:${warnaKategori[i]}"><span class="category-icon">${ikon('home-' + ikonKategori[i] + '.svg')}</span><span><strong>${aman(k)}</strong><small>${[124, 86, 218, 306, 93, 177, 254, 192, 165, 108][i]} produk*</small></span></button>`).join('');
function kartuInspirasi(item, i) { return `<button class="inspiration-card" data-inspiration="${i}"><img data-asset="${item.foto}" alt="${aman(item.judul)}" loading="lazy"><span class="pill">${aman(item.kategori)}</span><span class="caption"><h3>${aman(item.judul)}</h3><small>${aman(item.catatan)}</small></span></button>`; }
$('home-inspiration').innerHTML = DATA.inspirasi.map(kartuInspirasi).join('');
$('inspiration-list').innerHTML = DATA.inspirasi.map(kartuInspirasi).join('');
DATA.kategori.forEach(k => { $('filter-category').add(new Option(k, k)); $('edit-category').add(new Option(k, k)); });
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'k') { event.preventDefault(); $('query').focus(); } });
render();
