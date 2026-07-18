import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#050505] py-12 border-t border-white/5 relative z-10">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/" className="text-2xl font-black tracking-tighter text-white">
            Dev<span className="text-[#00FF00]">Club</span>
          </Link>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Structa. Todos los derechos reservados.
          </p>
        </div>
        
        <div className="flex gap-6">
          {['Twitter', 'GitHub', 'LinkedIn', 'Discord'].map((social) => (
            <Link 
              key={social} 
              href="#" 
              className="text-sm font-medium text-gray-500 hover:text-[#00FF00] transition-colors duration-300"
            >
              {social}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
