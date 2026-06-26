(function () {
  const config = window.RIALES_BETA_CONFIG || {};
  const supabaseUrl = String(config.supabaseUrl || '').replace(/\/+$/, '');
  const supabasePublishableKey = String(config.supabasePublishableKey || '');
  const form = document.querySelector('#beta-form');
  const status = document.querySelector('#beta-form-status');

  if (!form || !status) return;

  const button = form.querySelector('button[type="submit"]');

  const setStatus = (message, type) => {
    status.textContent = message;
    status.classList.remove('success', 'error');
    if (type) status.classList.add(type);
  };

  if (!supabaseUrl || !supabasePublishableKey) {
    if (button) button.disabled = true;
    setStatus('La lista beta estará disponible cuando publiquemos el sitio oficial.', null);
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      first_name: String(data.get('first_name') || '').trim(),
      last_name: String(data.get('last_name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      email: String(data.get('email') || '').trim().toLowerCase(),
      device_type: String(data.get('device_type') || '').trim(),
      source: 'riales.app',
    };

    if (Object.values(payload).some((value) => !value)) {
      setStatus('Completá todos los campos para entrar a la beta.', 'error');
      return;
    }

    if (button) button.disabled = true;
    setStatus('Guardando tu solicitud...', null);

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/beta_waitlist`, {
        method: 'POST',
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${supabasePublishableKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        setStatus('Ese correo ya está en la lista beta de RIALES.', 'success');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      form.reset();
      setStatus('Listo. Ya estás en la lista para la beta de RIALES.', 'success');
    } catch (_) {
      setStatus('No pudimos guardar tu solicitud. Intentá nuevamente en un momento.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
