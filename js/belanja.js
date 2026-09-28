/* JS/BELANJA.JS — LOGIKA HALAMAN KATALOG BELANJA */
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('kategori') || '';
  const initialQuery = urlParams.get('q') || '';

  const filter = {
    kategori: initialCategory,
    cari: initialQuery,
    maksimum: '',
    rating: 0,
    stok: false
  };

  const catSelect = $('filter-category');
  if (catSelect && typeof DATA !== 'undefined') {
    DATA.kategori.forEach(k => {
      const opt = new Option(k, k);
      if (k === initialCategory) opt.selected = true;
      catSelect.add(opt);
    });
  }

  const catalogSearch = $('catalog-search');
  if (catalogSearch && initialQuery) {
    catalogSearch.value = initialQuery;
  }

  function tampilKatalog() {
    let produk = Backend.produkPublik().filter(p =>
      (!filter.kategori || p.kategori === filter.kategori) &&
      (!filter.cari || (p.nama + ' ' + (p.merek || '')).toLowerCase().includes(filter.cari.toLowerCase())) &&
      (!filter.maksimum || p.harga <= Number(filter.maksimum)) &&
      p.rating >= Number(filter.rating) &&
      (!filter.stok || p.stok > 0)
    );

    const sortEl = $('sort');
    if (sortEl) {
      if (sortEl.value === 'low') produk.sort((a, b) => a.harga - b.harga);
      if (sortEl.value === 'high') produk.sort((a, b) => b.harga - a.harga);
      if (sortEl.value === 'rating') produk.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    const countEl = $('catalog-count');
    if (countEl) countEl.textContent = produk.length + ' produk ditemukan';

    const prodContainer = $('catalog-products');
    if (prodContainer) {
      prodContainer.innerHTML = produk.map(p => kartuProduk(p)).join('');
    }

    const emptyEl = $('catalog-empty');
    if (emptyEl) emptyEl.hidden = produk.length > 0;

    siapkanAset();
  }

  // Event Listeners
  if (catalogSearch) {
    catalogSearch.addEventListener('input', e => {
      filter.cari = e.target.value.trim();
      tampilKatalog();
    });
  }

  const filterForm = $('filter-form');
  if (filterForm) {
    filterForm.onsubmit = e => {
      e.preventDefault();
      filter.kategori = $('filter-category')?.value || '';
      filter.maksimum = $('filter-price')?.value || '';
      filter.rating = Number($('filter-rating')?.value || 0);
      filter.stok = $('filter-stock')?.checked || false;
      tampilKatalog();
    };
  }

  const filterReset = $('filter-reset');
  if (filterReset) {
    filterReset.onclick = () => {
      filterForm?.reset();
      filter.kategori = '';
      filter.cari = '';
      filter.maksimum = '';
      filter.rating = 0;
      filter.stok = false;
      if (catalogSearch) catalogSearch.value = '';
      tampilKatalog();
    };
  }

  const sortSelect = $('sort');
  if (sortSelect) {
    sortSelect.onchange = tampilKatalog;
  }

  tampilKatalog();
});
