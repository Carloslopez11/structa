import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Marquee from '@/components/sections/Marquee';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <div className="flex-grow">
        <Hero />
        <Marquee />
        <Features />
      </div>
      <Footer />
    </main>
  );
}
