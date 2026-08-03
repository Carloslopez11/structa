/**
 * ============================================================================
 * DEVCUB FULL STACK PRO — EXPERIÊNCIA CINEMÁTICA INTERATIVA
 * ============================================================================
 * 
 * Arquitetura & Desenvolvimento Frontend por: Javi B (Lead Developer)
 * Design de Interação 3D, Scrubbing por Scroll, Animações Neón e Suite IA
 * 
 * @co-author Javi B <javib@structa.dev>
 * @version 3.4.0-PRO
 * ============================================================================
 */

"use client";

import { useEffect, useRef, useState } from "react";

export default function DevClubExperience() {
  const [meterValue, setMeterValue] = useState("R$ 0");
  const [selectedConcept, setSelectedConcept] = useState<number>(0);
  const [selectedBackendConcept, setSelectedBackendConcept] = useState<number>(0);
  const pathFillRef = useRef<HTMLSpanElement>(null);
  const sequenceRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const manifestoRef = useRef<HTMLElement>(null);
  const manifestoVideoRef = useRef<HTMLVideoElement>(null);
  const devWalkerRef = useRef<HTMLDivElement>(null);

  // Función de Fuegos Artificiales y Lluvia de Confeti al Alcanzar la Meta
  const triggerConfetti = () => {
    const colors = ["#00E36B", "#FFB820", "#5CFFB0", "#FF5F56", "#58A6FF", "#FFFFFF"];
    const container = document.getElementById("trilha-duolingo");
    if (!container) return;

    for (let i = 0; i < 70; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti-particle";
      confetti.style.left = `${Math.random() * 90 + 5}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 0.8}s`;
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      container.appendChild(confetti);

      setTimeout(() => confetti.remove(), 4000);
    }
  };

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

    // ---- Valor Acumulado Automático Total (Suma Continua de R$ 0 a R$ 8.900) ----
    const items = Array.from(document.querySelectorAll<HTMLElement>(".item"));
    const secRecebe = document.getElementById("recebe");
    const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;
    let hasAnimated = false;

    if (secRecebe) {
      const totalSum = items.reduce((acc, el) => acc + parseInt(el.dataset.v || "0", 10), 0); // 8900

      const vio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
              hasAnimated = true;

              // Iluminar todas las tarjetas al instante
              items.forEach((item) => item.classList.add("on"));

              // Bucle Infinito Continuo (Infinite Ping-Pong Loop) de R$ 0 a R$ 8.900 sin parar jamás
              const runInfiniteLoop = () => {
                let startTimestamp: number | null = null;
                const riseDuration = 2200; // 2.2s para subir de 0 a 8900
                const holdDuration = 1200; // 1.2s mantenido en 8900 antes de reiniciar

                const cycle = (timestamp: number) => {
                  if (!startTimestamp) startTimestamp = timestamp;
                  const elapsed = timestamp - startTimestamp;

                  if (elapsed <= riseDuration) {
                    // Fase 1: Subida fluida de R$ 0 a R$ 8.900
                    const progress = elapsed / riseDuration;
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    setMeterValue(fmt(Math.round(totalSum * easeProgress)));
                    requestAnimationFrame(cycle);
                  } else if (elapsed <= riseDuration + holdDuration) {
                    // Fase 2: Pausa resplandeciente en R$ 8.900
                    setMeterValue(fmt(totalSum));
                    requestAnimationFrame(cycle);
                  } else {
                    // Fase 3: Reiniciar bucle suavemente desde R$ 0 de nuevo
                    startTimestamp = timestamp;
                    requestAnimationFrame(cycle);
                  }
                };

                requestAnimationFrame(cycle);
              };

              runInfiniteLoop();
              vio.unobserve(secRecebe);
            }
          });
        },
        { threshold: 0.05 }
      );

      vio.observe(secRecebe);
    }

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
        
        // Mover el Personaje Caminante a lo largo del Sendero
        if (devWalkerRef.current) {
          devWalkerRef.current.style.transform = `translateY(${prog * (pr.height - 40)}px)`;
        }

        // Lluvia Continua e Ininterrumpida de Confetis SIN PARAR JAMÁS al estar en la casilla del Troféu (prog >= 0.88)
        if (prog >= 0.88) {
          const trophyNode = document.querySelector(".trophy-final-destination");
          if (trophyNode) {
            trophyNode.classList.add("celebrated");
            // Mantener siempre vivo el confeti continuo lanzando nuevas ráfagas constantemente
            if (document.querySelectorAll(".confetti-particle").length < 45) {
              triggerConfetti();
            }
          }
        }

        stops.forEach((s) => {
          s.classList.toggle("on", s.getBoundingClientRect().top < vh * 0.62);
        });
      }

      // Encendido Secuencial Progresivo por Scroll de las Fichas de Persuasión (#oportunidade)
      const oportSec = document.getElementById("oportunidade");
      if (oportSec) {
        const chips = oportSec.querySelectorAll<HTMLElement>(".skill-chip.scroll-lit");
        chips.forEach((chip, i) => {
          const cRect = chip.getBoundingClientRect();
          // Conforme la ficha sube en la pantalla (cRect.top < vh * 0.78), se enciende con neón verde
          const isLit = cRect.top < vh * (0.8 - i * 0.035);
          chip.classList.toggle("lit-active", isLit);
        });
      }

      // Sincronización del Vídeo y Escena Interactiva con el Scroll del Héroe
      if (sequenceRef.current) {
        const seqRect = sequenceRef.current.getBoundingClientRect();
        const seqHeight = sequenceRef.current.offsetHeight - vh;
        const seqProgress = seqHeight > 0 ? Math.min(1, Math.max(0, -seqRect.top / seqHeight)) : 0;

        sequenceRef.current.style.setProperty("--scene-progress", seqProgress.toFixed(4));

        const video = videoRef.current;
        if (video && video.duration && !isNaN(video.duration)) {
          const targetTime = seqProgress * video.duration;
          if (Math.abs(video.currentTime - targetTime) > 0.005) {
            video.currentTime = targetTime;
          }
        }
      }

      // Sincronización Interactiva por Scroll del Vídeo del Manifesto (chico.mp4)
      if (manifestoRef.current && manifestoVideoRef.current) {
        const mRect = manifestoRef.current.getBoundingClientRect();
        const mHeight = manifestoRef.current.offsetHeight;
        let mProgress = (vh * 0.8 - mRect.top) / (mHeight + vh * 0.4);
        mProgress = mProgress < 0 ? 0 : mProgress > 1 ? 1 : mProgress;

        const mVideo = manifestoVideoRef.current;
        if (mVideo && mVideo.duration && !isNaN(mVideo.duration)) {
          const mTarget = mProgress * mVideo.duration;
          if (Math.abs(mVideo.currentTime - mTarget) > 0.005) {
            mVideo.currentTime = mTarget;
          }
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

      {/* ============ ESCENA DE INTERACCIÓN FUSIONADA CINEMÁTICA NOVA_AI + DEVCUB PRO ============ */}
      <section ref={sequenceRef} className="hero-sequence-interactive">
        <div className="sticky-interactive">
          <div className="interactive-stage">
            
            {/* Reproductor Cinemático del Átomo / Fondo Espacial con Anillos Orbitale 3D Vectores HD */}
            <div className="video-motion-wrap-bg">
              <video
                ref={videoRef}
                src="/hero-scroll-video.mp4"
                muted
                playsInline
                preload="auto"
                className="video-dev-scrub nova-video-glow hero-scroll-video-el"
                aria-hidden="true"
              />

              {/* Anillos Atómicos 3D Vectoriales HD Continuos (Rotación Multieje sin Pérdida de Calidad) */}
              <div className="atomic-orbit-system" aria-hidden="true">
                <div className="atomic-ring-layer r-layer-1" />
                <div className="atomic-ring-layer r-layer-2" />
                <div className="atomic-ring-layer r-layer-3" />
                <div className="atomic-pulse-core" />
              </div>

              <div className="orbital-bg" aria-hidden="true" />
            </div>

            {/* Capa de Revelado: Desenvolvedor Chico que Aparece al Final del Átomo */}
            <div className="video-motion-wrap-dev">
              <img
                src="/developer-hero-guy.jpg"
                alt="Desenvolvedor DevClub"
                className="dev-reveal-guy-photo"
                aria-hidden="true"
              />
            </div>

            <div className="dev-reveal-overlay" aria-hidden="true" />

            {/* Titulación Cinemática Unificada y Firme a la Izquierda */}
            <div className="interactive-copy nova-hero-copy">
              <span className="flag glass-badge reveal-badge"><i></i>BEM-VINDO AO ECOSSISTEMA PRO</span>
              
              <h2 className="anton-title interactive-hero-title">
                SEU FUTURO ESTÁ EM SUAS MÃOS.<br />
                <em>SEM MAIS DESCULPAS.</em>
              </h2>

              <p className="interactive-hero-sub">
                Do primeiro código ao primeiro SIM — construa a sua carreira na maior comunidade de desenvolvedores.
              </p>
            </div>

            <div className="interactive-cue glass-cue">
              <span>Scroll para desbloquear o ecossistema</span>
              <i>↓</i>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MANIFESTO INTERACTIVO EDITORIAL CON PERSONA PROGRAMANDO ============ */}
      <section ref={manifestoRef} className="sec wrap" id="manifesto">
        <div className="manifesto-grid">
          <div className="up">
            <span className="eyebrow">01 — O Manifesto</span>
            <h2 className="h2" style={{ maxWidth: "22ch", marginTop: "16px" }}>
              Ninguém entra na tecnologia <em>assistindo.</em>
            </h2>
            <p className="lead" style={{ fontSize: "clamp(17px,1.8vw,22px)", lineHeight: 1.6, marginTop: "24px", color: "var(--txt)" }}>
              Entra escrevendo a primeira linha, errando, corrigindo e publicando. O DevClub existe para encurtar esse caminho: a evolução se constrói todos os dias, com quem já fez o trajeto ao seu lado.
            </p>
          </div>

          <div className="manifesto-media-card glass-panel-frosted up d1 manifesto-3d-stage">
            <div className="media-card-head">
              <span className="dot dot--r" />
              <span className="dot dot--y" />
              <span className="dot dot--g" />
              <span className="media-card-ttl">dev_programando_ao_vivo.sh</span>
            </div>
            
            <div className="manifesto-img-frame">
              <video 
                src="/manifesto-chico-video.mp4" 
                autoPlay
                loop
                muted
                playsInline
                className="manifesto-dev-guy-img"
                aria-hidden="true"
              />
              <div className="manifesto-media-overlay">
                <span className="live-status-badge">
                  <i></i> CÓDIGO EM EXECUÇÃO 24/7
                </span>
                <p className="live-status-caption">
                  <b>Comunidade DevClub:</b> Prática real com mentores ao vivo.
                </p>
              </div>
            </div>

            {/* Únicamente 2 Lenguajes Principales Limpios y Elegantes */}
            <div className="tech-chip-burst chip-react glass-panel-frosted">
              <span className="chip-symbol">⚛️</span> React.js <b>v18</b>
            </div>
            <div className="tech-chip-burst chip-node glass-panel-frosted">
              <span className="chip-symbol">🟩</span> Node.js <b>API</b>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECCIÓN INTERACTIVA EDITORIAL DE PERSUASIÓN & VENTA POR SCROLL ============ */}
      <section className="sec wrap" id="oportunidade" style={{ borderTop: "1px solid var(--line)", padding: "90px 0" }}>
        <div className="oport-grid">
          <div className="oport-copy up">
            <span className="eyebrow">A Mudança Inevitável</span>
            <h2 className="h2" style={{ marginTop: "14px" }}>
              O mercado não espera. <em>Quem se posiciona agora domina o futuro.</em>
            </h2>
            <p style={{ fontSize: "17.5px", lineHeight: 1.65, marginTop: "22px", color: "var(--txt-subtle)" }}>
              No último ano, as empresas pararam de contratar quem apenas &quot;sabe teoria&quot;. Hoje, o mercado paga salários acima da média para quem <b>escreve código real, domina IA para devs e entrega projetos em produção.</b>
            </p>
            <p style={{ fontSize: "17.5px", lineHeight: 1.65, marginTop: "16px", color: "var(--txt-subtle)" }}>
              A boa notícia? <b>Quem toma a decisão hoje sai na frente</b> de milhares que só vão correr atrás quando for tarde demais. O DevClub foi desenhado exatamente para colocar você nessa liderança.
            </p>
            <div style={{ marginTop: "32px" }}>
              <a className="btn" href="#matricula">
                <span>Quero me posicionar agora</span>
              </a>
            </div>
          </div>

          {/* Nube Cinemática Neón que se enciende e ilumina por Scroll */}
          <div className="scroll-skills-wall glass-panel-frosted up d1">
            <div className="wall-head">
              <span className="live-status-badge">
                <i></i> ROLE A PÁGINA — O MERCADO ACENDE AS HABILIDADES
              </span>
            </div>
            <div className="wall-skills-cloud">
              <span className="skill-chip scroll-lit">Formação Full Stack</span>
              <span className="skill-chip dim">Procrastinação</span>
              <span className="skill-chip scroll-lit">React.js v18</span>
              <span className="skill-chip dim">Cursos sem prática</span>
              <span className="skill-chip scroll-lit">Node.js API</span>
              <span className="skill-chip dim">Medo da entrevista</span>
              <span className="skill-chip scroll-lit">GitHub Profissional</span>
              <span className="skill-chip dim">Teoria infinita</span>
              <span className="skill-chip scroll-lit">IA para Devs</span>
              <span className="skill-chip scroll-lit">Mentoria ao Vivo</span>
              <span className="skill-chip scroll-lit">Primeiro SIM!</span>
            </div>
          </div>
        </div>
      </section>

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
                {/* Líneas Finas Conectando el Centro de la Tierra 3D con cada Nodo Orbital */}
                <svg className="earth-internal-lines-svg" viewBox="0 0 280 280" fill="none">
                  <path d="M 140 140 L 140 35" className={`earth-line ${selectedConcept === 0 ? "active" : ""}`} />
                  <path d="M 140 140 L 235 140" className={`earth-line ${selectedConcept === 1 ? "active" : ""}`} />
                  <path d="M 140 140 L 140 245" className={`earth-line ${selectedConcept === 2 ? "active" : ""}`} />
                  <path d="M 140 140 L 45 140" className={`earth-line ${selectedConcept === 3 ? "active" : ""}`} />
                  <circle cx="140" cy="140" r="4" fill="#00E36B" />
                </svg>
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

      {/* ============ SECCIÓN CLUBHUB — SUITE DE IA INCLUSA (OFICIAL DEVCUB MBA) ============ */}
      <section className="sec wrap" id="clubhub" style={{ textAlign: "center" }}>
        <div className="up">
          <span className="eyebrow" style={{ justifyContent: "center" }}>Ferramentas &amp; IA Inclusas</span>
          <h2 className="h2" style={{ maxWidth: "800px", margin: "0 auto 16px" }}>
            Acesso ao <em>ClubHub</em>: as maiores IAs do mercado inclusas na sua formação
          </h2>
          <p className="lead" style={{ maxWidth: "660px", margin: "0 auto", color: "var(--txt)" }}>
            Você não precisa pagar assinaturas separadas. Acesse a suíte completa de Inteligência Artificial para aceleração de código, automação de processos e produtividade máxima.
          </p>
        </div>

        <div className="ai-tiles-grid up d1">
          {/* ChatGPT: Cuadro completo Verde OpenAI #10A37F */}
          <div className="ai-brand-square square-chatgpt">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.04 6.04 0 0 0-6.51-2.9 6.06 6.06 0 0 0-4.81-2.4 6.04 6.04 0 0 0-5.8 4.25 6.06 6.06 0 0 0-4.29 3.1 6.04 6.04 0 0 0 .72 7.11 5.98 5.98 0 0 0 .52 4.91 6.04 6.04 0 0 0 6.51 2.9 6.06 6.06 0 0 0 4.81 2.4 6.04 6.04 0 0 0 5.8-4.25 6.06 6.06 0 0 0 4.29-3.1 6.04 6.04 0 0 0-.72-7.11z" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
            </svg>
            <span className="brand-square-name">ChatGPT 4o</span>
          </div>

          {/* Claude: Cuadro completo Ámbar Anthropic #D97706 */}
          <div className="ai-brand-square square-claude">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFFFFF"/>
            </svg>
            <span className="brand-square-name">Claude 3.5</span>
          </div>

          {/* GitHub Copilot: Cuadro completo Cromo #24292E */}
          <div className="ai-brand-square square-github">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="#FFFFFF">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span className="brand-square-name">GitHub Copilot</span>
          </div>

          {/* n8n: Cuadro completo Rojo Coral #FF6D5A */}
          <div className="ai-brand-square square-n8n">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="#FFFFFF"/>
              <path d="M7 12h10M7 8h6M11 16h6" stroke="#FF6D5A" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="brand-square-name">n8n Automation</span>
          </div>

          {/* Perplexity: Cuadro completo Cian #00ADCC */}
          <div className="ai-brand-square square-perplexity">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="2.2"/>
              <path d="M12 6v12M6 12h12" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            <span className="brand-square-name">Perplexity Pro</span>
          </div>

          {/* Midjourney: Cuadro completo Púrpura #6366F1 */}
          <div className="ai-brand-square square-midjourney">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L2 12l10 9 10-9L12 3z" fill="#FFFFFF"/>
            </svg>
            <span className="brand-square-name">Midjourney v6</span>
          </div>
        </div>
      </section>

      {/* ============ SECCIÓN MENTORÍA & FUNDADOR RODOLFO MORI ============ */}
      <section className="sec wrap" id="mentor">
        <div className="mentor-grid">
          <div className="mentor-info up">
            <span className="eyebrow">Quem vai te guiar</span>
            <h2 className="h2" style={{ marginTop: "16px" }}>
              Aprenda com quem vive o <em>mercado real.</em>
            </h2>
            <p className="lead" style={{ fontSize: "clamp(16px,1.5vw,20px)", lineHeight: 1.6, marginTop: "20px", color: "var(--txt)" }}>
              Fundado por <b>Rodolfo Mori</b>, o DevClub já transformou mais de 30.000 vidas através de um método focado 100% na prática, sem teorias desnecessárias e com acompanhamento constante.
            </p>

            <ul className="hero__list" style={{ marginTop: "28px" }}>
              <li>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5l3.2 3.2L13 5" stroke="#00E36B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mentorias ao vivo semanais diretamente na plataforma
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5l3.2 3.2L13 5" stroke="#00E36B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Trilha de Carreira &quot;Meu Primeiro SIM!&quot; exclusiva
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5l3.2 3.2L13 5" stroke="#00E36B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Comunidade ativa 24/7 com troféu físico no 1º emprego
              </li>
            </ul>
          </div>

          <div className="mentor-avatar-card glass-panel-frosted up d1">
            <div className="media-card-head">
              <span className="dot dot--r" />
              <span className="dot dot--y" />
              <span className="dot dot--g" />
              <span className="media-card-ttl">rodolfo_mori_founder.sh</span>
            </div>
            
            <div className="mentor-img-wrap">
              <img 
                src="/rodolfo-mori-photo.jpg" 
                alt="Rodolfo Mori - Criador do DevClub" 
                className="mentor-photo"
              />
              <div className="mentor-overlay">
                <span className="live-status-badge">
                  <i></i> RODOLFO MORI — FUNDADOR
                </span>
                <p className="mentor-quote">
                  &quot;Programar não é sobre ser um gênio, é sobre ter o método certo e não desistir.&quot;
                </p>
              </div>
            </div>
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

        <div className="meter up">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="meter__l">Valor acumulado até aqui</span>
            <span className="live-status-badge" style={{ padding: "3px 10px", fontSize: "10px" }}>
              <i></i> CÁLCULO EM TEMPO REAL
            </span>
          </div>
          <span className="meter__v" id="meter">{meterValue}</span>
        </div>

        <div className="items" id="items">
          <div className="item on up" data-v="2400"><div><h4>Formação Full Stack completa</h4><p>Front-end, back-end, mobile, IA para devs e análise de dados.</p></div><span>R$ 2.400</span></div>
          <div className="item on up" data-v="1800"><div><h4>DevClub Elite</h4><p>Formação avançada para virar engenheiro ou arquiteto de software.</p></div><span>R$ 1.800</span></div>
          <div className="item on up" data-v="1200"><div><h4>Trilha &quot;Meu Primeiro SIM!&quot;</h4><p>Currículo, LinkedIn, entrevistas e direcionamento de vagas.</p></div><span>R$ 1.200</span></div>
          <div className="item on up" data-v="1500"><div><h4>Mentoria técnica ao vivo</h4><p>Encontros semanais com o time e mentoria coletiva mensal com o Rodolfo.</p></div><span>R$ 1.500</span></div>
          <div className="item on up" data-v="900"><div><h4>Comunidade e gamificação</h4><p>Espaço para tirar dúvidas, prêmios por engajamento e troféu no primeiro emprego.</p></div><span>R$ 900</span></div>
          <div className="item on up" data-v="1100"><div><h4>Suporte 5 estrelas</h4><p>Sete dias por semana, 24 horas por dia. Não é qualquer curso que oferece isso.</p></div><span>R$ 1.100</span></div>
        </div>
      </section>

      {/* ============ FASE 2 CON CUBOMATRIX DE SERVIDOR 3D & CONSOLA LIVE VINCULADA ============ */}
      <section className="phase wrap">
        <div className="phase__grid">
          <div className="phase__side">
            <span className="phase__n">FASE 02</span>
            <h3 className="phase__ttl">Back-end &amp; Banco de Dados</h3>
            <p className="phase__sub">Mês 3 → 4 · clique nas etapas para ver o servidor em ação</p>

            {/* Núcleo Cubo Matrix de Servidor 3D Flotante con Esfera Holográfica de Energía */}
            <div className="backend-matrix-stage">
              <div className={`cube-3d-wrap active-mode-${selectedBackendConcept}`}>
                <div className="server-cube-glow" />
                <div className="server-cube-ring r-cube-1" />
                <div className="server-cube-ring r-cube-2" />
                <span className="active-tag-pill">{backendConcepts[selectedBackendConcept].tag}</span>
                
                {/* Esfera de Energía Holográfica Replicada de la Referencia */}
                <div className="laptop-hologram-energy-stage" aria-hidden="true">
                  <div className="energy-ring-3d r-laptop-1" />
                  <div className="energy-ring-3d r-laptop-2" />
                  <div className="energy-core-glow" />
                  <div className="hologram-scan-grid" />
                </div>
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

      {/* ============ SECCIÓN TRILHA DA CONQUISTA (ESTILO DUOLINGO CON PERSONAJE CAMINANTE & TROFEO FINAL) ============ */}
      <section className="sec wrap" id="trilha-duolingo">
        <div className="up" style={{ textAlign: "center", marginBottom: "48px" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}>Trilha &quot;Meu Primeiro SIM!&quot;</span>
          <h2 className="h2" style={{ maxWidth: "780px", margin: "14px auto 0" }}>
            A jornada do zero até o <em>Troféu do 1º Emprego.</em>
          </h2>
          <p className="lead" style={{ maxWidth: "620px", margin: "16px auto 0", color: "var(--txt)" }}>
            Role a página e veja o seu avatar avançando passo a passo pela trilha até alcançar o troféu final.
          </p>
        </div>

        <div className="duolingo-path-container up d1" id="path">
          <div className="duolingo-path-line">
            <span className="duolingo-path-fill" ref={pathFillRef} />
            
            {/* Personaje Caminante Estilo Duolingo Sincronizado por Scroll */}
            <div className="dev-character-walker" ref={devWalkerRef}>
              <div className="walker-avatar-head">
                <span className="walker-glasses">🕶️</span>
                <span className="walker-code-tag">DEV</span>
              </div>
              <div className="walker-legs">
                <i className="leg leg-l" />
                <i className="leg leg-r" />
              </div>
            </div>
          </div>

          <div className="duolingo-stops-list">
            <div className="duolingo-stop-node stop">
              <div className="stop-badge-icon">01</div>
              <div className="stop-card-info glass-panel-frosted">
                <span className="stop__k">ETAPA 01 · FUNDAMENTOS</span>
                <h4>Matrícula &amp; Primeiro Hello World</h4>
                <p>Ambiente configurado, Git, HTML, CSS e sua primeira aplicação no ar.</p>
              </div>
            </div>

            <div className="duolingo-stop-node stop">
              <div className="stop-badge-icon">02</div>
              <div className="stop-card-info glass-panel-frosted">
                <span className="stop__k">ETAPA 02 · FULL STACK</span>
                <h4>Domínio de React, Node.js &amp; IA</h4>
                <p>Crie APIs robustas e aplicações web completas conectadas ao banco de dados.</p>
              </div>
            </div>

            <div className="duolingo-stop-node stop">
              <div className="stop-badge-icon">03</div>
              <div className="stop-card-info glass-panel-frosted">
                <span className="stop__k">ETAPA 03 · PORTFÓLIO</span>
                <h4>Projetos Reais &amp; GitHub Campeão</h4>
                <p>Publicação de 4 projetos de peso no seu GitHub com código limpo e testes.</p>
              </div>
            </div>

            <div className="duolingo-stop-node stop">
              <div className="stop-badge-icon">04</div>
              <div className="stop-card-info glass-panel-frosted">
                <span className="stop__k">ETAPA 04 · EMPREGABILIDADE</span>
                <h4>Currículo, LinkedIn &amp; Entrevistas</h4>
                <p>Simulação de entrevistas com mentores e mentoria de vagas júnior.</p>
              </div>
            </div>

            {/* Meta Final: Trofeo del Primer Empleo con Resplandor Neón */}
            <div className="duolingo-stop-node stop trophy-final-destination">
              <div className="trophy-gold-badge">🏆</div>
              <div className="stop-card-info glass-panel-frosted trophy-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <span className="stop__k" style={{ color: "var(--amber)", margin: 0 }}>META ALCANÇADA · CONTRATADO!</span>
                  <button 
                    onClick={() => triggerConfetti()}
                    className="btn btn--sm" 
                    style={{ padding: "4px 12px", fontSize: "11px", background: "linear-gradient(135deg, #FFB820, #D97706)", border: "none", color: "#000", fontWeight: 800 }}
                  >
                    🎉 Disparar Celebração
                  </button>
                </div>
                <h4 style={{ color: "#FFFFFF", marginTop: "8px" }}>O Troféu Físico no Seu Primeiro Emprego</h4>
                <p>Você comemora com a comunidade DevClub e recebe o troféu oficial da vitória entregue na sua casa.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECCIÓN FAQ INTERACTIVA DESPLEGABLE & CERTIFICACIÓN MEC ============ */}
      <section className="sec wrap" id="faq">
        <div className="up">
          <span className="eyebrow">Dúvidas Frequentes</span>
          <h2 className="h2">Perguntas <em>frequentes</em></h2>
          <p className="lead" style={{ color: "var(--txt)" }}>Tudo o que você precisa saber antes de dar o próximo passo na sua carreira.</p>
        </div>

        <div className="faq up d1">
          <details>
            <summary>Eu nunca programei nada. Vou conseguir acompanhar?</summary>
            <p>Sim. O DevClub foi desenhado exatamente para levar você do zero absoluto até o nível profissional. Começamos com lógica e fundamentos bem explicados, sem rodeios.</p>
          </details>

          <details>
            <summary>Como funciona o Diploma e a Certificação MEC?</summary>
            <p>Em parceria com a Faculdade Sirius, quem possui ensino superior recebe o diploma de MBA (pós-graduação lato sensu) reconhecido pelo MEC com nota máxima. Caso ainda não tenha graduação, você recebe o Certificado de Extensão Universitária.</p>
          </details>

          <details>
            <summary>O que é o Troféu do Primeiro Emprego?</summary>
            <p>É uma tradição no DevClub: quando você é contratado como desenvolvedor júnior, enviamos um troféu físico especial para a sua casa para comemorarmos a conquista juntos.</p>
          </details>

          <details>
            <summary>Quanto tempo por semana preciso me dedicar?</summary>
            <p>Recomendamos de 6 a 10 horas semanais. As aulas gravadas ficam disponíveis para você assistir no seu ritmo, e os encontros ao vivo são gravados para consulta posterior.</p>
          </details>

          <details>
            <summary>Como funciona a garantia de 7 dias?</summary>
            <p>Você pode fazer a sua matrícula, acessar a plataforma, assistir às aulas e testar o método. Se dentro de 7 dias achar que não é para você, basta solicitar o reembolso e devolvemos 100% do seu dinheiro sem letras miúdas.</p>
          </details>
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
              <li>Suíte ClubHub inclusa (ChatGPT, Claude, Copilot, n8n)</li>
              <li>DevClub Elite — trilha avançada de engenharia</li>
              <li>Meu Primeiro SIM! — trilha de empregabilidade</li>
              <li>Mentoria técnica semanal + coletiva mensal com Rodolfo Mori</li>
              <li>Comunidade, gamificação e Troféu no 1º emprego</li>
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
              <a href="#clubhub">ClubHub IA</a>
              <a href="#mentor">Rodolfo Mori</a>
              <a href="#recebe">O que você recebe</a>
              <a href="#matricula">Matrícula</a>
              <a href="#faq">FAQ</a>
            </nav>
          </div>
          <p className="foot__c">© 2026 DevClub. Todos os direitos reservados. · Projetado e Desenvolvido em parceria com <b>Javi B</b> · Política de Privacidade</p>
        </div>
      </footer>
    </main>
  );
}
