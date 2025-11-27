"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { weddingConfig } from "@/lib/weddingData";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Hero() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +weddingConfig.date.full - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToRSVP = () => {
    document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
      
      {/* Animated Gold Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Left Gold Circle */}
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 opacity-20"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full rounded-full border border-[#D4AF37]/30" />
          <div className="absolute inset-8 rounded-full border border-[#D4AF37]/20" />
          <div className="absolute inset-16 rounded-full border border-[#D4AF37]/10" />
        </motion.div>

        {/* Top Right Gold Accent */}
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 opacity-15"
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full text-[#D4AF37]">
            <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.3" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.2" />
          </svg>
        </motion.div>

        {/* Bottom decorative lines */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Floating Gold Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#D4AF37]"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 4) * 15}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.7,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto py-32">
        {/* Pre-title */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[#D4AF37] tracking-[0.4em] uppercase text-sm mb-10 font-sans"
        >
          We&apos;re Getting Married
        </motion.p>

        {/* Couple Names */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6"
        >
          {weddingConfig.couple.partner1.firstName}
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="inline-block mx-4 md:mx-8 text-[#D4AF37]"
          >
            &
          </motion.span>
          {weddingConfig.couple.partner2.firstName}
        </motion.h1>

        {/* Date */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="font-serif text-2xl md:text-3xl text-[#b0b0b0] mb-16"
        >
          {weddingConfig.date.displayDate}
        </motion.p>

        {/* Decorative Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="w-40 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-16"
        />

        {/* Mini Countdown Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex justify-center gap-6 md:gap-12 mb-16"
        >
          {[
            { value: timeLeft.days, label: "Days" },
            { value: timeLeft.hours, label: "Hours" },
            { value: timeLeft.minutes, label: "Minutes" },
            { value: timeLeft.seconds, label: "Seconds" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <motion.div
                key={item.value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="font-serif text-4xl md:text-6xl text-white"
              >
                {String(item.value).padStart(2, "0")}
              </motion.div>
              <div className="text-xs md:text-sm text-[#D4AF37] uppercase tracking-widest mt-3">
                {item.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToRSVP}
          className="btn-primary text-lg px-12 py-5"
        >
          RSVP Now
        </motion.button>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border border-[#D4AF37]/50 rounded-full flex justify-center pt-2"
          >
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-1 bg-[#D4AF37] rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
