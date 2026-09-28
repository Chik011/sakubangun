/* JS/PROFIL.JS — LOGIKA HALAMAN PROFIL AKUN PEMBELI */
document.addEventListener('DOMContentLoaded', () => {
  const user = Backend.pengguna();
  if (!user) {
    pesan('Silakan masuk terlebih dahulu untuk mengakses profil.');
    setTimeout(() => location.href = 'login.html', 800);
    return;
  }

  if (['Admin', 'Penjual'].includes(user.peran)) {
    location.href = 'dashboard.html';
    return;
  }

  // Isi data profil
  const greetingEl = $('greeting');
  if (greetingEl) greetingEl.textContent = `Hai, ${user.nama}!`;

  const profName = $('profile-name');
  if (profName) profName.textContent = user.nama;

  const profRole = $('profile-role');
  if (profRole) profRole.textContent = `${user.peran} · Akun Demo`;

  const inputName = $('profile-input');
  if (inputName) inputName.value = user.nama;

  const inputAddress = $('profile-address');
  if (inputAddress) inputAddress.value = user.alamat || '';

  // Form submit
  const profForm = $('profile-form');
  if (profForm) {
    profForm.onsubmit = e => {
      e.preventDefault();
      const nama = inputName?.value.trim();
      if (!nama || nama.length < 2) {
        pesan('Nama minimal 2 karakter.');
        return;
      }
      user.nama = nama;
      user.alamat = inputAddress?.value.trim() || '';
      Backend.simpanSemua();
      if (profName) profName.textContent = user.nama;
      if (greetingEl) greetingEl.textContent = `Hai, ${user.nama}!`;
      sinkronkanHeader();
      pesan('Profil demo berhasil diperbarui.');
    };
  }

  // Pesanan Terbaru
  const recentOrdersEl = $('recent-orders');
  if (recentOrdersEl) {
    const orders = Backend.daftarPesanan().slice(0, 2);
    if (orders.length === 0) {
      recentOrdersEl.innerHTML = '<p>Belum ada riwayat pesanan. Mulai belanja dari katalog.</p>';
    } else {
      recentOrdersEl.innerHTML = orders.map(p => {
        const item1 = p.item[0];
        return `
          <article class="card order-card" style="margin-bottom: 12px; padding: 16px;">
            <div class="order-top" style="padding-bottom: 8px; margin-bottom: 8px;">
              <div><strong>${aman(p.id)}</strong><small>${tanggal(p.dibuat)}</small></div>
              ${statusPill(p.status)}
            </div>
            <div class="order-body">
              <img data-asset="${aman(item1?.foto || 'assets/favicon.svg')}" alt="">
              <div>
                <h3>${aman(item1?.nama || 'Produk')} ${p.item.length > 1 ? `+ ${p.item.length - 1} lainnya` : ''}</h3>
                <small>Total tagihan</small>
                <strong>${uang(p.total)}</strong>
              </div>
              <div class="actions">
                <a class="button white small" href="lacak.html?id=${encodeURIComponent(p.id)}">Lacak</a>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }
  }

  siapkanAset();
});
