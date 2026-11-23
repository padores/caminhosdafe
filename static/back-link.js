/* "Voltar" inteligente: se o visitante veio de um mapa ou lista do próprio site, volta exatamente
   para lá; caso contrário vale o link normal para o mapa do andar. */
(() => {
  document.querySelectorAll("[data-voltar]").forEach((link) => {
    link.addEventListener("click", (e) => {
      try {
        if (!document.referrer || history.length < 2) return;
        const ref = new URL(document.referrer);
        if (ref.origin !== location.origin || ref.pathname === location.pathname) return;
        if (/\/parada\//.test(ref.pathname)) return;
        e.preventDefault();
        history.back();
      } catch (_) { /* mantém o link normal */ }
    });
  });
})();
