/* JS/CHECKOUT.JS — LOGIKA HALAMAN CHECKOUT PEMESANAN */
document.addEventListener('DOMContentLoaded', () => {
  const user = Backend.pengguna();
  if (!user) {
    pesan('Silakan masuk terlebih dahulu untuk menyelesaikan pesanan.');
    setTimeout(() => location.href = 'login.html?ref=checkout.html', 1000);
    return;
  }

  if (user.peran !== 'Pembeli') {
    pesan('Hanya akun Pembeli yang dapat melakukan checkout pesanan.');
    setTimeout(() => location.href = 'keranjang.html', 1200);
    return;
  }

  const kodePromo = localStorage.getItem('sb_kode_promo') || '';
  const shippingMethod = $('shipping-method');

  function renderRingkasan() {
    const method = shippingMethod ? shippingMethod.value : 'kirim';
    const nilai = Backend.ringkasan(kodePromo, method);

    if (nilai.item.length === 0) {
      pesan('Keranjang belanja kosong. Silakan tambahkan material.');
      location.href = 'keranjang.html';
      return;
    }

    const summaryEl = $('checkout-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="summary-row"><span>Subtotal (${nilai.item.length} produk)</span><strong>${uang(nilai.subtotal)}</strong></div>
        <div class="summary-row"><span>Pengiriman (${method === 'ambil' ? 'Ambil Gudang' : 'Kirim Alamat'})</span><strong>${uang(nilai.ongkir)}</strong></div>
        <div class="summary-row"><span>Diskon voucher</span><strong>−${uang(nilai.diskon)}</strong></div>
        <div class="summary-row summary-total"><span>Total Tagihan Demo</span><strong>${uang(nilai.total)}</strong></div>
        <div class="item-preview-list" style="margin-top: 15px; border-top: 1px solid var(--border); padding-top: 15px;">
          ${nilai.item.map(i => `
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
              <span>${aman(i.nama)} × ${i.jumlah}</span>
              <strong>${uang(i.harga * i.jumlah)}</strong>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  // Isi default form dari profil user
  const form = $('checkout-form');
  if (form) {
    if (form.elements['nama']) form.elements['nama'].value = user.nama || '';
    if (form.elements['alamat']) form.elements['alamat'].value = user.alamat || '';
    if (form.elements['telepon']) form.elements['telepon'].value = '081234567890';

    const today = new Date();
    const lokal = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const dateInput = $('delivery-date');
    if (dateInput) {
      dateInput.min = lokal;
      dateInput.value = lokal;
    }

    if (shippingMethod) {
      shippingMethod.onchange = renderRingkasan;
    }

    form.onsubmit = async event => {
      event.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      const errEl = $('checkout-error');
      if (errEl) errEl.textContent = '';

      try {
        const formData = Object.fromEntries(new FormData(form));
        const pesanan = await Backend.buatPesanan({
          ...formData,
          kode: kodePromo
        });
        localStorage.removeItem('sb_kode_promo');
        sinkronkanHeader();
        pesan('Pesanan demo berhasil dibuat!');
        setTimeout(() => {
          location.href = 'pembayaran.html?id=' + encodeURIComponent(pesanan.id);
        }, 600);
      } catch (err) {
        if (errEl) errEl.textContent = err.message;
        pesan(err.message);
        if (submitBtn) submitBtn.disabled = false;
      }
    };
  }

  renderRingkasan();
});
