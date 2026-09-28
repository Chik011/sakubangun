/* COMMON.JS — FUNGSI & UTILITY BERSAMA SAKUBANGUN
   Digunakan di semua halaman: beranda, belanja, produk, keranjang, checkout, profil, dll.
*/

// 1. SELECTOR & FORMATTER
const $ = id => document.getElementById(id);
const uang = nilai => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nilai);
const aman = nilai => String(nilai ?? '').replace(/[&<>"']/g, huruf => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[huruf]));
const tanggal = nilai => new Date(nilai).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
let timerToast;

// 2. PESAN TOAST & DIALOG
function pesan(teks) {
  let toast = $('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  clearTimeout(timerToast);
  toast.textContent = teks;
  toast.hidden = false;
  timerToast = setTimeout(() => { if (toast) toast.hidden = true; }, 4500);
}

function info(judul, isi) {
  let dlg = $('info-dialog');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'info-dialog';
    dlg.innerHTML = `<button class="close" data-close aria-label="Tutup">×</button><h2 id="info-title"></h2><div id="info-body"></div>`;
    document.body.appendChild(dlg);
  }
  $('info-title').textContent = judul;
  $('info-body').innerHTML = isi;
  dlg.showModal();
}

function konfirmasi(teks, aksi) {
  let dlg = $('confirm-dialog');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'confirm-dialog';
    dlg.innerHTML = `<h2 id="confirm-title">Konfirmasi</h2><p id="confirm-text"></p><div class="actions"><button class="button white" data-close>Batal</button><button id="confirm-yes" class="button">Lanjutkan</button></div>`;
    document.body.appendChild(dlg);
  }
  $('confirm-text').textContent = teks;
  $('confirm-yes').onclick = async () => {
    try {
      await aksi();
      dlg.close();
    } catch (error) {
      pesan(error.message);
    }
  };
  dlg.showModal();
}

function ikon(file) {
  return '<img data-asset="assets/' + file + '" alt="">';
}

function statusPill(status) {
  const warna = ['Terkirim', 'Aktif'].includes(status) ? 'green' : status === 'Dibatalkan' || status === 'Habis' ? 'red' : status === 'Menunggu pembayaran' ? 'yellow' : '';
  return '<span class="pill ' + warna + '">' + aman(status) + '</span>';
}

function kosong(judul, teks, link = 'belanja.html', tombol = 'Mulai belanja') {
  return '<div class="empty"><h3>' + aman(judul) + '</h3><p>' + aman(teks) + '</p><a class="button" href="' + link + '">' + tombol + '</a></div>';
}

// 3. PENGELOLA GAMBAR & ASET FIGMA
function siapkanAset(root = document) {
  const daftarAset = typeof ASET_TERSEDIA !== 'undefined' ? ASET_TERSEDIA : ["assets/home-52ae7.png", "assets/favicon.svg"];
  root.querySelectorAll('img[data-asset]').forEach(img => {
    const src = img.dataset.asset;
    const tersedia = !src.startsWith('assets/') || daftarAset.includes(src);
    if (tersedia) {
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      img.hidden = false;
      if (img.nextElementSibling?.classList.contains('asset-pending')) img.nextElementSibling.remove();
      return;
    }
    img.hidden = true;
    if (src.endsWith('.png') && !img.nextElementSibling?.classList.contains('asset-pending')) {
      const label = document.createElement('span');
      label.className = img.className + ' asset-pending';
      label.textContent = 'Foto menunggu ekspor Figma';
      img.after(label);
    }
  });
}

// 4. KARTU PRODUK REUSABLE
function kartuProduk(p, beranda = false) {
  const user = Backend.pengguna();
  const favorit = user?.favorit?.includes(p.id);
  return `<article class="product-card">
    <div class="product-media">
      <a href="produk.html?id=${encodeURIComponent(p.id)}">
        <img class="product-photo" data-asset="${aman(beranda ? p.fotoHome || p.foto : p.foto)}" alt="${aman(p.nama)}" loading="lazy">
      </a>
      ${p.label ? '<span class="pill">' + aman(p.label) + '</span>' : ''}
      <button class="favorite ${favorit ? 'selected' : ''}" data-favorite="${aman(p.id)}" aria-label="Simpan ${aman(p.nama)}" aria-pressed="${!!favorit}">
        ${ikon('home-15923.svg')}<span aria-hidden="true">♡</span>
      </button>
    </div>
    <div class="product-meta"><span>${aman(p.kategori.toUpperCase())}</span><span>★ ${p.rating || 'Baru'}</span></div>
    <a href="produk.html?id=${encodeURIComponent(p.id)}"><h3>${aman(p.nama)}</h3></a>
    <strong class="product-price">${uang(p.harga)} <small>/${aman(p.satuan)}</small></strong>
    <button class="button pale" data-add="${aman(p.id)}" ${p.stok ? '' : 'disabled'}>
      ${ikon('home-ad1e5.svg')} ${p.stok ? 'Tambah' : 'Stok habis'}
    </button>
  </article>`;
}

// 5. UNDUH FILE
function unduh(nama, isi, tipe = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(['\ufeff', isi], { type: tipe }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function unduhRingkasan(id) {
  const p = Backend.lihatPesanan(id);
  unduh('ringkasan-demo-' + id + '.txt', [
    'SAKUBANGUN — RINGKASAN DEMO',
    'BUKAN BUKTI PEMBAYARAN NYATA',
    'ID Pesanan: ' + p.id,
    'Pelanggan: ' + p.nama,
    'Status: ' + p.status,
    'Jadwal: ' + p.tanggal + ' (' + p.slot + ')',
    'Alamat: ' + p.alamat,
    '--- Rincian Barang ---',
    ...p.item.map(i => i.nama + ' × ' + i.jumlah + ': ' + uang(i.harga * i.jumlah)),
    'Subtotal: ' + uang(p.subtotal),
    'Ongkos kirim: ' + uang(p.ongkir),
    'Diskon: -' + uang(p.diskon),
    'Total simulasi: ' + uang(p.total)
  ].join('\n'));
}

// 6. BANTUAN DIALOG
function bukaBantuan(judul) {
  const isi = {
    'Kebijakan privasi': 'Versi demo ini tidak terhubung ke database atau layanan eksternal. Data formulir disimpan di peramban (localStorage) untuk keperluan simulasi. Jangan gunakan data pribadi atau pembayaran asli.',
    'Retur & refund': 'Layanan retur nyata belum terhubung. Pada demo, admin atau penjual dapat membatalkan pesanan sebelum dikirim. Stok kembali otomatis; tidak ada dana yang diproses.',
    'Cek ongkir': 'Simulasi pengiriman Rp85.000. Gratis untuk subtotal minimal Rp1.500.000 atau pilih opsi Ambil di Gudang.',
    'Karier': 'Belum ada lowongan pada prototipe ini. Informasi perusahaan dapat disesuaikan dengan data resmi.',
    'Mitra pemasok': 'Gunakan akun penjual (password: 123) untuk mencoba pengelolaan produk. Admin dapat mengubah akun demo baru menjadi Penjual.',
    'Tentang kami': 'SakuBangun adalah prototipe marketplace bahan bangunan digital. Memberikan transparansi harga, stok jelas, dan simulasi alur pemesanan material proyek.',
    'Panduan pengelolaan toko': 'Buka Dashboard Produk & Stok untuk menambah, mengedit, atau mengarsipkan produk. Pesanan dari pembeli masuk ke menu Pesanan. Proses status secara berurutan: Disiapkan → Siap kirim → Dalam perjalanan → Terkirim.'
  };
  info(judul, '<p>' + aman(isi[judul] || 'Catat jenis pekerjaan, luas, dan satuan material. Fitur bantuan demo siap melayani kebutuhan prototipe.') + '</p>');
}

// 7. SINKRONISASI HEADER, KERANJANG, & USER
function sinkronkanHeader() {
  const cartBadge = $('cart-count');
  if (cartBadge && Backend?.keranjang) {
    const totalItem = Object.values(Backend.keranjang).reduce((a, b) => a + b, 0);
    cartBadge.textContent = totalItem;
  }

  const akunBtn = $('account-button');
  if (akunBtn) {
    const user = Backend.pengguna();
    if (user) {
      akunBtn.innerHTML = `${ikon('home-fd570.svg')} <span>${aman(user.nama.split(' ')[0])}</span>`;
      akunBtn.title = `Login sebagai ${user.nama} (${user.peran})`;
      akunBtn.onclick = () => {
        if (['Admin', 'Penjual'].includes(user.peran)) {
          location.href = 'dashboard.html';
        } else {
          location.href = 'profil.html';
        }
      };
    } else {
      akunBtn.innerHTML = `${ikon('home-fd570.svg')} <span>Akun</span>`;
      akunBtn.title = 'Masuk atau Daftar';
      akunBtn.onclick = () => {
        location.href = 'login.html';
      };
    }
  }

  // Active navigation link highlighting
  const currentPath = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.store-nav a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === currentPath || (currentPath === 'index.html' && (href === 'beranda.html' || href === 'index.html')) || (currentPath === 'profil.html' && href === 'akun.html')) {
      a.classList.add('active');
    }
  });
}

// 8. EVENT GLOBAL LISTENER
document.addEventListener('DOMContentLoaded', () => {
  new MutationObserver(() => siapkanAset()).observe(document.documentElement, { childList: true, subtree: true });
  siapkanAset();
  sinkronkanHeader();

  // Global search form
  const searchForm = $('global-search');
  if (searchForm) {
    searchForm.onsubmit = event => {
      event.preventDefault();
      const q = $('query')?.value.trim();
      location.href = 'belanja.html?q=' + encodeURIComponent(q || '');
    };
  }

  // Global shortcut Ctrl+K
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      const qInput = $('query') || $('catalog-search');
      if (qInput) {
        event.preventDefault();
        qInput.focus();
      }
    }
  });
});

// Global click delegation
document.addEventListener('click', async event => {
  const b = event.target.closest('button, a');
  if (!b) return;

  try {
    if (b.hasAttribute('data-close')) {
      const dlg = b.closest('dialog');
      if (dlg) dlg.close();
    }

    if (b.dataset.category) {
      location.href = 'belanja.html?kategori=' + encodeURIComponent(b.dataset.category);
    }

    if (b.dataset.add) {
      Backend.tambahTas(b.dataset.add);
      sinkronkanHeader();
      pesan('Produk ditambahkan ke keranjang.');
    }

    if (b.dataset.favorite) {
      const a = Backend.pengguna();
      if (!a) {
        pesan('Silakan masuk terlebih dahulu untuk menyimpan favorit.');
        setTimeout(() => location.href = 'login.html', 1000);
        return;
      }
      const id = b.dataset.favorite;
      const isFav = Backend.toggleFavorit(id);
      b.classList.toggle('selected', isFav);
      b.setAttribute('aria-pressed', String(isFav));
      pesan(isFav ? 'Produk disimpan ke favorit.' : 'Produk dihapus dari favorit.');
    }

    if (b.dataset.action === 'logout') {
      await Backend.keluar();
      pesan('Berhasil keluar akun.');
      setTimeout(() => location.href = 'index.html', 800);
    }

    if (b.dataset.help) {
      bukaBantuan(b.dataset.help);
    }
  } catch (error) {
    pesan(error.message);
  }
});
