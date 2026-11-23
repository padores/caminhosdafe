/* "Continuar de onde parou": guarda SÓ NO APARELHO (localStorage) a última parada aberta e a oferece na
   página inicial e na apresentação da mesma igreja. Nada é enviado a servidor algum. */
(() => {
  const CHAVE = "cf:ultima-parada";
  const guarda = (o) => { try { localStorage.setItem(CHAVE, JSON.stringify(o)); } catch (_) { /* sem armazenamento: segue sem retomar */ } };
  const le = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || "null"); } catch (_) { return null; } };
  const igrejaDe = (caminho) => { const m = caminho.match(/\/igreja\/([^/]+)\//); return m ? m[1] : ""; };

  const parada = document.querySelector(".parada");
  if (parada) {
    const h1 = document.querySelector("h1");
    const codigo = (h1.querySelector(".codigo") || {}).innerText || "";
    guarda({ url: location.pathname, codigo, titulo: h1.innerText.replace(codigo, "").trim(), igreja: igrejaDe(location.pathname) });
    return;
  }
  const alvo = document.querySelector("[data-retomar]");
  const ultima = le();
  if (!alvo || !ultima || !ultima.url) return;
  const daPagina = igrejaDe(location.pathname);
  if (daPagina && daPagina !== ultima.igreja) return;      // na apresentação de outra igreja, não oferece

  const a = document.createElement("a");
  a.className = "retomar-link";
  a.href = ultima.url;
  a.innerHTML = '<span class="retomar-rot">Continuar de onde parou</span><span class="retomar-sub"></span>';
  a.querySelector(".retomar-sub").textContent = `Parada ${ultima.codigo} · ${ultima.titulo}`;
  alvo.appendChild(a);
})();
