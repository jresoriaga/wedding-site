"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { weddingConfig } from "@/lib/weddingData";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
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
  }, [mounted]);

  const timeUnits = [
    { value: timeLeft.days, label: "Days", maxValue: 365 },
    { value: timeLeft.hours, label: "Hours", maxValue: 24 },
    { value: timeLeft.minutes, label: "Minutes", maxValue: 60 },
    { value: timeLeft.seconds, label: "Seconds", maxValue: 60 },
  ];

  if (!mounted) {
    return (
      <section id="countdown" className="py-32 bg-[#0a0a0a]">
        <div className="container-wedding">
          <div className="text-center">
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">
              Counting Down to Forever
            </h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="countdown" className="py-32 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#111111] to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#111111] to-transparent opacity-30" />
        {/* Gold accent lines */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent" />
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
            Save the Date
          </p>
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-6">
            Counting Down to Forever
          </h2>
          <div className="section-divider" />
        </motion.div>

        {/* Countdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 max-w-5xl mx-auto mb-16">
          {timeUnits.map((unit, index) => (
            <motion.div
              key={unit.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-[#151515] rounded-3xl p-8 md:p-10 border border-[#2a2a2a] hover:border-[#D4AF37]/30 transition-all duration-300 relative overflow-hidden group">
                {/* Background glow */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-32 h-32 rounded-full bg-[#D4AF37]/5 blur-2xl" />
                </div>

                {/* Number */}
                <div className="relative z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={unit.value}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="font-serif text-5xl md:text-7xl text-white leading-none mb-4"
                    >
                      {String(unit.value).padStart(2, "0")}
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Label */}
                  <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs md:text-sm font-sans">
                    {unit.label}
                  </p>
                </div>

                {/* Progress Ring */}
                <svg
                  className="absolute top-4 right-4 w-8 h-8 -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#2a2a2a"
                    strokeWidth="2"
                  />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: unit.value / unit.maxValue }}
                    transition={{ duration: 0.5 }}
                    style={{
                      strokeDasharray: "100",
                      strokeDashoffset: "0",
                    }}
                  />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Event Date Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-4 bg-[#151515] border border-[#2a2a2a] rounded-full px-10 py-5">
            <svg
              className="w-5 h-5 text-[#D4AF37]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-serif text-xl text-white">
              {weddingConfig.date.dayOfWeek}, {weddingConfig.date.displayDate}
            </span>
            <span className="text-[#707070]">at</span>
            <span className="font-serif text-xl text-white">
              {weddingConfig.date.displayTime}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
