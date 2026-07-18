"use client";

import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#0a0a0a]/70 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-black tracking-tighter text-white">
          Dev<span className="text-[#00FF00]">Club</span>
        </Link>
        
        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {['Cursos', 'Proyectos', 'Comunidad', 'Mentores'].map((item) => (
            <Link 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="text-sm font-medium text-gray-400 hover:text-[#00FF00] hover:drop-shadow-[0_0_8px_rgba(0,255,0,0.8)] transition-all duration-300"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <button className="px-6 py-2.5 text-sm font-bold rounded-full border border-[#00FF00]/40 text-[#00FF00] hover:bg-[#00FF00] hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(0,255,0,0.15)] hover:shadow-[0_0_25px_rgba(0,255,0,0.5)]">
          Acceso Élite
        </button>
      </div>
    </header>
  );
}
