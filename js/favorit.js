/* JS/FAVORIT.JS — LOGIKA HALAMAN PRODUK TERSIMPAN / WISHLIST */
document.addEventListener('DOMContentLoaded', () => {
  const user = Backend.pengguna();
  if (!user) {
    pesan('Silakan masuk terlebih dahulu untuk melihat produk tersimpan.');
    setTimeout(() => location.href = 'login.html', 800);
    return;
  }

  const container = $('favorites-list');
  if (!container) return;

  function renderFavorit() {
    const ids = user.favorit || [];
    const produk = Backend.produkPublik().filter(p => ids.includes(p.id));

    if (produk.length === 0) {
      container.innerHTML = kosong('Belum ada produk tersimpan', 'Tekan ikon hati pada produk yang kamu minati untuk menyimpannya di sini.', 'belanja.html', 'Jelajahi Produk');
      return;
    }

    container.innerHTML = produk.map(p => kartuProduk(p)).join('');
    siapkanAset();
  }

  renderFavorit();
});
