(() => {
  document.querySelectorAll('.mobile-menu-panel a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      const menu = link.closest('.mobile-menu');
      if (menu) {
        menu.open = false;
      }
    });
  });
})();
