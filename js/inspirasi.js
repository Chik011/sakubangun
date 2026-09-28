/* JS/INSPIRASI.JS — LOGIKA HALAMAN INSPIRASI PROYEK */
document.addEventListener('DOMContentLoaded', () => {
  const container = $('inspiration-list');
  if (!container || typeof DATA === 'undefined') return;

  container.innerHTML = DATA.inspirasi.map((item, i) => `
    <button class="inspiration-card" id="ide-${i}" data-inspiration="${i}">
      <img data-asset="${item.foto}" alt="${aman(item.judul)}" loading="lazy">
      <span class="pill">${aman(item.kategori)}</span>
      <span class="caption">
        <h3>${aman(item.judul)}</h3>
        <small>${aman(item.catatan)}</small>
      </span>
    </button>
  `).join('');

  container.querySelectorAll('[data-inspiration]').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.inspiration);
      const item = DATA.inspirasi[idx];
      if (item) {
        info(item.judul, `
          <img data-asset="${item.foto}" alt="${aman(item.judul)}" style="width:100%; border-radius:16px; max-height:360px; object-fit:cover;">
          <p style="margin-top:16px; font-size:15px; line-height:1.6; color:var(--text);">${aman(item.isi)}</p>
        `);
        siapkanAset();
      }
    };
  });

  siapkanAset();
});
