/* Espaço de apoio (doação): cartão suave que o visitante pode dispensar. A escolha fica SÓ NO APARELHO
   (localStorage) por 24 horas; nada é enviado a servidor algum. Sem script, o cartão simplesmente aparece. */
(() => {
  const CHAVE = "cf:apoio-dispensado";
  const DIA = 24 * 60 * 60 * 1000;
  const cartoes = document.querySelectorAll("[data-apoio]");
  if (!cartoes.length) return;

  const dispensado = () => {
    try { return Date.now() - Number(localStorage.getItem(CHAVE) || 0) < DIA; } catch (_) { return false; }
  };
  if (dispensado()) { cartoes.forEach((c) => { c.hidden = true; }); return; }

  document.querySelectorAll("[data-apoio-fechar]").forEach((b) => b.addEventListener("click", () => {
    try { localStorage.setItem(CHAVE, String(Date.now())); } catch (_) { /* sem armazenamento: só some desta página */ }
    cartoes.forEach((c) => { c.hidden = true; });
  }));
})();
