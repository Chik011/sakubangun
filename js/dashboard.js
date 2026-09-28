/* JS/DASHBOARD.JS — LOGIKA DASHBOARD ADMIN & PENJUAL */
document.addEventListener('DOMContentLoaded', () => {
  const user = Backend.pengguna();
  if (!user || !['Admin', 'Penjual'].includes(user.peran)) {
    pesan('Dashboard hanya dapat diakses oleh Admin atau Penjual.');
    setTimeout(() => location.href = 'login.html', 800);
    return;
  }

  let halamanDashboard = (location.hash.slice(1) || 'ringkasan').split('/')[0];
  let fotoEdit = '';

  const menuDashboard = [
    ['ringkasan', 'Ringkasan', 'admin-63a64.svg'],
    ['produk', 'Produk & Stok', 'admin-2dbd5.svg'],
    ['pesanan', 'Pesanan', 'admin-a807e.svg'],
    ['pengiriman', 'Pengiriman', 'admin-2689e.svg'],
    ['pelanggan', 'Pelanggan', 'admin-4be0c.svg'],
    ['promosi', 'Promosi', 'admin-8d734.svg'],
    ['analitik', 'Analitik', 'admin-387f6.svg']
  ];

  function stat(nilai, judul, icon, color = 'green') {
    return `<article class="card stat-card"><div><span class="soft ${color}">${ikon(icon)}</span><span class="pill ${color}">Sesi demo</span></div><strong>${nilai}</strong><small>${judul}</small></article>`;
  }

  function statusKontrol(p) {
    const opsi = {
      'Menunggu pembayaran': ['Dibatalkan'],
      'Disiapkan': ['Siap kirim', 'Dibatalkan'],
      'Siap kirim': ['Dalam perjalanan', 'Dibatalkan'],
      'Dalam perjalanan': ['Terkirim']
    };
    return `<div class="actions">
      <a class="text-button" href="lacak.html?id=${encodeURIComponent(p.id)}">Detail</a>
      ${opsi[p.status] ? `
        <select class="status-select" data-order-update="${p.id}" aria-label="Ubah status ${p.id}">
          <option value="">Ubah status...</option>
          ${opsi[p.status].map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      ` : ''}
    </div>`;
  }

  function tabelPesanan(daftar, kelola = false) {
    if (!daftar.length) {
      return kosong('Belum ada pesanan', 'Pesanan yang masuk dari pembeli akan muncul di sini.', 'index.html', 'Buka Toko');
    }
    return `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>ID Pesanan</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>${kelola ? 'Tindakan' : 'Detail'}</th></tr>
          </thead>
          <tbody>
            ${daftar.map(p => `
              <tr>
                <td><strong>${aman(p.id)}</strong><small>${aman(p.tanggal)} (${aman(p.slot)})</small></td>
                <td>${aman(p.nama)}</td>
                <td>${uang(p.total)}</td>
                <td>${statusPill(p.status)}</td>
                <td>${kelola ? statusKontrol(p) : `<a class="text-button" href="lacak.html?id=${encodeURIComponent(p.id)}">Lihat →</a>`}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function tampilDashboard() {
    if (user.peran === 'Penjual' && ['pelanggan', 'promosi'].includes(halamanDashboard)) {
      halamanDashboard = 'ringkasan';
    }

    const roleEl = $('dashboard-role');
    if (roleEl) roleEl.textContent = user.peran.toUpperCase() + ' · SAKUBANGUN DEMO';

    const navEl = $('dashboard-nav');
    if (navEl) {
      navEl.innerHTML = menuDashboard
        .filter(m => user.peran === 'Admin' || !['pelanggan', 'promosi'].includes(m[0]))
        .map(m => `<a class="${m[0] === halamanDashboard ? 'active' : ''}" href="#${m[0]}">${ikon(m[2])} ${m[1]}</a>`)
        .join('');
    }

    const activeMenu = menuDashboard.find(m => m[0] === halamanDashboard) || menuDashboard[0];
    const titleEl = $('dashboard-title');
    if (titleEl) titleEl.textContent = activeMenu[1];

    const produk = Backend.produkMilik();
    const orders = Backend.daftarPesanan();
    const lunas = orders.filter(p => !['Dibatalkan', 'Menunggu pembayaran'].includes(p.status));
    const pendapatan = lunas.reduce((s, p) => s + p.total, 0);

    const stats = '<div class="stats">' +
      stat(uang(pendapatan), 'Penjualan simulasi', 'admin-a5796.svg') +
      stat(orders.length, 'Pesanan demo', 'admin-3c81d.svg', 'blue') +
      stat(produk.length, 'Produk dikelola', 'admin-93e95.svg', 'lilac') +
      stat(produk.filter(p => p.stok < 20).length, 'Stok perlu perhatian', 'admin-2613c.svg', 'peach') +
      '</div>';

    const konten = $('dashboard-content');
    if (!konten) return;

    if (['ringkasan', 'analitik'].includes(halamanDashboard)) {
      const perKategori = (DATA.kategori || []).map(k => ({
        nama: k,
        nilai: lunas.reduce((s, p) => s + p.item.filter(i => i.kategori === k).reduce((n, i) => n + i.harga * i.jumlah, 0), 0)
      })).filter(k => k.nilai > 0);
      const maks = Math.max(1, ...perKategori.map(k => k.nilai));

      const bars = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + i);
        const nilai = lunas.filter(p => new Date(p.dibuat).toDateString() === date.toDateString()).reduce((s, p) => s + p.total, 0);
        return { label: date.toLocaleDateString('id-ID', { weekday: 'short' }), nilai };
      });
      const maxBar = Math.max(1, ...bars.map(b => b.nilai));

      konten.innerHTML = `
        <div class="dashboard-banner">
          <div>
            <h2>Halo, ${aman(user.nama)}! Kelola operasional toko dari sini.</h2>
            <p>${orders.filter(p => p.status === 'Disiapkan').length} pesanan perlu diproses, ${produk.filter(p => p.stok < 20).length} stok perlu perhatian.</p>
          </div>
          <div class="actions">
            <a class="button" href="#pesanan">Proses Pesanan</a>
            <button class="button white" id="btn-add-product">＋ Tambah Produk</button>
          </div>
        </div>
        ${stats}
        <div class="dashboard-grid">
          <section class="card">
            <div class="section-title">
              <h3>Tren Penjualan 7 Hari Terakhir</h3>
              <span class="pill">Simulasi</span>
            </div>
            <h2>${uang(pendapatan)}</h2>
            <small>Total transaksi berhasil pada sesi ini</small>
            <div class="bar-chart" role="img" aria-label="Grafik penjualan">
              ${bars.map(b => `
                <div class="bar-column">
                  <div style="height:${Math.max(4, b.nilai / maxBar * 160)}px" title="${uang(b.nilai)}"></div>
                  <small>${b.label}</small>
                </div>
              `).join('')}
            </div>
          </section>
          
          <section class="card category-performance">
            <h3>Kinerja Kategori Produk</h3>
            ${perKategori.length ? perKategori.map(k => `
              <div>
                <div class="summary-row"><strong>${aman(k.nama)}</strong><span>${uang(k.nilai)}</span></div>
                <div class="meter"><span style="width:${k.nilai / maks * 100}%"></span></div>
              </div>
            `).join('') : '<p>Belum ada penjualan. Grafik terisi otomatis setelah pembeli menyelesaikan pesanan demo.</p>'}
          </section>
        </div>
        
        <div class="dashboard-grid">
          <section class="card">
            <div class="section-title"><h3>Pesanan Terbaru</h3><a href="#pesanan">Semua pesanan →</a></div>
            ${tabelPesanan(orders.slice(0, 5))}
          </section>
          <section class="card">
            <div class="section-title"><h3>Peringatan Stok Rendah</h3><a href="#produk">Kelola stok →</a></div>
            ${produk.filter(p => p.stok < 20).map(p => `
              <div class="stock-alert">
                ${ikon('admin-896e6.svg')}
                <div><strong>${aman(p.nama)}</strong><small>Tersisa ${p.stok} ${aman(p.satuan)}</small></div>
                ${statusPill(p.stok ? 'Rendah' : 'Habis')}
              </div>
            `).join('') || '<p>Semua stok material dalam kondisi aman.</p>'}
          </section>
        </div>
      `;
    } else if (halamanDashboard === 'produk') {
      konten.innerHTML = `
        ${stats}
        <div class="inventory-tools">
          <input id="inventory-search" placeholder="Cari nama, SKU, atau merek..." aria-label="Cari inventori">
          <select id="inventory-stock" aria-label="Filter stok">
            <option value="">Semua stok</option>
            <option value="low">Stok rendah (&lt; 20)</option>
            <option value="empty">Stok habis</option>
          </select>
          <button class="button" id="btn-add-product">＋ Tambah Produk</button>
        </div>
        <section class="card">
          <h3>Daftar Produk Toko</h3>
          <div id="inventory-table"></div>
        </section>
      `;
      tampilInventori();
    } else if (['pesanan', 'pengiriman'].includes(halamanDashboard)) {
      konten.innerHTML = `
        <div class="catalog-toolbar">
          <input id="admin-order-search" placeholder="Cari nomor pesanan atau nama pelanggan..." aria-label="Cari pesanan">
          <select id="admin-order-status" aria-label="Filter status">
            <option value="">Semua status pesanan</option>
            ${['Menunggu pembayaran', 'Disiapkan', 'Siap kirim', 'Dalam perjalanan', 'Terkirim', 'Dibatalkan'].map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <section class="card">
          <h3>${halamanDashboard === 'pengiriman' ? 'Kelola Status Pengiriman' : 'Daftar Semua Pesanan'}</h3>
          <div id="admin-orders-table"></div>
        </section>
      `;
      tampilOrderAdmin();
    } else if (halamanDashboard === 'pelanggan') {
      konten.innerHTML = `
        <div class="notice">Admin dapat mengelola hak akses akun pengguna atau menonaktifkan akun demo.</div>
        <section class="card related">
          <h3>Daftar Pengguna & Penjual</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                ${Backend.data.akun.map(u => `
                  <tr>
                    <td>${aman(u.nama)}</td>
                    <td>${aman(u.username)}</td>
                    <td>
                      <select class="customer-select" id="role-${aman(u.username)}" ${u.username === user.username ? 'disabled' : ''}>
                        ${['Pembeli', 'Penjual', 'Admin'].map(r => `<option ${u.peran === r ? 'selected' : ''}>${r}</option>`).join('')}
                      </select>
                    </td>
                    <td>
                      <label class="check">
                        <input type="checkbox" id="active-${aman(u.username)}" ${u.aktif ? 'checked' : ''} ${u.username === user.username ? 'disabled' : ''}> Aktif
                      </label>
                    </td>
                    <td>
                      <button class="button pale small" data-user-save="${aman(u.username)}" ${u.username === user.username ? 'disabled' : ''}>Simpan</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
      `;
    } else if (halamanDashboard === 'promosi') {
      konten.innerHTML = `
        <div class="section-title">
          <div><h2>Voucher & Promosi</h2><p>Voucher aktif dapat digunakan pembeli saat checkout.</p></div>
          <button class="button" id="btn-new-promo">Buat Promosi Baru</button>
        </div>
        <div class="shortcut-grid">
          ${Backend.data.promo.map(p => `
            <article class="card">
              ${statusPill(p.aktif ? 'Aktif' : 'Nonaktif')}
              <h2 style="margin: 12px 0 6px;">${aman(p.kode)}</h2>
              <p>Diskon <strong>${p.persen}%</strong> hingga <strong>${uang(p.maksimum)}</strong></p>
              <p style="font-size:12px;">Minimal belanja ${uang(p.minimum)}</p>
              <button class="button white related" data-promo-toggle="${aman(p.kode)}" style="margin-top:14px;">
                ${p.aktif ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </article>
          `).join('')}
        </div>
      `;
    }

    siapkanAset();
  }

  function tampilInventori() {
    const q = ($('inventory-search')?.value || '').toLowerCase().trim();
    const status = $('inventory-stock')?.value || '';
    const produk = Backend.produkMilik().filter(p =>
      (p.nama + ' ' + p.id + ' ' + (p.merek || '')).toLowerCase().includes(q) &&
      (!status || (status === 'low' ? p.stok > 0 && p.stok < 20 : p.stok === 0))
    );

    const tbl = $('inventory-table');
    if (!tbl) return;

    tbl.innerHTML = produk.length ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Produk / SKU</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            ${produk.map(p => `
              <tr>
                <td>
                  <div class="table-product">
                    <img data-asset="${aman(p.foto)}" alt="">
                    <div><strong>${aman(p.nama)}</strong><small>${aman(p.id)}</small></div>
                  </div>
                </td>
                <td>${aman(p.kategori)}</td>
                <td>${uang(p.harga)}</td>
                <td>${p.stok} ${aman(p.satuan)}</td>
                <td>${statusPill(!p.aktif ? 'Nonaktif' : p.stok === 0 ? 'Habis' : p.stok < 20 ? 'Rendah' : 'Aktif')}</td>
                <td>
                  <div class="actions">
                    <button class="button pale small" data-product-edit="${aman(p.id)}">Edit</button>
                    <button class="button white small" data-product-toggle="${aman(p.id)}">${p.aktif ? 'Arsipkan' : 'Aktifkan'}</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<p class="empty">Tidak ada produk yang cocok dengan pencarian.</p>';

    siapkanAset();
  }

  function tampilOrderAdmin() {
    const q = ($('admin-order-search')?.value || '').toLowerCase().trim();
    const status = $('admin-order-status')?.value || '';
    const list = Backend.daftarPesanan().filter(p =>
      (p.id + ' ' + p.nama).toLowerCase().includes(q) && (!status || status === p.status)
    );
    const tbl = $('admin-orders-table');
    if (tbl) tbl.innerHTML = tabelPesanan(list, true);
    siapkanAset();
  }

  function bukaProdukForm(id = '') {
    const p = id ? Backend.produkMilik().find(item => item.id === id) : null;
    const dlg = $('product-dialog');
    const form = $('product-form');
    if (!dlg || !form) return;

    form.reset();
    $('product-error').textContent = '';
    $('edit-product-title').textContent = p ? 'Edit Produk & Stok' : 'Tambah Produk Baru';
    $('edit-id').value = p?.id || '';
    $('edit-name').value = p?.nama || '';
    
    const catSelect = $('edit-category');
    if (catSelect && catSelect.options.length === 0) {
      DATA.kategori.forEach(k => catSelect.add(new Option(k, k)));
    }
    if (catSelect) catSelect.value = p?.kategori || DATA.kategori[0];

    $('edit-brand').value = p?.merek || '';
    $('edit-price').value = p?.harga || '';
    $('edit-unit').value = p?.satuan || 'sak';
    $('edit-stock').value = p?.stok ?? 10;
    fotoEdit = p?.foto || 'assets/home-52ae7.png';

    const prev = $('edit-preview');
    if (prev) {
      prev.hidden = !fotoEdit;
      prev.dataset.asset = fotoEdit;
      prev.src = fotoEdit;
    }
    dlg.showModal();
    siapkanAset();
  }

  // Hash Navigation listener
  window.addEventListener('hashchange', () => {
    halamanDashboard = (location.hash.slice(1) || 'ringkasan').split('/')[0];
    tampilDashboard();
  });

  // Event delegations
  document.addEventListener('click', async e => {
    const b = e.target.closest('button, a');
    if (!b) return;

    if (b.id === 'btn-add-product') bukaProdukForm();
    if (b.dataset.productEdit) bukaProdukForm(b.dataset.productEdit);

    if (b.dataset.productToggle) {
      konfirmasi('Ubah status aktif produk ini? Produk yang diarsipkan tidak akan tampil di katalog belanja pembeli.', async () => {
        await Backend.aktifProduk(b.dataset.productToggle);
        tampilDashboard();
        pesan('Status produk berhasil diperbarui.');
      });
    }

    if (b.dataset.userSave) {
      const username = b.dataset.userSave;
      const role = $('role-' + username)?.value;
      const active = $('active-' + username)?.checked;
      try {
        await Backend.ubahAkun(username, role, active);
        tampilDashboard();
        pesan(`Akun ${username} berhasil diperbarui.`);
      } catch (err) {
        pesan(err.message);
      }
    }

    if (b.id === 'btn-new-promo') {
      const dlg = $('promo-dialog');
      if (dlg) {
        $('promo-form')?.reset();
        $('promo-error').textContent = '';
        dlg.showModal();
      }
    }

    if (b.dataset.promoToggle) {
      const kode = b.dataset.promoToggle;
      const pr = Backend.data.promo.find(x => x.kode === kode);
      if (pr) {
        pr.aktif = !pr.aktif;
        Backend.simpanSemua();
        tampilDashboard();
        pesan(`Status voucher ${kode} diubah.`);
      }
    }

    if (b.id === 'dashboard-export') {
      const orders = Backend.daftarPesanan();
      const csv = [['Nomor Pesanan', 'Pelanggan', 'Jadwal', 'Total', 'Status'], ...orders.map(p => [p.id, p.nama, p.tanggal, p.total, p.status])]
        .map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))
        .join('\r\n');
      unduh('laporan-pesanan-demo.csv', csv, 'text/csv;charset=utf-8');
    }
  });

  // Input & Change listeners
  document.addEventListener('input', e => {
    if (e.target.id === 'inventory-search') tampilInventori();
    if (e.target.id === 'admin-order-search') tampilOrderAdmin();
  });

  document.addEventListener('change', e => {
    if (e.target.id === 'inventory-stock') tampilInventori();
    if (e.target.id === 'admin-order-status') tampilOrderAdmin();
    if (e.target.dataset.orderUpdate && e.target.value) {
      const status = e.target.value;
      const orderId = e.target.dataset.orderUpdate;
      konfirmasi(`Ubah status pesanan ${orderId} menjadi "${status}"?`, async () => {
        await Backend.ubahStatus(orderId, status);
        tampilDashboard();
        pesan(`Status pesanan ${orderId} diubah menjadi ${status}.`);
      });
      e.target.value = '';
    }
  });

  // Forms
  const prodForm = $('product-form');
  if (prodForm) {
    prodForm.onsubmit = async event => {
      event.preventDefault();
      try {
        await Backend.simpanProduk({
          id: $('edit-id').value,
          nama: $('edit-name').value,
          kategori: $('edit-category').value,
          merek: $('edit-brand').value,
          harga: Number($('edit-price').value),
          satuan: $('edit-unit').value,
          stok: Number($('edit-stock').value),
          foto: fotoEdit || 'assets/home-52ae7.png'
        });
        $('product-dialog').close();
        tampilDashboard();
        pesan('Produk berhasil disimpan.');
      } catch (err) {
        $('product-error').textContent = err.message;
      }
    };
  }

  const promoForm = $('promo-form');
  if (promoForm) {
    promoForm.onsubmit = async event => {
      event.preventDefault();
      const fd = Object.fromEntries(new FormData(promoForm));
      try {
        await Backend.simpanPromo({
          kode: fd.kode,
          persen: Number(fd.persen),
          maksimum: Number(fd.maksimum),
          minimum: Number(fd.minimum)
        });
        $('promo-dialog').close();
        tampilDashboard();
        pesan('Voucher promo baru berhasil dibuat.');
      } catch (err) {
        $('promo-error').textContent = err.message;
      }
    };
  }

  // Initial render
  tampilDashboard();
});
