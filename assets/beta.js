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
  let submitting = false;

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
    invalid_email: 'Revisá el correo electrónico.',
    invalid_payload: 'Revisá los datos del formulario.',
    origin_not_allowed: 'Este formulario solo funciona desde el sitio oficial de RIALES.',
    waitlist_full: 'El registro anticipado alcanzó el cupo disponible. Intentá más adelante.',
  };

  const setupTurnstile = async () => {
    if (!supabaseUrl || !turnstileSiteKey || !turnstileSlot) {
      setButtonDisabled(true);
      setStatus('El registro anticipado no está disponible en este momento. Intentá más tarde.', null);
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
        },
        'expired-callback': () => {
          turnstileToken = '';
          setStatus('La verificación venció. Marcala otra vez para continuar.', 'error');
        },
        'error-callback': () => {
          turnstileToken = '';
          setStatus('No pudimos cargar la verificación anti-spam.', 'error');
        },
        size: 'flexible',
      });
      setButtonDisabled(false);
      setStatus('Usaremos tu correo solo para contactarte sobre RIALES en iOS.', null);
    } catch (_) {
      setButtonDisabled(true);
      setStatus('No pudimos cargar la verificación anti-spam.', 'error');
    }
  };

  setupTurnstile();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting || !supabaseUrl || !turnstileSiteKey) return;
    const data = new FormData(form);
    const payload = {
      email: String(data.get('email') || '').trim().toLowerCase(),
      device_type: 'ios',
      turnstileToken,
    };

    if (!payload.email) {
      setStatus('Ingresá tu correo para completar el registro anticipado.', 'error');
      return;
    }

    if (!payload.turnstileToken) {
      setStatus('Marcá la verificación anti-spam antes de continuar.', 'error');
      return;
    }

    submitting = true;
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
        setStatus(message, 'error');
        resetTurnstile();
        return;
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'beta_signup_success' });
      form.reset();
      resetTurnstile();
      setStatus('Recibimos tu solicitud de registro anticipado. Si hay acceso disponible para iOS, te contactaremos por correo.', 'success');
    } catch (_) {
      setStatus('No pudimos guardar tu solicitud. Intentá nuevamente en un momento.', 'error');
      resetTurnstile();
    } finally {
      submitting = false;
      setButtonDisabled(false);
    }
  });
})();
