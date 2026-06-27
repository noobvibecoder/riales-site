(function () {
  const buttons = document.querySelectorAll('[data-copy-value]');
  if (!buttons.length) return;

  const copyWithFallback = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-999px';
    textarea.style.left = '-999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('copy failed');
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    copyWithFallback(text);
  };

  buttons.forEach((button) => {
    const defaultLabel = button.textContent.trim() || 'Copiar';
    const successLabel = button.dataset.copySuccess || 'Copiado';
    let resetTimer = null;

    button.addEventListener('click', async () => {
      const value = button.dataset.copyValue || '';
      if (!value) return;

      window.clearTimeout(resetTimer);
      button.disabled = true;

      try {
        await copyText(value);
        button.textContent = successLabel;
        button.classList.add('is-copied');
        button.classList.remove('has-copy-error');
      } catch (_) {
        button.textContent = 'No se pudo';
        button.classList.add('has-copy-error');
        button.classList.remove('is-copied');
      }

      resetTimer = window.setTimeout(() => {
        button.textContent = defaultLabel;
        button.classList.remove('is-copied', 'has-copy-error');
        button.disabled = false;
      }, 1600);
    });
  });
})();
