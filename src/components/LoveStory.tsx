"use client";

import { motion } from "framer-motion";
import { weddingConfig } from "@/lib/weddingData";
import { Heart, Coffee, Sparkles, Home, Calendar } from "lucide-react";
import { GiDiamondRing } from "react-icons/gi";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  coffee: Coffee,
  sparkles: Sparkles,
  home: Home,
  ring: GiDiamondRing,
  calendar: Calendar,
};

export default function LoveStory() {
  const { loveStory } = weddingConfig;

  return (
    <section id="story" className="py-32 bg-[#111111] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-[#D4AF37] opacity-5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full bg-[#D4AF37] opacity-5 blur-3xl" />
      </div>

      <div className="container-wedding relative z-10">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-[#D4AF37] tracking-[0.4em] uppercase text-sm mb-6 font-sans">
            Our Journey
          </p>
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-6">
            Our Love Story
          </h2>
          <div className="section-divider" />
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Center Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/50 to-[#D4AF37] hidden md:block" />
          
          {/* Mobile Line */}
            <div className="absolute left-8 top-0 h-full w-px bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/50 to-[#D4AF37] md:hidden" />

          {/* Timeline Items */}
          <div className="space-y-16 md:space-y-0">
            {loveStory.map((event, index) => {
              const IconComponent = iconMap[event.icon] || Heart;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative flex items-center md:mb-16 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content Card */}
                  <div className={`w-full md:w-1/2 ${isEven ? "md:pr-16" : "md:pl-16"} pl-24 md:pl-0`}>
                    <div className="bg-[#151515] rounded-2xl p-8 border border-[#2a2a2a] hover:border-[#D4AF37]/30 transition-all duration-300">
                      {/* Date Badge */}
                      <span className="inline-block bg-[#D4AF37]/10 text-[#D4AF37] px-5 py-2 rounded-full text-sm font-sans mb-4 border border-[#D4AF37]/20">
                        {event.date}
                      </span>
                      
                      {/* Title */}
                      <h3 className="font-serif text-2xl text-white mb-3">
                        {event.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-[#b0b0b0] leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  {/* Timeline Icon - Desktop */}
                    <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 z-10">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className="w-16 h-16 rounded-full bg-[#0a0a0a] border-2 border-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/10"
                    >
                      <IconComponent className="w-6 h-6 text-[#D4AF37]" />
                    </motion.div>
                  </div>

                  {/* Timeline Icon - Mobile */}
                  <div className="absolute left-0 md:hidden z-10">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="w-16 h-16 rounded-full bg-[#0a0a0a] border-2 border-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/10"
                    >
                      <IconComponent className="w-6 h-6 text-[#D4AF37]" />
                    </motion.div>
                  </div>

                  {/* Empty space for the other side - Desktop only */}
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              );
            })}
          </div>

          {/* End Heart */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center mt-16"
          >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8960C] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
              <Heart className="w-12 h-12 text-[#0a0a0a] fill-[#0a0a0a]" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
