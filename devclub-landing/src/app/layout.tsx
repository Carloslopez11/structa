import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevClub | La Élite del Desarrollo",
  description: "Landing page para DevClub. Domina el código y únete a la élite con estilo #SangueVerde.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased selection:bg-[#00FF00]/30 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
