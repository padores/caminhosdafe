/* Galeria da parada: abre a imagem ampliada em um <dialog> modal (foco preso, Esc fecha,
   setas navegam). Sem JavaScript, cada miniatura é um link para a imagem. */
(() => {
  const links = [...document.querySelectorAll("[data-galeria] a")];
  if (!links.length || typeof HTMLDialogElement === "undefined") return;

  const dlg = document.createElement("dialog");
  dlg.className = "lightbox";
  dlg.setAttribute("aria-label", "Galeria de imagens");
  dlg.innerHTML =
    '<figure><img alt="" width="800" height="600"><figcaption></figcaption></figure>' +
    '<div class="lightbox-barra">' +
    '<button type="button" data-a="ant">← Anterior</button>' +
    '<span class="lightbox-pos" aria-live="polite"></span>' +
    '<button type="button" data-a="prox">Próxima →</button>' +
    '<button type="button" data-a="fechar" class="fechar">Fechar</button></div>';
  document.body.appendChild(dlg);

  const img = dlg.querySelector("img");
  const leg = dlg.querySelector("figcaption");
  const pos = dlg.querySelector(".lightbox-pos");
  const bAnt = dlg.querySelector('[data-a="ant"]');
  const bProx = dlg.querySelector('[data-a="prox"]');
  let atual = 0;

  const mostra = (n) => {
    atual = Math.min(links.length - 1, Math.max(0, n));
    const a = links[atual], mini = a.querySelector("img");
    img.src = a.href;
    img.alt = mini ? mini.alt : "";
    leg.textContent = [a.dataset.legenda, a.dataset.credito].filter(Boolean).join(" · ");
    pos.textContent = `${atual + 1} de ${links.length}`;
    bAnt.disabled = atual === 0;
    bProx.disabled = atual === links.length - 1;
  };

  let origem = null;                                  // miniatura que abriu o modal (o foco volta para ela)
  links.forEach((a, k) => a.addEventListener("click", (e) => {
    e.preventDefault();
    origem = a;
    mostra(k);
    dlg.showModal();
  }));
  // depois da restauração de foco do próprio <dialog>, garante que o foco volte à miniatura
  dlg.addEventListener("close", () => { if (origem) setTimeout(() => origem.focus(), 0); });
  bAnt.addEventListener("click", () => mostra(atual - 1));
  bProx.addEventListener("click", () => mostra(atual + 1));
  dlg.querySelector('[data-a="fechar"]').addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });   // clique fora
  dlg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); mostra(atual - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); mostra(atual + 1); }
  });
})();
