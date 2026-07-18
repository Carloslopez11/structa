"use client";

import { Code2, Cpu, Zap, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Arquitectura Escalable',
    description: 'Aprende a diseñar sistemas robustos y modulares preparados para millones de usuarios, aplicando principios SOLID.',
    icon: Layers,
  },
  {
    title: 'Clean Code',
    description: 'Escribe código que tus compañeros amarán leer. Prácticas de la industria para un software mantenible a largo plazo.',
    icon: Code2,
  },
  {
    title: 'Rendimiento Extremo',
    description: 'Optimiza tus aplicaciones para tiempos de carga ultrarrápidos, dominando el renderizado híbrido y la caché.',
    icon: Zap,
  },
  {
    title: 'Sistemas Complejos',
    description: 'Domina infraestructuras, microservicios y despliegues en la nube con confianza total.',
    icon: Cpu,
  }
];

export default function Features() {
  return (
    <section id="cursos" className="py-24 bg-[#0a0a0a] relative z-10 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
            El arsenal de la <span className="text-[#00FF00]">Élite</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Todo lo que necesitas dominar para convertirte en un Arquitecto de Software y Desarrollador Senior indiscutible.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-[#00FF00]/30 hover:shadow-[0_10px_40px_-10px_rgba(0,255,0,0.2)] transition-all duration-500 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#00FF00]/5 flex items-center justify-center mb-8 border border-[#00FF00]/10 group-hover:bg-[#00FF00]/20 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-[#00FF00]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
