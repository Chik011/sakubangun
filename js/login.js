/* JS/LOGIN.JS — LOGIKA HALAMAN LOGIN & AKSES CEPAT */
document.addEventListener('DOMContentLoaded', () => {
  const user = Backend.pengguna();
  if (user) {
    // Sudah login
    if (['Admin', 'Penjual'].includes(user.peran)) {
      location.href = 'dashboard.html';
    } else {
      location.href = 'profil.html';
    }
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const refUrl = urlParams.get('ref');

  function lanjutSetelahLogin(akun) {
    if (refUrl) {
      location.href = refUrl;
      return;
    }
    if (['Admin', 'Penjual'].includes(akun.peran)) {
      location.href = 'dashboard.html';
    } else {
      location.href = 'profil.html';
    }
  }

  const authForm = $('login-form');
  const authError = $('auth-error');

  if (authForm) {
    authForm.onsubmit = async event => {
      event.preventDefault();
      const submitBtn = $('auth-submit');
      if (submitBtn) submitBtn.disabled = true;
      if (authError) authError.textContent = '';

      const u = $('username')?.value.trim();
      const p = $('password')?.value;

      try {
        const akun = await Backend.masuk(u, p);
        pesan(`Selamat datang, ${akun.nama}!`);
        setTimeout(() => lanjutSetelahLogin(akun), 500);
      } catch (err) {
        if (authError) authError.textContent = err.message;
        pesan(err.message);
        if (submitBtn) submitBtn.disabled = false;
      }
    };
  }

  // Quick 1-Click Demo Login Buttons
  document.querySelectorAll('[data-quick-login]').forEach(btn => {
    btn.onclick = async () => {
      const u = btn.dataset.quickLogin;
      const p = '123';
      try {
        const akun = await Backend.masuk(u, p);
        pesan(`Login instan sebagai ${akun.nama} (${akun.peran})`);
        setTimeout(() => lanjutSetelahLogin(akun), 400);
      } catch (err) {
        if (authError) authError.textContent = err.message;
        pesan(err.message);
      }
    };
  });
});
