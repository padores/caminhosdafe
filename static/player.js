/* Player de áudio acessível + minibarra fixa. Melhoria progressiva: sem JavaScript, vale o <audio controls> nativo. */
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

  document.querySelectorAll("[data-player]").forEach((caixa) => {
    const audio = caixa.querySelector("audio");
    if (!audio) return;
    audio.controls = false;
    audio.hidden = true;

    const ui = document.createElement("div");
    ui.className = "player-ui";
    ui.innerHTML =
      '<button type="button" class="player-play"><span class="ico-play" aria-hidden="true">▶</span><span class="txt">Reproduzir</span></button>' +
      '<div class="player-barra">' +
      '<input type="range" min="0" max="0" step="1" value="0" aria-label="Posição da narração" disabled>' +
      '<div class="player-tempos" aria-hidden="true"><span class="atual">0:00</span><span class="total">--:--</span></div></div>' +
      '<p class="player-erro" role="alert" hidden>Não foi possível carregar o áudio. A transcrição abaixo continua disponível.' +
      '<button type="button" class="tentar">Tentar de novo</button></p>';
    caixa.insertBefore(ui, audio);

    const btn = ui.querySelector(".player-play");
    const ico = ui.querySelector(".ico-play");
    const txt = ui.querySelector(".txt");
    const barra = ui.querySelector("input");
    const atual = ui.querySelector(".atual");
    const total = ui.querySelector(".total");
    const erro = ui.querySelector(".player-erro");

    // ---- minibarra fixa: aparece quando o player sai da tela e o áudio já foi iniciado
    const titulo = (document.querySelector("h1") || {}).innerText || "Narração";
    const mini = document.createElement("div");
    mini.className = "minibarra";
    mini.hidden = true;
    mini.setAttribute("role", "region");
    mini.setAttribute("aria-label", "Controle da narração");
    mini.innerHTML =
      '<button type="button" class="mini-play" aria-label="Reproduzir narração"><span aria-hidden="true">▶</span></button>' +
      '<div class="mini-info"><span class="mini-tit"></span><span class="mini-tempo"></span>' +
      '<span class="mini-prog" aria-hidden="true"><i></i></span></div>';
    document.body.appendChild(mini);
    mini.querySelector(".mini-tit").textContent = titulo.replace(/\s+/g, " ").trim();
    const miniBtn = mini.querySelector(".mini-play");
    const miniIco = miniBtn.firstElementChild;
    const miniTempo = mini.querySelector(".mini-tempo");
    const miniProg = mini.querySelector(".mini-prog i");
    let playerVisivel = true;

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
    miniBtn.addEventListener("click", () => {
      if (audio.paused) audio.play().catch(() => { erro.hidden = false; });
      else audio.pause();
    });

    const atualizaTexto = () => {
      const d = audio.duration, t = audio.currentTime;
      barra.value = String(Math.floor(t));
      atual.textContent = mmss(t);
      barra.setAttribute("aria-valuetext", Number.isFinite(d) ? `${falado(t)} de ${falado(d)}` : falado(t));
      atualizaMini();
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
    audio.addEventListener("play", estado);
    audio.addEventListener("pause", estado);
    audio.addEventListener("ended", estado);
    audio.addEventListener("error", () => { erro.hidden = false; estado(); });

    btn.addEventListener("click", () => {
      if (audio.paused) audio.play().catch(() => { erro.hidden = false; });
      else audio.pause();
    });
    barra.addEventListener("input", () => { audio.currentTime = Number(barra.value); atualizaTexto(); });
    ui.querySelector(".tentar").addEventListener("click", () => {
      erro.hidden = true;
      audio.load();
      audio.play().catch(() => { erro.hidden = false; });
    });
    estado();
  });
})();
