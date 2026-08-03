# DevClub — Programe o seu futuro

Página institucional experimental criada para apresentar o ecossistema DevClub
como uma narrativa de transformação controlada pelo scroll.

## Conceito

O núcleo orbital representa potencial. À medida que a pessoa avança, a energia
se expande e revela um aluno real: o futuro deixa de ser abstrato e passa a ter
rosto. A experiência segue daí para formações, método, histórias, comunidade,
mentores e o convite final.

## Stack e decisões

- React 19 + TypeScript, dentro do starter Vinext/Next.
- CSS nativo para o sistema visual, responsividade e microinterações.
- `requestAnimationFrame` para atualizar apenas quatro variáveis CSS durante o
  scroll, evitando renderizações React a cada frame.
- `IntersectionObserver` para revelados de conteúdo fora das cenas fixadas.
- Sem backend: o desafio é institucional e não exige estado persistente.
- Sem biblioteca de animação: a matemática das cenas permanece pequena,
  auditável e fácil de explicar.

## Como funciona a cena principal

`hero-sequence` mede a distância útil do trecho fixado e normaliza o progresso
entre `0` e `1`. Esse valor alimenta quatro variáveis CSS:

- `--scene-progress`: progresso total;
- `--hero-out`: saída do núcleo;
- `--flash`: intensidade do clarão intermediário;
- `--human-in`: entrada da cena humana.

O valor do clarão usa uma curva senoidal para crescer e desaparecer dentro da
mesma faixa. Assim, o scroll pode ser revertido sem estados especiais.

A área de formações repete o mesmo princípio com `--formation-progress`,
traduzindo verticalmente o gesto do usuário em deslocamento horizontal dos
cards.

## Acessibilidade e desempenho

- Estrutura semântica com `main`, `section`, `article`, `nav` e `blockquote`.
- Links e botões possuem estados de foco e rótulos acessíveis.
- Conteúdo decorativo está oculto de leitores de tela.
- `prefers-reduced-motion` desativa loops e mantém o conteúdo visível.
- Eventos de scroll são passivos e consolidados em `requestAnimationFrame`.
- Imagens de produção são locais, sem dependências externas em runtime.

## Desenvolvimento

```bash
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
```
