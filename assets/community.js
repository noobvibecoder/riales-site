(function () {
  const section = document.querySelector('#hero-community');
  const count = document.querySelector('#hero-community-count');
  const config = window.RIALES_BETA_CONFIG || {};
  if (!section || !count || !config.supabaseUrl || !config.supabasePublishableKey) return;

  let endpoint;
  try {
    const base = new URL(config.supabaseUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
    if (base.protocol !== 'https:' && !(local && base.protocol === 'http:')) return;
    endpoint = new URL('/rest/v1/site_community_statistics', base);
    endpoint.search = 'select=registered_users_rounded,updated_at&id=eq.true&limit=1';
  } catch (_) {
    return;
  }

  const cacheKey = 'riales-community-v1:' + endpoint.origin;
  const formatter = new Intl.NumberFormat('en-US');
  const validSnapshot = (value) => {
    if (!value || typeof value !== 'object') return false;
    const total = value.registered_users_rounded;
    const timestamp = typeof value.updated_at === 'string' ? Date.parse(value.updated_at) : NaN;
    return Number.isSafeInteger(total) && total >= 0 && total % 100 === 0 &&
      Number.isFinite(timestamp) && timestamp <= Date.now() + 300000;
  };
  const render = (snapshot) => {
    count.textContent = '+' + formatter.format(snapshot.registered_users_rounded);
    section.hidden = snapshot.registered_users_rounded < 100;
  };
  try {
    const cached = JSON.parse(window.localStorage.getItem(cacheKey));
    if (validSnapshot(cached)) render(cached);
  } catch (_) {
    // Storage is optional; the public request still works when it is disabled.
  }

  let pending = false;
  let lastAttempt = 0;
  const refresh = async () => {
    if (pending) return;
    pending = true;
    lastAttempt = Date.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(endpoint.href, {
        headers: { apikey: config.supabasePublishableKey, Accept: 'application/json' },
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        signal: controller.signal,
      });
      if (!response.ok) return;
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length !== 1 || !validSnapshot(rows[0])) return;
      const snapshot = {
        registered_users_rounded: rows[0].registered_users_rounded,
        updated_at: rows[0].updated_at,
      };
      render(snapshot);
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(snapshot));
      } catch (_) {
        // Keep the fresh value visible even when storage is unavailable.
      }
    } catch (_) {
      // Preserve the last successful value; never replace an error with zero.
    } finally {
      window.clearTimeout(timeout);
      pending = false;
    }
  };

  refresh();
  window.setInterval(() => {
    if (!document.hidden) refresh();
  }, 3600000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastAttempt >= 300000) refresh();
  });
})();
