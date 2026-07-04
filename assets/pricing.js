(() => {
  const pricingCard = document.querySelector('[data-pricing-card]');
  const billingToggle = document.querySelector('[data-billing-toggle]');

  if (!pricingCard || !billingToggle) {
    return;
  }

  const billingSwitch = billingToggle.closest('.billing-switch');
  const billingTextNodes = pricingCard.querySelectorAll('[data-monthly][data-annual]');

  const applyBilling = (billing) => {
    pricingCard.dataset.billing = billing;
    billingToggle.checked = billing === 'annual';
    if (billingSwitch) {
      billingSwitch.dataset.billing = billing;
    }

    billingTextNodes.forEach((node) => {
      const nextText = node.dataset[billing];
      if (nextText) {
        node.textContent = nextText;
      }
    });
  };

  billingToggle.addEventListener('change', () => {
    applyBilling(billingToggle.checked ? 'annual' : 'monthly');
  });

  applyBilling(billingToggle.checked ? 'annual' : 'monthly');
})();
