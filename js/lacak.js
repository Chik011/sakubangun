/* JS/LACAK.JS — LOGIKA HALAMAN PELACAKAN PESANAN */
document.addEventListener('DOMContentLoaded', () => {
  const user = Backend.pengguna();
  if (!user) {
    pesan('Silakan masuk terlebih dahulu.');
    setTimeout(() => location.href = 'login.html', 800);
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  let id = urlParams.get('id');

  if (!id) {
    const list = Backend.daftarPesanan();
    if (list.length > 0) id = list[0].id;
  }

  const container = $('tracking-content');
  if (!container) return;

  let p;
  try {
    p = Backend.lihatPesanan(id);
  } catch (err) {
    container.innerHTML = kosong('Pesanan tidak ditemukan', err.message, 'pesanan.html', 'Kembali ke Riwayat Pesanan');
    return;
  }

  container.innerHTML = `
    <p class="breadcrumb"><a href="pesanan.html">Pesanan</a> / ${aman(p.id)}</p>
    
    <div class="tracking-status">
      ${statusPill(p.status)}
      <h2>${aman(p.id)} · ${aman(p.nama)}</h2>
      <p>Jadwal pengiriman demo: <strong>${aman(p.tanggal)}</strong>, slot <strong>${aman(p.slot)}</strong></p>
    </div>
    
    <div class="two-column">
      <div>
        <div class="tracking-map">
          <div>
            <h2>Pelacakan Pengiriman Proyek</h2>
            <p>Lokasi GPS armada simulasi. Status pesanan diperbarui otomatis sesuai proses gudang dan kurir.</p>
          </div>
        </div>
        
        <div class="card related">
          <h3>Perjalanan Pesanan</h3>
          <ol class="timeline">
            ${p.riwayat.map(r => `
              <li>
                <p><strong>${aman(r.status)}</strong></p>
                <small>${tanggal(r.waktu)}</small>
              </li>
            `).join('')}
          </ol>
        </div>
      </div>
      
      <aside class="card">
        <h3>Alamat & Penerima</h3>
        <p>
          <strong>${aman(p.nama)}</strong><br>
          ${aman(p.telepon)}<br>
          ${aman(p.alamat)}
        </p>
        
        <h3 class="related">Ringkasan Produk</h3>
        ${p.item.map(i => `
          <div class="summary-row">
            <span>${aman(i.nama)} × ${i.jumlah}</span>
            <strong>${uang(i.harga * i.jumlah)}</strong>
          </div>
        `).join('')}
        
        <div style="border-top: 1px solid var(--border); margin-top: 12px; padding-top: 8px;">
          <div class="summary-row"><span>Subtotal</span><span>${uang(p.subtotal)}</span></div>
          <div class="summary-row"><span>Ongkir</span><span>${uang(p.ongkir)}</span></div>
          <div class="summary-row"><span>Diskon</span><span>−${uang(p.diskon)}</span></div>
          <div class="summary-row summary-total"><span>Total</span><strong>${uang(p.total)}</strong></div>
        </div>
        
        <button class="button full" id="btn-download-tracking-receipt">Unduh Ringkasan Demo</button>
      </aside>
    </div>
  `;

  $('btn-download-tracking-receipt')?.addEventListener('click', () => {
    unduhRingkasan(p.id);
  });
});
