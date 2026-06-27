(function () {
  const config = window.RIALES_BETA_CONFIG || {};
  const supabaseUrl = String(config.supabaseUrl || '').replace(/\/+$/, '');
  const turnstileSiteKey = String(config.turnstileSiteKey || '');
  const functionPath = String(config.betaFunctionPath || '/functions/v1/join-beta');
  const form = document.querySelector('#beta-form');
  const status = document.querySelector('#beta-form-status');
  const turnstileSlot = document.querySelector('#beta-turnstile');

  if (!form || !status) return;

  const button = form.querySelector('button[type="submit"]');
  let turnstileWidgetId = null;
  let turnstileToken = '';

  const setStatus = (message, type) => {
    status.textContent = message;
    status.classList.remove('success', 'error');
    if (type) status.classList.add(type);
  };

  const setButtonDisabled = (isDisabled) => {
    if (button) button.disabled = isDisabled;
  };

  const resetTurnstile = () => {
    turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
  };

  const loadTurnstile = () => new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }

    const existingScript = document.querySelector('script[data-riales-turnstile]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.turnstile), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.rialesTurnstile = 'true';
    script.addEventListener('load', () => resolve(window.turnstile), { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });

  const errorMessages = {
    captcha_failed: 'No pudimos validar la verificación anti-spam. Intentá de nuevo.',
    captcha_required: 'Marcá la verificación anti-spam antes de continuar.',
    captcha_unavailable: 'La verificación anti-spam no respondió. Intentá nuevamente.',
    duplicate_email: 'Ya tenemos una solicitud con esos datos en la lista beta de RIALES.',
    duplicate_phone: 'Ya tenemos una solicitud con esos datos en la lista beta de RIALES.',
    invalid_device_type: 'Seleccioná si usás Android o iOS.',
    invalid_email: 'Revisá el correo electrónico.',
    invalid_first_name: 'Revisá tu nombre.',
    invalid_last_name: 'Revisá tu apellido.',
    invalid_payload: 'Revisá los datos del formulario.',
    invalid_phone: 'Revisá el teléfono celular.',
    origin_not_allowed: 'Este formulario solo funciona desde el sitio oficial de RIALES.',
    waitlist_full: 'La beta ya alcanzó el cupo disponible. Te avisaremos cuando abramos más espacios.',
  };

  const setupTurnstile = async () => {
    if (!supabaseUrl || !turnstileSiteKey || !turnstileSlot) {
      setButtonDisabled(true);
      setStatus('La lista beta estará disponible cuando completemos la configuración segura.', null);
      return;
    }

    setButtonDisabled(true);
    setStatus('Preparando verificación segura...', null);

    try {
      const turnstile = await loadTurnstile();
      turnstileWidgetId = turnstile.render(turnstileSlot, {
        sitekey: turnstileSiteKey,
        callback: (token) => {
          turnstileToken = token;
          setStatus('Usaremos estos datos solo para contactarte sobre la beta.', null);
        },
        'expired-callback': () => {
          turnstileToken = '';
          setStatus('La verificación venció. Marcala otra vez para continuar.', 'error');
        },
        'error-callback': () => {
          turnstileToken = '';
          setStatus('No pudimos cargar la verificación anti-spam.', 'error');
        },
      });
      setButtonDisabled(false);
      setStatus('Usaremos estos datos solo para contactarte sobre la beta.', null);
    } catch (_) {
      setButtonDisabled(true);
      setStatus('No pudimos cargar la verificación anti-spam.', 'error');
    }
  };

  setupTurnstile();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      first_name: String(data.get('first_name') || '').trim(),
      last_name: String(data.get('last_name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      email: String(data.get('email') || '').trim().toLowerCase(),
      device_type: String(data.get('device_type') || '').trim(),
      country: 'Nicaragua',
      turnstileToken,
    };

    if (!payload.first_name || !payload.last_name || !payload.phone ||
      !payload.email || !payload.device_type) {
      setStatus('Completá todos los campos para entrar a la beta.', 'error');
      return;
    }

    if (!payload.turnstileToken) {
      setStatus('Marcá la verificación anti-spam antes de continuar.', 'error');
      return;
    }

    setButtonDisabled(true);
    setStatus('Guardando tu solicitud...', null);

    try {
      const response = await fetch(`${supabaseUrl}${functionPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.ok !== true) {
        const code = String(result.code || 'server_error');
        const message = errorMessages[code] ||
          'No pudimos guardar tu solicitud. Intentá nuevamente en un momento.';
        const type = code === 'duplicate_email' || code === 'duplicate_phone' ? 'success' : 'error';
        setStatus(message, type);
        resetTurnstile();
        return;
      }

      form.reset();
      resetTurnstile();
      setStatus('Listo. Ya estás en la lista para la beta de RIALES.', 'success');
    } catch (_) {
      setStatus('No pudimos guardar tu solicitud. Intentá nuevamente en un momento.', 'error');
      resetTurnstile();
    } finally {
      setButtonDisabled(false);
    }
  });
})();
