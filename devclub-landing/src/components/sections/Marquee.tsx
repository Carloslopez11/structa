export default function Marquee() {
  const codeSnippets = [
    "const developer = new Elite({ skills: ['React', 'Node', 'TS'] });",
    "SELECT * FROM developers WHERE mindset = 'growth';",
    "git commit -m 'feat: added #SangueVerde integration'",
    "docker-compose up -d --build",
    "npm run deploy --production",
    "while (true) { code(); review(); deploy(); }",
    "export const config = { runtime: 'edge' };"
  ];

  return (
    <div className="py-6 bg-[#050505] border-y border-white/5 overflow-hidden flex whitespace-nowrap relative z-10 w-full">
      {/* 
        To make a seamless infinite loop, we have two identical flex containers 
        moving with the same animation, seamlessly following each other. 
      */}
      <div className="animate-marquee flex gap-12 min-w-max pr-12">
        {codeSnippets.map((snippet, idx) => (
          <span key={`a-${idx}`} className="text-sm font-mono text-[#00FF00]/60">
            {snippet}
          </span>
        ))}
      </div>
      <div className="animate-marquee flex gap-12 min-w-max pr-12" aria-hidden="true">
        {codeSnippets.map((snippet, idx) => (
          <span key={`b-${idx}`} className="text-sm font-mono text-[#00FF00]/60">
            {snippet}
          </span>
        ))}
      </div>
    </div>
  );
}
