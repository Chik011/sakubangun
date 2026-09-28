/* JS/REGISTER.JS — LOGIKA HALAMAN PENDAFTARAN AKUN */
document.addEventListener('DOMContentLoaded', () => {
  const user = Backend.pengguna();
  if (user) {
    location.href = 'profil.html';
    return;
  }

  const regForm = $('register-form');
  const regError = $('register-error');

  if (regForm) {
    regForm.onsubmit = async event => {
      event.preventDefault();
      const submitBtn = $('register-submit');
      if (submitBtn) submitBtn.disabled = true;
      if (regError) regError.textContent = '';

      const nama = $('reg-name')?.value.trim();
      const username = $('reg-username')?.value.trim();
      const password = $('reg-password')?.value;

      try {
        const akun = await Backend.daftar(nama, username, password);
        pesan(`Pendaftaran berhasil! Selamat datang, ${akun.nama}.`);
        setTimeout(() => {
          location.href = 'profil.html';
        }, 600);
      } catch (err) {
        if (regError) regError.textContent = err.message;
        pesan(err.message);
        if (submitBtn) submitBtn.disabled = false;
      }
    };
  }
});
