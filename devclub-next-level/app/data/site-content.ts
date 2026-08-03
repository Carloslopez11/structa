/**
 * Todo el contenido editable de la página, separado de la presentación.
 * Para cambiar un texto o una cifra no hace falta abrir ningún componente.
 *
 * AVISO: las cifras y las historias son contenido demostrativo para el
 * concurso, no datos oficiales de DevClub.
 */

export type Formation = {
  index: string;
  title: string;
  subtitle: string;
  description: string;
  stack: string[];
};

export type ProofStat = {
  id: string;
  /** Valor final del contador. */
  value: number;
  /** Decimales que se muestran mientras cuenta. */
  decimals?: number;
  /** Texto pegado detrás del número: "K", "%", "/7"… */
  suffix?: string;
  label: string;
};

export type Mentor = {
  name: string;
  role: string;
  /** Iniciales que se muestran en el retrato. */
  code: string;
};

export const formations: Formation[] = [
  {
    index: "01",
    title: "Full Stack",
    subtitle: "Da interface ao banco de dados",
    description:
      "Construa aplicações completas com as tecnologias que movem produtos reais.",
    stack: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
  },
  {
    index: "02",
    title: "Front-end",
    subtitle: "Experiências que ninguém esquece",
    description:
      "Domine interfaces responsivas, acessíveis e prontas para impressionar.",
    stack: ["React", "TypeScript", "Next.js", "Motion"],
  },
  {
    index: "03",
    title: "Back-end",
    subtitle: "O motor por trás do produto",
    description:
      "APIs, arquitetura, dados e segurança para sistemas que precisam escalar.",
    stack: ["Node.js", "APIs", "SQL", "Cloud"],
  },
  {
    index: "04",
    title: "IA para Devs",
    subtitle: "Construa na velocidade do agora",
    description:
      "Use inteligência artificial como copiloto sem abrir mão do raciocínio técnico.",
    stack: ["LLMs", "Agents", "Automation", "AI APIs"],
  },
];

export const proofStats: ProofStat[] = [
  { id: "alunos", value: 42, suffix: "K", label: "alunos em movimento" },
  {
    id: "trajetorias",
    value: 1.8,
    decimals: 1,
    suffix: "K",
    label: "novas trajetórias",
  },
  { id: "comunidade", value: 24, suffix: "/7", label: "comunidade conectada" },
];

export const mentors: Mentor[] = [
  { name: "Rodolfo Mori", role: "Fundador & Programador", code: "RM" },
  { name: "George Lucas", role: "Full Stack Engineer", code: "GL" },
  { name: "Andrey Silva", role: "Software Engineer", code: "AS" },
];

export const methodSteps = [
  {
    title: "Aprenda",
    description: "Conteúdo direto, trilhas claras e tecnologia atual.",
  },
  {
    title: "Construa",
    description: "Projetos reais que transformam teoria em portfólio.",
  },
  {
    title: "Conecte",
    description:
      "Suporte, mentoria e uma comunidade que não deixa você parar.",
  },
  {
    title: "Conquiste",
    description:
      "Confiança técnica para buscar o seu primeiro — ou próximo — SIM.",
  },
];

export const companies = [
  "NUBANK",
  "iFood",
  "mercado livre",
  "Stone",
  "GLOBO",
  "XP",
];
