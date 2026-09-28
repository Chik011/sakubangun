/* JS/BERANDA.JS — LOGIKA HALAMAN BERANDA */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Kategori Populer
  const ikonKategori = ['76da4', '6bba2', 'b8d40', '21a2c', 'b2a79', 'f9a86', '41ec9', 'cc35a', '12c16', '6e48e'];
  const warnaKategori = ['#fff2b8', '#ffe5da', '#ddf2ff', '#efe4ff', '#ddf7e9', '#ffe1ef', '#ddf2ff', '#fff2b8', '#ffe5da', '#ddf7e9'];
  const jumlahProduk = [124, 86, 218, 306, 93, 177, 254, 192, 165, 108];

  const catContainer = $('categories');
  if (catContainer && typeof DATA !== 'undefined') {
    catContainer.innerHTML = DATA.kategori.map((k, i) => `
      <button class="category" data-category="${aman(k)}" style="background:${warnaKategori[i]}">
        <span class="category-icon">${ikon('home-' + ikonKategori[i] + '.svg')}</span>
        <span>
          <strong>${aman(k)}</strong>
          <small>${jumlahProduk[i]} produk*</small>
        </span>
      </button>
    `).join('');
  }

  // 2. Produk Populer Pilihan
  const homeProdContainer = $('home-products');
  if (homeProdContainer && typeof Backend !== 'undefined') {
    const list = Backend.produkPublik().slice(0, 5);
    homeProdContainer.innerHTML = list.map(p => kartuProduk(p, true)).join('');
  }

  // 3. Inspirasi Proyek Minggu Ini
  const homeInspiration = $('home-inspiration');
  if (homeInspiration && typeof DATA !== 'undefined') {
    homeInspiration.innerHTML = DATA.inspirasi.map((item, i) => `
      <a href="inspirasi.html#ide-${i}" class="inspiration-card">
        <img data-asset="${item.foto}" alt="${aman(item.judul)}" loading="lazy">
        <span class="pill">${aman(item.kategori)}</span>
        <span class="caption">
          <h3>${aman(item.judul)}</h3>
          <small>${aman(item.catatan)}</small>
        </span>
      </a>
    `).join('');
  }

  // 4. Form Cek Area / Coverage
  const covForm = $('coverage-form');
  if (covForm) {
    covForm.onsubmit = event => {
      event.preventDefault();
      const res = $('coverage-result');
      if (res) res.textContent = 'Cek area masih demo. Tarif pengiriman otomatis dihitung saat checkout; layanan mencakup 48 kota besar.';
    };
  }

  // 5. Form Newsletter
  const newsForm = $('newsletter-form');
  if (newsForm) {
    newsForm.onsubmit = event => {
      event.preventDefault();
      pesan('Terima kasih! Email kamu terdaftar untuk info proyek demo.');
      newsForm.reset();
    };
  }

  siapkanAset();
});
