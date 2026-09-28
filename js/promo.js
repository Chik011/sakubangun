/* JS/PROMO.JS — LOGIKA HALAMAN PROMO & VOUCHER */
document.addEventListener('DOMContentLoaded', () => {
  const container = $('promo-list');
  if (!container) return;

  const promos = (Backend.data.promo || []).filter(p => p.aktif);
  if (promos.length === 0) {
    container.innerHTML = '<p class="empty">Saat ini belum ada promo aktif yang tersedia.</p>';
    return;
  }

  container.innerHTML = promos.map(p => `
    <article class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <span class="pill green">PROMO AKTIF</span>
        <h2 style="font-size:24px; margin: 12px 0 6px;">${aman(p.kode)}</h2>
        <p>Diskon <strong>${p.persen}%</strong> hingga <strong>${uang(p.maksimum)}</strong></p>
        <p style="font-size:12px; margin-top:4px;">Minimal belanja ${uang(p.minimum)}</p>
      </div>
      <button class="button related" data-use-coupon="${aman(p.kode)}" style="margin-top:16px;">
        Gunakan Kode Ini
      </button>
    </article>
  `).join('');

  container.querySelectorAll('[data-use-coupon]').forEach(btn => {
    btn.onclick = () => {
      const code = btn.dataset.useCoupon;
      localStorage.setItem('sb_kode_promo', code);
      pesan(`Kode voucher ${code} berhasil disalin! Otomatis diterapkan pada keranjang.`);
      setTimeout(() => {
        location.href = 'keranjang.html';
      }, 700);
    };
  });
});
