/* JS/PESANAN.JS — LOGIKA HALAMAN RIWAYAT PESANAN */
document.addEventListener('DOMContentLoaded', () => {
  const user = Backend.pengguna();
  if (!user) {
    pesan('Silakan masuk terlebih dahulu untuk melihat riwayat pesanan.');
    setTimeout(() => location.href = 'login.html', 800);
    return;
  }

  const searchInput = $('order-search');
  const statusSelect = $('order-status');
  const listContainer = $('orders-list');

  function renderPesanan() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const status = statusSelect?.value || '';

    let pesanan = Backend.daftarPesanan();
    pesanan = pesanan.filter(p =>
      (!status || p.status === status) &&
      (p.id + ' ' + p.item.map(i => i.nama).join(' ')).toLowerCase().includes(query)
    );

    if (!listContainer) return;

    if (pesanan.length === 0) {
      listContainer.innerHTML = kosong('Belum ada pesanan yang sesuai', 'Pesanan yang dibuat melalui checkout akan tampil di sini.', 'belanja.html', 'Mulai Belanja');
      return;
    }

    listContainer.innerHTML = pesanan.map(p => {
      const item1 = p.item[0];
      return `
        <article class="card order-card">
          <div class="order-top">
            <div>
              <strong>${aman(p.id)}</strong>
              <small>Dibuat: ${tanggal(p.dibuat)} · Jadwal: ${aman(p.tanggal)} (${aman(p.slot)})</small>
            </div>
            ${statusPill(p.status)}
          </div>
          <div class="order-body">
            <img data-asset="${aman(item1?.foto || '')}" alt="${aman(item1?.nama || '')}">
            <div>
              <h3>${aman(item1?.nama || '')} ${p.item.length > 1 ? `+ ${p.item.length - 1} produk lain` : ''}</h3>
              <small>Total tagihan demo</small>
              <strong>${uang(p.total)}</strong>
            </div>
            <div class="actions">
              ${p.status === 'Menunggu pembayaran' ? `
                <a class="button" href="pembayaran.html?id=${encodeURIComponent(p.id)}">Bayar demo</a>
              ` : ''}
              <a class="button white" href="lacak.html?id=${encodeURIComponent(p.id)}">Lacak status</a>
              ${p.status === 'Terkirim' ? `
                <button class="button pale" data-reorder="${p.id}">Beli lagi</button>
              ` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');

    siapkanAset();
  }

  searchInput?.addEventListener('input', renderPesanan);
  statusSelect?.addEventListener('change', renderPesanan);

  // Reorder delegation
  document.addEventListener('click', e => {
    const reorderBtn = e.target.closest('[data-reorder]');
    if (reorderBtn) {
      const id = reorderBtn.dataset.reorder;
      try {
        const p = Backend.lihatPesanan(id);
        p.item.forEach(i => Backend.tambahTas(i.id, i.jumlah));
        sinkronkanHeader();
        pesan('Item pesanan telah dimasukkan kembali ke keranjang.');
        setTimeout(() => location.href = 'keranjang.html', 800);
      } catch (err) {
        pesan(err.message);
      }
    }
  });

  renderPesanan();
});
