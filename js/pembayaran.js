/* JS/PEMBAYARAN.JS — LOGIKA HALAMAN PEMBAYARAN SIMULASI */
document.addEventListener('DOMContentLoaded', () => {
  const user = Backend.pengguna();
  if (!user) {
    pesan('Silakan masuk terlebih dahulu.');
    setTimeout(() => location.href = 'login.html', 1000);
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  let id = urlParams.get('id');

  if (!id) {
    const orders = Backend.daftarPesanan();
    if (orders.length > 0) id = orders[0].id;
  }

  const content = $('payment-content');
  if (!content) return;

  function renderPembayaran() {
    let p;
    try {
      p = Backend.lihatPesanan(id);
    } catch (err) {
      content.innerHTML = kosong('Pesanan tidak ditemukan', err.message, 'pesanan.html', 'Lihat Daftar Pesanan');
      return;
    }

    const lunas = !['Menunggu pembayaran', 'Dibatalkan'].includes(p.status);

    content.innerHTML = `
      <section class="card success-card">
        <div class="success-icon">${lunas ? '✓' : '◷'}</div>
        <span class="pill ${lunas ? 'green' : 'yellow'}">
          ${lunas ? 'PEMBAYARAN SIMULASI BERHASIL' : 'MENUNGGU SIMULASI PEMBAYARAN'}
        </span>
        <h1>${lunas ? 'Pesananmu siap disiapkan!' : 'Lanjutkan simulasi pembayaran'}</h1>
        <p>Mode demo SakuBangun: tidak ada uang yang ditagih atau diproses.</p>
        
        <div style="text-align: left; max-width: 480px; margin: 24px auto;">
          <div class="summary-row"><span>Nomor Pesanan</span><strong>${aman(p.id)}</strong></div>
          <div class="summary-row"><span>Total Tagihan Demo</span><strong>${uang(p.total)}</strong></div>
          <div class="summary-row"><span>Metode Pembayaran</span><strong>${aman(p.metode)}</strong></div>
          <div class="summary-row"><span>Jadwal Pengiriman</span><strong>${aman(p.tanggal)} (${aman(p.slot)})</strong></div>
          <div class="summary-row"><span>Status Pesanan</span><strong>${statusPill(p.status)}</strong></div>
        </div>
        
        <div class="actions">
          ${!lunas && p.status !== 'Dibatalkan' ? `
            <button class="button" id="btn-pay-now">Simulasikan Pembayaran Berhasil</button>
          ` : ''}
          <a class="button ${lunas ? '' : 'white'}" href="lacak.html?id=${encodeURIComponent(p.id)}">Lacak Pesanan</a>
          <button class="button white" id="btn-download-receipt">Unduh Ringkasan Demo</button>
        </div>
      </section>

      <div class="card related">
        <h3>Alur Selanjutnya pada Demo</h3>
        <ol class="timeline">
          <li>
            <p><strong>1. Pembayaran Simulasi</strong></p>
            <small>Konfirmasi dengan menekan tombol di atas.</small>
          </li>
          <li>
            <p><strong>2. Pesanan Disiapkan Penjual</strong></p>
            <small>Penjual dapat memproses status ini melalui dashboard toko.</small>
          </li>
          <li>
            <p><strong>3. Pengiriman ke Lokasi Proyek</strong></p>
            <small>Jadwal: ${aman(p.tanggal)} pada slot waktu ${aman(p.slot)}.</small>
          </li>
        </ol>
      </div>
    `;

    $('btn-pay-now')?.addEventListener('click', async () => {
      try {
        await Backend.bayarDemo(p.id);
        pesan('Pembayaran simulasi berhasil diverifikasi!');
        renderPembayaran();
      } catch (err) {
        pesan(err.message);
      }
    });

    $('btn-download-receipt')?.addEventListener('click', () => {
      unduhRingkasan(p.id);
    });
  }

  renderPembayaran();
});
