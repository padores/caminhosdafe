/* Zoom (1x a 4x) e arrasto da planta. Sem JavaScript a planta e os pinos continuam funcionando.
   Alternativas ao gesto de pinça (WCAG 2.5.7): botões +, − e Redefinir, e teclado (+, −, 0, setas). */
(() => {
  const MIN = 1, MAX = 4, PASSO = 1.5, MOVE = 48;

  document.querySelectorAll("[data-plan]").forEach((raiz) => {
    const vp = raiz.querySelector(".plano-viewport");
    const inner = raiz.querySelector(".plano-inner");
    if (!vp || !inner) return;
    let z = 1, x = 0, y = 0;

    const controles = document.createElement("div");
    controles.className = "plano-controles";
    controles.setAttribute("role", "group");
    controles.setAttribute("aria-label", "Zoom da planta");
    controles.innerHTML =
      '<button type="button" data-a="mais" aria-label="Aproximar">+</button>' +
      '<button type="button" data-a="menos" aria-label="Afastar">−</button>' +
      '<button type="button" data-a="zero" aria-label="Redefinir zoom">1x</button>' +
      '<span class="nivel" aria-live="polite">Zoom 1x</span>';
    raiz.appendChild(controles);
    const bMais = controles.querySelector('[data-a="mais"]');
    const bMenos = controles.querySelector('[data-a="menos"]');
    const bZero = controles.querySelector('[data-a="zero"]');
    const nivel = controles.querySelector(".nivel");

    const ajustaAltura = () => { vp.style.height = inner.offsetHeight + "px"; };
    const limita = () => {
      const w = vp.clientWidth, h = inner.offsetHeight;
      x = Math.min(0, Math.max(w - w * z, x));
      y = Math.min(0, Math.max(h - h * z, y));
    };
    const aplica = () => {
      limita();
      inner.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
      inner.style.setProperty("--inv", (1 / z).toFixed(4));
      vp.classList.toggle("esta-ampliado", z > 1);
      bMais.disabled = z >= MAX;
      bMenos.disabled = z <= MIN;
      bZero.disabled = z === 1;
      nivel.textContent = `Zoom ${Number.isInteger(z) ? z : z.toFixed(1).replace(".", ",")}x`;
    };
    const zoomEm = (fator, cx, cy) => {
      const novo = Math.min(MAX, Math.max(MIN, z * fator));
      if (novo === z) return;
      cx = cx ?? vp.clientWidth / 2;
      cy = cy ?? vp.clientHeight / 2;
      x = cx - (cx - x) * (novo / z);
      y = cy - (cy - y) * (novo / z);
      z = novo;
      aplica();
    };

    bMais.addEventListener("click", () => zoomEm(PASSO));
    bMenos.addEventListener("click", () => zoomEm(1 / PASSO));
    bZero.addEventListener("click", () => { z = 1; x = 0; y = 0; aplica(); });

    vp.addEventListener("keydown", (e) => {
      if (e.target !== vp) return;                     // só quando a própria região tem o foco
      const teclas = { "+": () => zoomEm(PASSO), "=": () => zoomEm(PASSO), "-": () => zoomEm(1 / PASSO),
        "0": () => { z = 1; x = 0; y = 0; aplica(); } };
      if (teclas[e.key]) { e.preventDefault(); teclas[e.key](); return; }
      if (z <= 1) return;
      const mov = { ArrowLeft: [MOVE, 0], ArrowRight: [-MOVE, 0], ArrowUp: [0, MOVE], ArrowDown: [0, -MOVE] }[e.key];
      if (mov) { e.preventDefault(); x += mov[0]; y += mov[1]; aplica(); }
    });

    // arrasto com ponteiro quando ampliado; não atrapalha o toque nos pinos
    let arrasto = null, moveu = false;
    vp.addEventListener("pointerdown", (e) => {
      if (z <= 1 || e.button > 0) return;
      arrasto = { px: e.clientX, py: e.clientY, x, y };
      moveu = false;
    });
    vp.addEventListener("pointermove", (e) => {
      if (!arrasto) return;
      const dx = e.clientX - arrasto.px, dy = e.clientY - arrasto.py;
      if (!moveu && Math.hypot(dx, dy) > 6) { moveu = true; vp.setPointerCapture(e.pointerId); }
      if (moveu) { x = arrasto.x + dx; y = arrasto.y + dy; aplica(); }
    });
    const fim = () => { arrasto = null; };
    vp.addEventListener("pointerup", fim);
    vp.addEventListener("pointercancel", fim);
    vp.addEventListener("click", (e) => { if (moveu) { e.preventDefault(); e.stopPropagation(); moveu = false; } }, true);

    window.addEventListener("resize", () => { ajustaAltura(); aplica(); });
    const img = inner.querySelector("img");
    if (img && !img.complete) img.addEventListener("load", () => { ajustaAltura(); aplica(); });
    ajustaAltura();
    aplica();
  });
})();
