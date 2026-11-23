/* Player de áudio acessível + minibarra fixa + texto que acompanha a narração.
   Melhoria progressiva: sem JavaScript, vale o <audio controls> nativo e a transcrição comum.
   Nada é enviado a servidor algum e nada fica gravado no aparelho. */
(() => {
  const mmss = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  const falado = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(s / 60), r = s % 60;
    const partes = [];
    if (m) partes.push(`${m} ${m === 1 ? "minuto" : "minutos"}`);
    if (r || !m) partes.push(`${r} ${r === 1 ? "segundo" : "segundos"}`);
    return partes.join(" e ");
  };
  const menosMovimento = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PULO = 15;                                   // segundos de cada pulo
  const VELOCIDADES = [1, 1.25, 1.5, 0.85];

  document.querySelectorAll("[data-player]").forEach((caixa) => {
    const audio = caixa.querySelector("audio");
    if (!audio) return;
    audio.controls = false;
    audio.hidden = true;

    const frases = Array.from(document.querySelectorAll(".transcricao .fr")).map((el) => ({
      el, ini: parseFloat(el.dataset.ini), fim: parseFloat(el.dataset.fim),
    }));
    const sincronizado = frases.length > 0;

    const ui = document.createElement("div");
    ui.className = "player-ui";
    ui.innerHTML =
      '<button type="button" class="player-play"><span class="ico-play" aria-hidden="true">▶</span><span class="txt">Reproduzir</span></button>' +
      '<div class="player-barra">' +
      '<input type="range" min="0" max="0" step="1" value="0" aria-label="Posição da narração" disabled>' +
      '<div class="player-tempos" aria-hidden="true"><span class="atual">0:00</span><span class="total">--:--</span></div></div>' +
      '<div class="player-extras">' +
      `<button type="button" class="p-pulo" data-d="-${PULO}" aria-label="Voltar ${PULO} segundos"><span aria-hidden="true">↺ ${PULO}</span></button>` +
      `<button type="button" class="p-pulo" data-d="${PULO}" aria-label="Avançar ${PULO} segundos"><span aria-hidden="true">${PULO} ↻</span></button>` +
      '<button type="button" class="p-vel" aria-label="Velocidade da narração: normal"><span aria-hidden="true">1×</span></button>' +
      (sincronizado
        ? '<label class="p-seguir"><input type="checkbox" checked><span>Acompanhar o texto</span></label>'
        : "") +
      "</div>" +
      '<p class="player-erro" role="alert" hidden>Não foi possível carregar o áudio. A transcrição abaixo continua disponível.' +
      '<button type="button" class="tentar">Tentar de novo</button></p>';
    caixa.insertBefore(ui, audio);

    const btn = ui.querySelector(".player-play");
    const ico = ui.querySelector(".ico-play");
    const txt = ui.querySelector(".txt");
    const barra = ui.querySelector("input[type=range]");
    const atual = ui.querySelector(".atual");
    const total = ui.querySelector(".total");
    const erro = ui.querySelector(".player-erro");
    const velBtn = ui.querySelector(".p-vel");
    const seguirChk = ui.querySelector(".p-seguir input");

    // ---- minibarra fixa: aparece quando o player sai da tela e o áudio já foi iniciado
    const titulo = (document.querySelector("h1") || {}).innerText || "Narração";
    const mini = document.createElement("div");
    mini.className = "minibarra";
    mini.hidden = true;
    mini.setAttribute("role", "region");
    mini.setAttribute("aria-label", "Controle da narração");
    mini.innerHTML =
      '<button type="button" class="mini-play" aria-label="Reproduzir narração"><span aria-hidden="true">▶</span></button>' +
      '<button type="button" class="mini-info" aria-label="Ir ao trecho que está sendo narrado">' +
      '<span class="mini-tit"></span><span class="mini-tempo"></span>' +
      '<span class="mini-prog" aria-hidden="true"><i></i></span></button>' +
      `<button type="button" class="mini-pulo" data-d="-${PULO}" aria-label="Voltar ${PULO} segundos"><span aria-hidden="true">↺</span></button>` +
      `<button type="button" class="mini-pulo" data-d="${PULO}" aria-label="Avançar ${PULO} segundos"><span aria-hidden="true">↻</span></button>`;
    document.body.appendChild(mini);
    mini.querySelector(".mini-tit").textContent = titulo.replace(/\s+/g, " ").trim();
    const miniBtn = mini.querySelector(".mini-play");
    const miniIco = miniBtn.firstElementChild;
    const miniTempo = mini.querySelector(".mini-tempo");
    const miniProg = mini.querySelector(".mini-prog i");
    let playerVisivel = true;

    const alterna = () => {
      if (audio.paused) audio.play().catch(() => { erro.hidden = false; });
      else audio.pause();
    };
    const pula = (d) => {
      const fim = Number.isFinite(audio.duration) ? audio.duration : Infinity;
      audio.currentTime = Math.min(Math.max(0, audio.currentTime + d), fim);
      pausadoAte = 0;                                // pular é uma escolha: o texto volta a seguir
      atualizaTexto();
    };

    // ---- texto que acompanha a narração
    let ativa = -1;
    let pausadoAte = 0;                              // até quando o leitor "assumiu" a rolagem
    let rolagemAuto = 0;                             // instante da última rolagem feita por nós
    const seguindo = () => !seguirChk || seguirChk.checked;
    const assumeu = () => { if (Date.now() - rolagemAuto > 600) pausadoAte = Date.now() + 8000; };
    ["wheel", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, assumeu, { passive: true }));

    const indiceEm = (t) => {
      let lo = 0, hi = frases.length - 1, r = -1;
      while (lo <= hi) {                             // última frase que já começou
        const m = (lo + hi) >> 1;
        if (frases[m].ini <= t + 0.05) { r = m; lo = m + 1; } else hi = m - 1;
      }
      return r;
    };
    const rolaPara = (el) => {
      const r = el.getBoundingClientRect();
      const base = document.querySelector(".abas");
      const abas = base ? base.getBoundingClientRect().height : 0;
      const alto = window.innerHeight - abas - (mini.hidden ? 0 : 76);
      if (r.top >= 70 && r.bottom <= alto - 20) return;          // já está numa zona confortável
      rolagemAuto = Date.now();
      window.scrollTo({ top: window.scrollY + r.top - alto * 0.3, behavior: menosMovimento() ? "auto" : "smooth" });
    };
    const destaca = (forca) => {
      if (!sincronizado) return;
      const i = audio.currentTime <= 0 && audio.paused ? -1 : indiceEm(audio.currentTime);
      if (i === ativa && !forca) return;
      if (ativa >= 0 && frases[ativa]) frases[ativa].el.classList.remove("fr--atual");
      ativa = i;
      if (i < 0) return;
      frases[i].el.classList.add("fr--atual");
      if (seguindo() && Date.now() > pausadoAte && !audio.paused) rolaPara(frases[i].el);
    };
    if (seguirChk) seguirChk.addEventListener("change", () => { pausadoAte = 0; if (seguirChk.checked && ativa >= 0) rolaPara(frases[ativa].el); });

    const atualizaMini = () => {
      const d = audio.duration, t = audio.currentTime;
      miniTempo.textContent = `${mmss(t)} / ${Number.isFinite(d) ? mmss(d) : "--:--"}`;
      miniProg.style.width = Number.isFinite(d) && d > 0 ? `${Math.min(100, (t / d) * 100)}%` : "0%";
      const tocando = !audio.paused && !audio.ended;
      miniIco.textContent = tocando ? "❚❚" : "▶";
      miniBtn.setAttribute("aria-label", tocando ? "Pausar narração" : "Reproduzir narração");
      const mostrar = !playerVisivel && (tocando || t > 0);
      mini.hidden = !mostrar;
      document.body.classList.toggle("com-minibarra", mostrar);
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { playerVisivel = e.isIntersecting; atualizaMini(); }, { threshold: 0.1 }).observe(caixa);
    }
    miniBtn.addEventListener("click", alterna);
    mini.querySelectorAll(".mini-pulo").forEach((b) => b.addEventListener("click", () => pula(Number(b.dataset.d))));
    mini.querySelector(".mini-info").addEventListener("click", () => {
      pausadoAte = 0;
      if (sincronizado && ativa >= 0) rolaPara(frases[ativa].el);
      else caixa.scrollIntoView({ block: "center", behavior: menosMovimento() ? "auto" : "smooth" });
    });
    ui.querySelectorAll(".p-pulo").forEach((b) => b.addEventListener("click", () => pula(Number(b.dataset.d))));
    velBtn.addEventListener("click", () => {
      const i = (VELOCIDADES.indexOf(audio.playbackRate) + 1) % VELOCIDADES.length;
      audio.playbackRate = VELOCIDADES[i];
      const r = String(VELOCIDADES[i]).replace(".", ",");
      velBtn.firstElementChild.textContent = `${r}×`;
      velBtn.setAttribute("aria-label", `Velocidade da narração: ${VELOCIDADES[i] === 1 ? "normal" : r + " vezes"}. Tocar para mudar`);
    });

    const atualizaTexto = () => {
      const d = audio.duration, t = audio.currentTime;
      barra.value = String(Math.floor(t));
      atual.textContent = mmss(t);
      barra.setAttribute("aria-valuetext", Number.isFinite(d) ? `${falado(t)} de ${falado(d)}` : falado(t));
      atualizaMini();
      destaca(false);
    };
    const estado = () => {
      const tocando = !audio.paused && !audio.ended;
      ico.textContent = tocando ? "❚❚" : "▶";
      txt.textContent = tocando ? "Pausar" : "Reproduzir";
      atualizaMini();
    };

    audio.addEventListener("loadedmetadata", () => {
      barra.max = String(Math.floor(audio.duration));
      barra.disabled = false;
      total.textContent = mmss(audio.duration);
      erro.hidden = true;
      atualizaTexto();
    });
    audio.addEventListener("timeupdate", atualizaTexto);
    audio.addEventListener("seeked", () => { pausadoAte = 0; destaca(true); });
    audio.addEventListener("play", () => { estado(); destaca(true); });
    audio.addEventListener("pause", estado);
    audio.addEventListener("ended", () => {
      estado();
      if (ativa >= 0 && frases[ativa]) frases[ativa].el.classList.remove("fr--atual");
      ativa = -1;
    });
    audio.addEventListener("error", () => { erro.hidden = false; estado(); });

    btn.addEventListener("click", alterna);
    barra.addEventListener("input", () => { audio.currentTime = Number(barra.value); atualizaTexto(); });
    ui.querySelector(".tentar").addEventListener("click", () => {
      erro.hidden = true;
      audio.load();
      audio.play().catch(() => { erro.hidden = false; });
    });
    estado();
  });
})();
