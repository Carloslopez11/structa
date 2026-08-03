"use client";

import { useEffect, useRef, useState } from "react";

export default function DevClubExperience() {
  const [meterValue, setMeterValue] = useState("R$ 0");
  const [selectedConcept, setSelectedConcept] = useState<number>(0);
  const [selectedBackendConcept, setSelectedBackendConcept] = useState<number>(0);
  const pathFillRef = useRef<HTMLSpanElement>(null);
  const sequenceRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const concepts = [
    { num: "01", k: "Você entende", title: "Lógica de programação de verdade", desc: "A base que separa quem copia código de quem resolve problema. Sem decoreba." },
    { num: "02", k: "Você constrói", title: "HTML, CSS e a primeira página no ar", desc: "Layouts responsivos publicados na internet ainda nas primeiras semanas." },
    { num: "03", k: "Você domina", title: "JavaScript, a linguagem do mercado", desc: "Do básico ao assíncrono: a linguagem que vai te acompanhar no front e no back." },
    { num: "04", k: "Você entrega", title: "React e componentes profissionais", desc: "A biblioteca mais pedida nas vagas júnior do Brasil, aplicada em projeto real." },
  ];

  const backendConcepts = [
    { num: "01", tag: "Node.js API", k: "Você cria", title: "APIs com Node.js", desc: "Servidores, rotas e autenticação: o back-end que sustenta qualquer produto.", log: "GET /api/v1/users/auth 200 OK (12ms)" },
    { num: "02", tag: "SQL & NoSQL", k: "Você modela", title: "Banco de dados SQL e NoSQL", desc: "Modelagem, consultas e integração — os dados no lugar certo desde o começo.", log: "POST /api/v1/db/query 201 CREATED (8ms)" },
    { num: "03", tag: "Full Integration", k: "Você conecta", title: "Front + back na mesma aplicação", desc: "O momento em que tudo se junta e você entende por que \"full stack\" importa.", log: "WS websocket://client_sync CONNECTED" },
    { num: "04", tag: "Cloud Deploy", k: "Você publica", title: "Deploy, Git e versionamento", desc: "Fluxo profissional de trabalho: branch, pull request, code review e produção.", log: "DEPLOY release_v2.4 --prod SUCCESS" },
  ];

  useEffect(() => {
    // ---- Terminal del Hero ----
    const lines = [
      '<span class="term__cm">// sua carreira, em 6 comandos</span>',
      '<span class="term__pr">$</span> devclub init <span class="term__val">--do-zero</span>',
      '<span class="term__ok">✓</span> lógica, html, css e javascript',
      '<span class="term__pr">$</span> devclub build <span class="term__val">--front --back</span>',
      '<span class="term__ok">✓</span> react + node + banco de dados',
      '<span class="term__pr">$</span> devclub deploy <span class="term__val">--portfolio</span>',
      '<span class="term__ok">✓</span> 4 projetos publicados no github',
      '<span class="term__pr">$</span> devclub apply <span class="term__val">--primeiro-emprego</span>',
      '<span class="term__ok">✓</span> currículo, linkedin e entrevista',
      '<span class="term__cm">// status:</span> <span class="term__ok">contratado</span> <span class="caret"></span>'
    ];
    const body = document.getElementById("termBody");
    if (body && body.children.length === 0) {
      lines.forEach((html, i) => {
        const d = document.createElement("div");
        d.className = "term__line";
        d.innerHTML = html;
        d.style.animationDelay = `${0.35 + i * 0.28}s`;
        body.appendChild(d);
      });
    }

    // ---- Marquee de Tecnologias ----
    const techs = [
      "HTML", "CSS", "JavaScript", "TypeScript", "React", "Node.js",
      "Express", "SQL", "MongoDB", "Git", "GitHub", "API REST",
      "Next.js", "Tailwind", "Docker", "IA para devs", "React Native",
      "Testes", "Deploy", "Análise de dados"
    ];
    const strip = document.getElementById("strip");
    if (strip && strip.children.length === 0) {
      for (let r = 0; r < 2; r++) {
        techs.forEach((t) => {
          const s = document.createElement("span");
          s.className = "strip__item";
          s.textContent = t;
          strip.appendChild(s);
        });
      }
    }

    // ---- Contadores e Revelaciones ----
    const runCount = (el: HTMLElement) => {
      const end = parseFloat(el.dataset.count || "0") || 0;
      const pre = el.dataset.prefix || "";
      const suf = el.dataset.suffix || "";
      let t0: number | null = null;
      const dur = 1400;
      const frame = (t: number) => {
        if (!t0) t0 = t;
        const p = Math.min((t - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.innerHTML = pre + Math.round(end * e) + suf;
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const target = e.target as HTMLElement;
          target.classList.add("on");
          target.querySelectorAll<HTMLElement>("[data-count]").forEach(runCount);
          if (target.hasAttribute("data-count")) runCount(target);
          io.unobserve(target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll(".up, [data-count]").forEach((el) => io.observe(el));

    // ---- Valor Acumulado ----
    const items = Array.from(document.querySelectorAll<HTMLElement>(".item"));
    let shown = 0;
    const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;
    const vio = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (!e.isIntersecting || e.target.classList.contains("on")) return;
          const target = e.target as HTMLElement;
          target.classList.add("on");
          const from = shown;
          shown += parseInt(target.dataset.v || "0", 10);
          const to = shown;
          let t0: number | null = null;
          const tick = (t: number) => {
            if (!t0) t0 = t;
            const p = Math.min((t - t0) / 700, 1);
            setMeterValue(fmt(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 }
    );
    items.forEach((el) => vio.observe(el));

    // ---- Scroll Listener ----
    const bar = document.getElementById("bar");
    const top = document.getElementById("top");
    const dock = document.getElementById("dock");
    const hero = document.getElementById("inicio");
    const path = document.getElementById("path");
    const stops = Array.from(document.querySelectorAll<HTMLElement>(".stop"));
    const stripEl = document.getElementById("strip");
    const stripItems = stripEl ? Array.from(stripEl.querySelectorAll<HTMLElement>(".strip__item")) : [];

    let ticking = false;

    const onFrame = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;

      if (bar) bar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
      if (top) top.classList.toggle("is-stuck", y > 12);
      if (dock && hero) dock.classList.toggle("on", y > hero.offsetHeight * 0.85);

      if (stripEl) {
        stripItems.forEach((el) => {
          const r = el.getBoundingClientRect();
          el.classList.toggle("on", Math.abs(r.left + r.width / 2 - window.innerWidth / 2) < 220);
        });
      }

      if (path && pathFillRef.current) {
        const pr = path.getBoundingClientRect();
        let prog = (vh * 0.62 - pr.top) / pr.height;
        prog = prog < 0 ? 0 : prog > 1 ? 1 : prog;
        pathFillRef.current.style.height = `${prog * 100}%`;
        stops.forEach((s) => {
          s.classList.toggle("on", s.getBoundingClientRect().top < vh * 0.62);
        });
      }

      // Sincronización del Vídeo con el Scroll de TODA la Landing Page
      const totalPageScrollable = Math.max(1, document.documentElement.scrollHeight - vh);
      const globalPageProgress = Math.min(1, Math.max(0, y / totalPageScrollable));

      if (sequenceRef.current) {
        sequenceRef.current.style.setProperty("--scene-progress", globalPageProgress.toFixed(4));
      }

      const video = videoRef.current;
      if (video && video.duration) {
        const targetTime = globalPageProgress * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 0.001) {
          video.currentTime = targetTime;
        }
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onFrame);
      }
    };

    // Parallax 3D Dinámico con el cursor del mouse
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const mouseX = (e.clientX / innerWidth - 0.5) * 2; // -1 a 1
      const mouseY = (e.clientY / innerHeight - 0.5) * 2; // -1 a 1

      document.documentElement.style.setProperty("--mouse-x", mouseX.toFixed(3));
      document.documentElement.style.setProperty("--mouse-y", mouseY.toFixed(3));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", onFrame);
    onFrame();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", onFrame);
    };
  }, []);

  return (
    <main>
      <div className="progress"><i id="bar" /></div>

      <nav className="top" id="top">
        <a className="top__brand" href="#inicio">
          <span className="top__logo">&lt;/&gt;</span>
          DevClub <span className="top__tag">Full Stack Pro</span>
        </a>
        <div className="top__acts">
          <a className="top__link" href="#formacao">Formação</a>
          <a className="top__link" href="#recebe">O que você recebe</a>
          <a className="top__link" href="#faq">FAQ</a>
          <a className="btn btn--sm" href="#matricula">Quero começar</a>
        </div>
      </nav>

      {/* ============ ESCENA DE INTERACCIÓN CONSTELACIÓN 3D & NÚCLEO TECH (ESTILO MBA DEVCUB) ============ */}
      <section ref={sequenceRef} className="hero-sequence-interactive">
        <div className="sticky-interactive">
          <div className="interactive-stage">
            <div className="video-motion-wrap-bg">
              <div className="orbital-bg" aria-hidden="true" />
            </div>
            
            {/* Capa 2: VÍDEO INTERACTIVO CONTROLADO POR SCROLL */}
            <div className="video-motion-wrap-dev">
              <video
                ref={videoRef}
                src="/video-nucleo.mp4"
                muted
                playsInline
                preload="auto"
                className="video-dev-scrub"
                aria-hidden="true"
              />
              <div className="dev-reveal-overlay" aria-hidden="true" />
            </div>

            <div className="code-floating-left" aria-hidden="true">
              <span>01</span> const futuro = build(agora);<br />
              <span>02</span> while (você.decide) &#123; você.evolui(); &#125;
            </div>

            <div className="code-floating-right" aria-hidden="true">
              <span>42</span> status: &quot;PRONTO_PARA_O_MERCADO&quot;<br />
              <span>43</span> talento += pratica_constante;
            </div>

            <div className="interactive-copy">
              <span className="flag"><i></i>Experiência Interativa DevClub</span>
              <h2>Transformação total do <em>Zero ao Profissional</em></h2>
              <p>Deslize a página para ver a transição do núcleo tecnológico até a formação da sua carreira.</p>
            </div>

            <div className="interactive-cue">
              <span>Scroll para desbloquear</span>
              <i>↓</i>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HERO PRINCIPAL ============ */}
      <header className="hero wrap" id="inicio">
        <div className="hero__grid">
          <div>
            <span className="flag"><i></i>Turma aberta · vagas limitadas</span>
            <h1 className="hero__h1">Do <em>zero</em> ao primeiro emprego como <em>programador</em>.</h1>
            <p className="hero__p">
              A formação completa em programação full stack: front-end, back-end e as tecnologias que o mercado pede hoje. Sem faculdade, sem enrolação — em menos de 6 meses.
            </p>

            <ul className="hero__list">
              <li>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5l3.2 3.2L13 5" stroke="#00E36B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Front-end, back-end, mobile, IA para devs e análise de dados
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5l3.2 3.2L13 5" stroke="#00E36B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mentoria técnica ao vivo toda semana + suporte 7 dias por semana
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5l3.2 3.2L13 5" stroke="#00E36B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Trilha &quot;Meu Primeiro SIM!&quot; — currículo, LinkedIn e entrevistas
              </li>
            </ul>

            <div className="hero__cta">
              <a className="btn" href="#matricula">Quero minha vaga na turma</a>
              <span className="hero__micro">Garantia incondicional de 7 dias. Não gostou, devolvemos tudo.</span>
            </div>

            <div className="hero__proof">
              <div><b data-count="30" data-suffix=" mil+">0</b><span>alunos formados</span></div>
              <div><b data-count="6" data-prefix="&lt; " data-suffix=" meses">0</b><span>até o nível profissional</span></div>
              <div><b data-count="24" data-suffix="/7">0</b><span>suporte de verdade</span></div>
            </div>
          </div>

          <div className="term term-success-showcase" id="term">
            <div className="term__bar">
              <span className="term__dot" />
              <span className="term__dot" />
              <span className="term__dot" />
              <span className="term__ttl">vaga_conquistada.mp4 — carreira.sh</span>
            </div>
            
            {/* Marco de Video / Caso de Éxito Alcanzando Objetivos */}
            <div className="term-video-frame">
              <img src="/developer-success.jpg" alt="Dev conquisando seu primeiro emprego" className="hero-success-img" />
              <div className="term-video-overlay">
                <span className="success-badge">
                  <i></i> STATUS: CONTRATADO!
                </span>
                <p className="success-caption">
                  <b>Objetivo Alcançado:</b> De R$ 0 ao primeiro emprego como Programador Full Stack Pro.
                </p>
              </div>
            </div>

            <div className="term__body" id="termBody" />

            {/* Frase Motivacional escrita en Sintaxis de Código de Programación */}
            <div className="code-motto-banner">
              <span className="code-line"><span className="code-kw">if</span> (<span className="code-fn">podeSonhar</span>()) &#123;</span>
                <span className="code-line indent"><span className="code-fn">await</span> <span className="code-var">você</span>.<span className="code-fn">codificarERealizar</span>();</span>
              <span className="code-line">&#125; <span className="code-cm">// &quot;Se você pode sonhar, você pode realizar.&quot;</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* ============ STRIP MARQUEE ============ */}
      <section className="strip">
        <div className="strip__track" id="strip" />
        <p className="strip__cap">role a página — a stack acende conforme você avança</p>
      </section>

      {/* ============ PILARES ============ */}
      <section className="sec wrap" id="pilares">
        <div className="up on">
          <span className="eyebrow">Os três pilares</span>
          <h2 className="h2">Uma formação. <em>Três entregas.</em></h2>
          <p className="lead">Não é só um curso de código. É o caminho inteiro: aprender, provar que sabe e ser contratado.</p>
        </div>

        <div className="pillars">
          <article className="pill up">
            <span className="pill__ico">01</span>
            <h3>Formação full stack completa</h3>
            <p>Do primeiro <b>Hello World</b> até aplicações profissionais com React e Node. Front-end, back-end, banco de dados e deploy — na ordem certa, sem pular etapa.</p>
          </article>
          <article className="pill up d1">
            <span className="pill__ico">02</span>
            <h3>Portfólio que prova o que você sabe</h3>
            <p>Projetos reais a cada módulo. Você termina com <b>um GitHub que fala por você</b> — o que recrutador olha antes de qualquer certificado.</p>
          </article>
          <article className="pill up d2">
            <span className="pill__ico">03</span>
            <h3>Meu Primeiro SIM!</h3>
            <p>A trilha de empregabilidade: currículo, LinkedIn, simulação de entrevista e vagas. <b>Troféu quando você conseguir o primeiro emprego</b> — a gente comemora junto.</p>
          </article>
        </div>
      </section>

      {/* ============ FASE 1 CON PLANETA TIERRA 3D INTERACTIVO CON NODOS ORBITALES SELECCIONABLES ============ */}
      <section className="phase wrap" id="formacao">
        <div className="phase__grid">
          <div className="phase__side">
            <span className="phase__n">FASE 01</span>
            <h3 className="phase__ttl">Fundamentos &amp; Front-end</h3>
            <p className="phase__sub">Mês 1 → 2 · clique em qualquer conceito orbitando a Terra</p>

            {/* Planeta Tierra 3D Giratorio con Conceptos Orbitando en su Eje */}
            <div className="earth-interactive-stage">
              <div className="earth-sphere-wrap">
                <div className="earth-globe" />
                <div className="earth-ring" />

                {/* Nodos Orbitales Seleccionables alrededor del eje terrestre */}
                <button
                  type="button"
                  className={`orbit-concept concept-1 ${selectedConcept === 0 ? "active" : ""}`}
                  onClick={() => setSelectedConcept(0)}
                >
                  <span className="concept-dot">01</span>
                  <span className="concept-tag">Lógica</span>
                </button>

                <button
                  type="button"
                  className={`orbit-concept concept-2 ${selectedConcept === 1 ? "active" : ""}`}
                  onClick={() => setSelectedConcept(1)}
                >
                  <span className="concept-dot">02</span>
                  <span className="concept-tag">HTML &amp; CSS</span>
                </button>

                <button
                  type="button"
                  className={`orbit-concept concept-3 ${selectedConcept === 2 ? "active" : ""}`}
                  onClick={() => setSelectedConcept(2)}
                >
                  <span className="concept-dot">03</span>
                  <span className="concept-tag">JavaScript</span>
                </button>

                <button
                  type="button"
                  className={`orbit-concept concept-4 ${selectedConcept === 3 ? "active" : ""}`}
                  onClick={() => setSelectedConcept(3)}
                >
                  <span className="concept-dot">04</span>
                  <span className="concept-tag">React</span>
                </button>
              </div>
            </div>
          </div>

          <div className="steps-scroll-reveal">
            {concepts.map((c, i) => (
              <div
                key={i}
                className={`step up ${selectedConcept === i ? "on active-card" : ""}`}
                onClick={() => setSelectedConcept(i)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <span className="step__k">{c.k}</span>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
                <span className="step__i">{c.num}</span>
              </div>
            ))}
            <div className="project up"><span>Projeto da fase</span><p>Sua primeira aplicação React publicada e versionada no GitHub</p></div>
          </div>
        </div>
      </section>

      {/* ============ VALOR ACUMULADO ============ */}
      <section className="sec wrap" id="recebe">
        <div className="value__head up">
          <div>
            <span className="eyebrow">Tudo o que está incluso</span>
            <h2 className="h2">Some item por item. <em>A conta sobe.</em></h2>
          </div>
        </div>

        <div className="meter">
          <span className="meter__l">Valor acumulado até aqui</span>
          <span className="meter__v" id="meter">{meterValue}</span>
        </div>

        <div className="items" id="items">
          <div className="item" data-v="2400"><div><h4>Formação Full Stack completa</h4><p>Front-end, back-end, mobile, IA para devs e análise de dados.</p></div><span>R$ 2.400</span></div>
          <div className="item" data-v="1800"><div><h4>DevClub Elite</h4><p>Formação avançada para virar engenheiro ou arquiteto de software.</p></div><span>R$ 1.800</span></div>
          <div className="item" data-v="1200"><div><h4>Trilha &quot;Meu Primeiro SIM!&quot;</h4><p>Currículo, LinkedIn, entrevistas e direcionamento de vagas.</p></div><span>R$ 1.200</span></div>
          <div className="item" data-v="1500"><div><h4>Mentoria técnica ao vivo</h4><p>Encontros semanais com o time e mentoria coletiva mensal com o Rodolfo.</p></div><span>R$ 1.500</span></div>
          <div className="item" data-v="900"><div><h4>Comunidade e gamificação</h4><p>Espaço para tirar dúvidas, prêmios por engajamento e troféu no primeiro emprego.</p></div><span>R$ 900</span></div>
          <div className="item" data-v="1100"><div><h4>Suporte 5 estrelas</h4><p>Sete dias por semana, 24 horas por dia. Não é qualquer curso que oferece isso.</p></div><span>R$ 1.100</span></div>
        </div>
      </section>

      {/* ============ FASE 2 & FASE 3 ============ */}
      {/* ============ FASE 2 CON CUBOMATRIX DE SERVIDOR 3D & CONSOLA LIVE VINCULADA ============ */}
      <section className="phase wrap">
        <div className="phase__grid">
          <div className="phase__side">
            <span className="phase__n">FASE 02</span>
            <h3 className="phase__ttl">Back-end &amp; Banco de Dados</h3>
            <p className="phase__sub">Mês 3 → 4 · clique nas etapas para ver o servidor em ação</p>

            {/* Núcleo Cubo Matrix de Servidor 3D Flotante con Consola Live */}
            <div className="backend-matrix-stage">
              <div className={`cube-3d-wrap active-mode-${selectedBackendConcept}`}>
                <div className="server-cube-glow" />
                <div className="server-cube-ring r-cube-1" />
                <div className="server-cube-ring r-cube-2" />
                <span className="active-tag-pill">{backendConcepts[selectedBackendConcept].tag}</span>
              </div>

              {/* Consola de Servidor Live Interactiva que Cambia con los Textos */}
              <div className="server-live-console">
                <div className="console-head">
                  <span className="console-status-dot" />
                  <span>API_NODEJS_LIVE_LOG // STACK_02</span>
                </div>
                <div className="console-body">
                  <p className="console-line"><span className="c-green">&gt; EVENT:</span> {backendConcepts[selectedBackendConcept].title}</p>
                  <p className="console-line"><span className="c-amber">&gt; LOG:</span> <span className="c-ok">{backendConcepts[selectedBackendConcept].log}</span></p>
                  <p className="console-line"><span className="c-blue">&gt; STATUS:</span> <span className="c-dim">EXECUTANDO EM PRODUÇÃO</span></p>
                </div>
              </div>
            </div>
          </div>
          <div className="steps-scroll-reveal">
            {backendConcepts.map((b, i) => (
              <div
                key={i}
                className={`step up ${selectedBackendConcept === i ? "on active-card" : ""}`}
                onClick={() => setSelectedBackendConcept(i)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <span className="step__k">{b.k}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
                <span className="step__i">{b.num}</span>
              </div>
            ))}
            <div className="project up"><span>Projeto da fase</span><p>Aplicação full stack completa, com API própria e banco em produção</p></div>
          </div>
        </div>
      </section>

      {/* ============ OFERTA & MATRÍCULA ============ */}
      <section className="sec wrap" id="matricula">
        <div className="up" style={{ marginBottom: "clamp(28px,4vh,44px)" }}>
          <span className="eyebrow">Matrícula</span>
          <h2 className="h2">Garanta sua vaga <em>nesta turma</em></h2>
        </div>

        <div className="offer up">
          <div className="offer__l">
            <span className="eyebrow eyebrow--dim">O que entra na matrícula</span>
            <h3>Formação Full Stack Pro completa</h3>
            <ul>
              <li>Formação full stack do zero ao profissional</li>
              <li>Front-end, back-end, mobile, IA para devs e dados</li>
              <li>DevClub Elite — trilha avançada de engenharia</li>
              <li>Meu Primeiro SIM! — trilha de empregabilidade</li>
              <li>Mentoria técnica semanal + coletiva mensal</li>
              <li>Comunidade, gamificação e prêmios</li>
              <li>Suporte 7 dias por semana, 24 horas por dia</li>
            </ul>
          </div>
          <div className="offer__r">
            <div>
              <span className="price__old">de R$ 2.997</span>
              <p className="price__now">12x R$ 197<small> ou R$ 1.997 à vista</small></p>
            </div>
            <a className="btn btn--wide" href="#matricula">Quero minha vaga agora</a>
            <div className="guar">
              <span style={{ color: "var(--green)", fontSize: "20px" }}>⏱</span>
              <span><b>7 dias de garantia incondicional.</b> Entrou, não gostou, pede reembolso e recebe tudo de volta. Sem pergunta.</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap">
          <div className="foot__in">
            <a className="top__brand" href="#inicio"><span className="top__logo">&lt;/&gt;</span> DevClub <span className="top__tag">Full Stack Pro</span></a>
            <nav className="foot__nav">
              <a href="#formacao">Formação</a>
              <a href="#recebe">O que você recebe</a>
              <a href="#matricula">Matrícula</a>
              <a href="#faq">FAQ</a>
            </nav>
          </div>
          <p className="foot__c">© 2026 DevClub. Todos os direitos reservados. · Política de Privacidade · Termos de uso</p>
        </div>
      </footer>
    </main>
  );
}
