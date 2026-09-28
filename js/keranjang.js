/* JS/KERANJANG.JS — LOGIKA HALAMAN KERANJANG BELANJA */
document.addEventListener('DOMContentLoaded', () => {
  let kodePromo = localStorage.getItem('sb_kode_promo') || '';

  function ringkasanHTML(nilai) {
    return `
      <div class="summary-row"><span>Subtotal</span><strong>${uang(nilai.subtotal)}</strong></div>
      <div class="summary-row"><span>Estimasi pengiriman</span><strong>${uang(nilai.ongkir)}</strong></div>
      <div class="summary-row"><span>Diskon voucher</span><strong>−${uang(nilai.diskon)}</strong></div>
      <div class="summary-row summary-total"><span>Total Pembayaran</span><strong>${uang(nilai.total)}</strong></div>
    `;
  }

  function renderKeranjang() {
    let nilai;
    try {
      nilai = Backend.ringkasan(kodePromo);
    } catch (err) {
      kodePromo = '';
      localStorage.removeItem('sb_kode_promo');
      pesan(err.message);
      nilai = Backend.ringkasan('');
    }

    const cartList = $('cart-list');
    const cartSummary = $('cart-summary');
    const couponInput = $('cart-coupon');
    const btnCheckout = $('btn-to-checkout');

    if (couponInput) couponInput.value = kodePromo;

    if (cartList) {
      if (nilai.item.length === 0) {
        cartList.innerHTML = kosong('Keranjang belanja kosong', 'Belum ada produk yang ditambahkan. Silakan pilih material kebutuhan proyekmu.', 'belanja.html', 'Mulai Belanja');
        if (btnCheckout) {
          btnCheckout.classList.add('disabled');
          btnCheckout.style.pointerEvents = 'none';
          btnCheckout.style.opacity = '0.5';
        }
      } else {
        if (btnCheckout) {
          btnCheckout.classList.remove('disabled');
          btnCheckout.style.pointerEvents = 'auto';
          btnCheckout.style.opacity = '1';
        }
        cartList.innerHTML = nilai.item.map(p => `
          <div class="cart-item">
            <img data-asset="${aman(p.foto)}" alt="${aman(p.nama)}">
            <div class="item-copy">
              <h3>${aman(p.nama)}</h3>
              <p>${uang(p.harga)} <small>/${aman(p.satuan)}</small></p>
              <div class="quantity">
                <button data-cart-qty="${p.id}" data-delta="-1" aria-label="Kurangi ${aman(p.nama)}">−</button>
                <span>${p.jumlah}</span>
                <button data-cart-qty="${p.id}" data-delta="1" aria-label="Tambah ${aman(p.nama)}">+</button>
              </div>
              <button class="text-button" data-cart-remove="${p.id}">Hapus dari keranjang</button>
            </div>
            <strong>${uang(p.harga * p.jumlah)}</strong>
          </div>
        `).join('');
      }
    }

    if (cartSummary) {
      cartSummary.innerHTML = ringkasanHTML(nilai);
    }

    sinkronkanHeader();
    siapkanAset();
  }

  // Handle promo coupon
  $('apply-coupon')?.addEventListener('click', () => {
    const input = $('cart-coupon');
    const msg = $('coupon-message');
    const kode = input?.value.trim().toUpperCase() || '';
    if (!kode) {
      kodePromo = '';
      localStorage.removeItem('sb_kode_promo');
      if (msg) msg.textContent = 'Kode promo dihapus.';
      renderKeranjang();
      return;
    }

    try {
      Backend.ringkasan(kode);
      kodePromo = kode;
      localStorage.setItem('sb_kode_promo', kode);
      if (msg) {
        msg.textContent = 'Kode ' + kode + ' berhasil diterapkan!';
        msg.style.color = '#07845a';
      }
      renderKeranjang();
    } catch (err) {
      if (msg) {
        msg.textContent = err.message;
        msg.style.color = '#ba2845';
      }
    }
  });

  // Quantity and remove delegation
  document.addEventListener('click', e => {
    const qtyBtn = e.target.closest('[data-cart-qty]');
    if (qtyBtn) {
      const id = qtyBtn.dataset.cartQty;
      const delta = Number(qtyBtn.dataset.delta);
      try {
        Backend.tambahTas(id, delta);
        renderKeranjang();
      } catch (err) {
        pesan(err.message);
      }
      return;
    }

    const removeBtn = e.target.closest('[data-cart-remove]');
    if (removeBtn) {
      const id = removeBtn.dataset.cartRemove;
      Backend.hapusDariTas(id);
      renderKeranjang();
      pesan('Produk dihapus dari keranjang.');
    }
  });

  renderKeranjang();
});
