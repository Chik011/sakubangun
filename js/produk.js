/* JS/PRODUK.JS — LOGIKA HALAMAN DETAIL PRODUK */
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id') || 'SMN-001';

  const container = $('product-detail');
  if (!container) return;

  const p = Backend.produkPublik().find(item => item.id === id);
  if (!p) {
    container.innerHTML = kosong('Produk tidak tersedia', 'Produk ini mungkin telah diarsipkan atau tidak aktif.', 'belanja.html', 'Kembali ke Katalog');
    return;
  }

  const semen = p.id === 'SMN-001';
  const foto = semen ? 'assets/detail-d6231.png' : p.foto;
  const thumbs = semen ? ['detail-80eaf.png', 'detail-87eef.png', 'detail-e9376.png', 'detail-efba0.png'] : [];

  container.innerHTML = `
    <p class="breadcrumb"><a href="index.html">Beranda</a> / <a href="belanja.html?kategori=${encodeURIComponent(p.kategori)}">${aman(p.kategori)}</a> / ${aman(p.nama)}</p>
    
    <div class="product-hero">
      <div class="product-gallery">
        ${semen ? `
          <div class="thumbnails">
            ${thumbs.map((f, i) => `
              <button data-gallery="assets/${f}" aria-label="Lihat foto produk ${i + 1}">
                <img data-asset="assets/${f}" alt="Sudut foto ${i + 1}">
              </button>
            `).join('')}
          </div>
        ` : ''}
        <div class="product-main-image">
          <img id="detail-image" data-asset="${aman(foto)}" alt="${aman(p.nama)}">
          <span class="pill yellow">${aman(p.label || 'PILIHAN PROYEK')}</span>
        </div>
      </div>
      
      <div class="product-description">
        <span class="pill">${aman(p.kategori)}</span>
        <h1>${aman(p.nama)}</h1>
        <div class="actions">
          <span class="stars">★ ${p.rating || 'Belum ada ulasan'} · rating pelanggan</span>
          <small>SKU: ${aman(p.id)}</small>
          <span class="pill green">Stok: ${p.stok} ${aman(p.satuan)}</span>
        </div>
        <div class="detail-price">${uang(p.harga)} <small>/${aman(p.satuan)}</small></div>
        <p class="note">Harga dan spesifikasi merupakan data contoh dari desain prototipe.</p>
        
        <div class="actions">
          <label>Jumlah
            <div class="quantity">
              <button type="button" id="qty-minus" aria-label="Kurangi jumlah">−</button>
              <input id="detail-quantity" type="number" min="1" max="${p.stok}" value="1" aria-label="Jumlah produk">
              <button type="button" id="qty-plus" aria-label="Tambah jumlah">+</button>
            </div>
          </label>
        </div>
        
        <div class="actions">
          <button class="button" id="btn-add-cart" ${p.stok ? '' : 'disabled'}>
            ${ikon('detail-7dce5.svg')} Tambah ke keranjang
          </button>
          <button class="button white" id="btn-buy-now" ${p.stok ? '' : 'disabled'}>
            Beli sekarang
          </button>
        </div>
        
        <div class="delivery-box">
          <h3>Estimasi ke lokasi proyek</h3>
          <p>Pengiriman demo Rp85.000 atau gratis untuk belanja minimal Rp1.500.000. Jadwal pengiriman dapat dipilih saat checkout.</p>
        </div>
      </div>
    </div>
    
    <div class="detail-lower">
      <div>
        <div class="spec-tabs">
          <button class="active" data-tab="spec">Spesifikasi</button>
          <button data-tab="desc">Deskripsi</button>
          <button data-tab="use">Cara pakai</button>
        </div>
        
        <div id="spec-panel" class="card">
          <div class="spec-row"><span>Merek</span><span>${aman(p.merek || 'Standar Bangunan')}</span></div>
          <div class="spec-row"><span>Satuan</span><span>${aman(p.satuan)}</span></div>
          <div class="spec-row"><span>Berat contoh</span><span>${p.berat || 1} kg</span></div>
          <div class="spec-row"><span>Penjual</span><span>${aman(p.penjual || 'Gudang Pusat')}</span></div>
          <p class="note">Konfirmasi spesifikasi resmi pada kemasan sebelum pembelian skala besar.</p>
        </div>
        
        <div id="desc-panel" class="card" hidden>
          <p>${semen ? 'Semen serbaguna berkualitas tinggi untuk pekerjaan pasangan bata, plester, acian, dan cor beton umum. Formula cepat rekat dan tahan lama. Simpan di tempat yang kering dan terlindung dari cuaca langsung.' : aman(p.nama) + ' pilihan tepat untuk kebutuhan konstruksi dan renovasi hunian Anda dengan standar kualitas terjamin.'}</p>
        </div>
        
        <div id="use-panel" class="card" hidden>
          <p>Gunakan perlengkapan keselamatan kerja (sarung tangan, masker debu, kacamata pelindung). Ikuti takaran air dan semen yang dianjurkan pada label kemasan. Konsultasikan kebutuhan struktur bersama tukang atau mandor berpengalaman.</p>
        </div>
      </div>
      
      ${semen ? `
        <aside class="card calculator">
          ${ikon('detail-7e038.svg')}
          <h3>Butuh berapa sak?</h3>
          <p>Estimasi kebutuhan plester dinding.</p>
          <form id="calculator-form">
            <label>Luas dinding (m²)
              <input id="calc-area" type="number" min="1" max="10000" value="48" required>
            </label>
            <p id="calc-result">Perkiraan 12–14 sak</p>
            <button class="button" type="submit">Hitung ulang</button>
            <button class="button white" type="button" id="calc-add">Tambah estimasi ke keranjang</button>
          </form>
          <small>Asumsi ilustrasi demo 0,29 sak/m². Kebutuhan nyata bergantung ketebalan dan campuran.</small>
        </aside>
      ` : `
        <aside class="card">
          <h3>Butuh konsultasi material?</h3>
          <p>Tim ahli kami siap membantu menghitung volume kebutuhan bahan untuk efisiensi biaya proyek Anda.</p>
          <button class="button pale" data-help="Konsultasi proyek">Buka panduan</button>
        </aside>
      `}
    </div>
    
    <section>
      <h2>Ulasan pelanggan</h2>
      <p class="note">Contoh ulasan dari proyek yang telah selesai.</p>
      <div class="testimonials related">
        <article class="card">
          <span class="stars">★ 5.0</span>
          <p>“Semen datang kering, kemasan utuh. Kurir konfirmasi sebelum tiba di lokasi proyek.”</p>
          <small>Fajar · Tangerang</small>
        </article>
        <article class="card">
          <span class="stars">★ 4.8</span>
          <p>“Pengiriman sesuai slot pagi. Jumlah sak pas dan tim bongkar muat sigap.”</p>
          <small>Raka · Depok</small>
        </article>
        <article class="card">
          <span class="stars">★ 4.7</span>
          <p>“Admin sangat membantu saat ditanya estimasi kebutuhan plester.”</p>
          <small>Mita · Jakarta Selatan</small>
        </article>
      </div>
    </section>
    
    <section class="related">
      <h2>Sering dibeli bersama</h2>
      <div class="product-grid four related">
        ${Backend.produkPublik().filter(x => x.id !== p.id).slice(0, 4).map(x => kartuProduk(x)).join('')}
      </div>
    </section>
  `;

  // Gallery click
  container.querySelectorAll('[data-gallery]').forEach(btn => {
    btn.onclick = () => {
      const mainImg = $('detail-image');
      if (mainImg) {
        mainImg.dataset.asset = btn.dataset.gallery;
        siapkanAset();
      }
    };
  });

  // Quantity controls
  const qtyInput = $('detail-quantity');
  $('qty-minus')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  $('qty-plus')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.min(p.stok, Number(qtyInput.value) + 1);
  });

  // Add to cart & Buy now
  $('btn-add-cart')?.addEventListener('click', () => {
    const jumlah = Number(qtyInput?.value || 1);
    try {
      Backend.tambahTas(p.id, jumlah);
      sinkronkanHeader();
      pesan(`${jumlah} ${p.satuan} ${p.nama} ditambahkan ke keranjang.`);
    } catch (err) {
      pesan(err.message);
    }
  });

  $('btn-buy-now')?.addEventListener('click', () => {
    const jumlah = Number(qtyInput?.value || 1);
    try {
      Backend.tambahTas(p.id, jumlah);
      sinkronkanHeader();
      location.href = 'keranjang.html';
    } catch (err) {
      pesan(err.message);
    }
  });

  // Tab controls
  container.querySelectorAll('[data-tab]').forEach(tabBtn => {
    tabBtn.onclick = () => {
      container.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      const target = tabBtn.dataset.tab;
      ['spec', 'desc', 'use'].forEach(name => {
        const panel = $(name + '-panel');
        if (panel) panel.hidden = (name !== target);
      });
    };
  });

  // Cement calculator
  const calcForm = $('calculator-form');
  if (calcForm) {
    calcForm.onsubmit = e => {
      e.preventDefault();
      const area = Number($('calc-area')?.value || 0);
      const estMin = Math.ceil(area * 0.25);
      const estMax = Math.ceil(area * 0.29);
      const res = $('calc-result');
      if (res) res.textContent = `Perkiraan ${estMin}–${estMax} sak untuk luas ${area} m²`;
    };

    $('calc-add')?.addEventListener('click', () => {
      const area = Number($('calc-area')?.value || 0);
      const total = Math.ceil(area * 0.29);
      if (total < 1) {
        pesan('Masukkan luas dinding yang valid.');
        return;
      }
      try {
        Backend.tambahTas('SMN-001', total);
        sinkronkanHeader();
        pesan(`${total} sak semen ditambahkan ke keranjang.`);
      } catch (err) {
        pesan(err.message);
      }
    });
  }

  siapkanAset();
});
