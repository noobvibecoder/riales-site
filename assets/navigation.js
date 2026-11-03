(() => {
  document.querySelectorAll('.mobile-menu-panel a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      const menu = link.closest('.mobile-menu');
      if (menu) {
        menu.open = false;
      }
    });
  });

  const countryMenus = [...document.querySelectorAll('.country-switcher')];
  countryMenus.forEach((menu) => {
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary').focus();
        event.stopPropagation();
      }
    });
    menu.addEventListener('toggle', () => {
      if (menu.open) {
        countryMenus.forEach((other) => {
          if (other !== menu) other.open = false;
        });
      }
    });
  });
  document.addEventListener('click', (event) => {
    countryMenus.forEach((menu) => {
      if (!menu.contains(event.target)) menu.open = false;
    });
  });
})();
