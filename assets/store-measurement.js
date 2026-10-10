(() => {
  "use strict";
  document.addEventListener("click", (event) => {
    try {
      const link = event.target.closest("a");
      if (!link) return;
      const url = new URL(link.href);
      const store = url.hostname === "apps.apple.com" && url.pathname.endsWith("id6811158889")
        ? "app_store"
        : url.hostname === "play.google.com" && url.searchParams.get("id") === "app.riales"
          ? "google_play" : null;
      if (!store) return;
      // Closed categories only. Never delay navigation, forward URLs/queries,
      // or call this a purchase/installation. GTM decides permitted destinations.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "store_click", store, placement: "landing" });
    } catch (_) {
      // A measurement outage must never interfere with downloading the app.
    }
  }, { passive: true });
})();
