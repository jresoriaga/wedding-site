"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { weddingConfig } from "@/lib/weddingData";
import { Instagram, Heart } from "lucide-react";

export default function Footer() {
  const { couple, social, date } = weddingConfig;
  
  // Auto-generate initials from couple names
  const initials = `${couple.partner1.firstName.charAt(0)}&${couple.partner2.firstName.charAt(0)}`;

  const navLinks = [
    { href: "#countdown", label: "Countdown" },
    { href: "#details", label: "Details" },
    { href: "#gallery", label: "Gallery" },
    { href: "#story", label: "Our Story" },
    { href: "#rsvp", label: "RSVP" },
  ];

  return (
    <footer className="bg-[#111111] text-white py-20 relative overflow-hidden border-t border-[#2a2a2a]">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#D4AF37] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-[#D4AF37] blur-3xl" />
      </div>

      <div className="container-wedding relative z-10">
        {/* Top Section */}
        <div className="text-center mb-14">
          {/* Monogram */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border border-[#D4AF37]/50">
              <span className="font-serif text-3xl text-[#D4AF37]">
                {initials}
              </span>
            </div>
          </motion.div>

          {/* Couple Names */}
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl md:text-4xl mb-5"
          >
            {couple.partner1.firstName} & {couple.partner2.firstName}
          </motion.h3>

          {/* Date */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#b0b0b0] mb-10"
          >
            {date.displayDate}
          </motion.p>

          {/* Navigation */}
          <motion.nav
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-8 mb-10"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#707070] hover:text-[#D4AF37] transition-colors font-sans text-sm uppercase tracking-wider"
              >
                {link.label}
              </Link>
            ))}
          </motion.nav>

          {/* Social Links */}
          {social.instagram && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center gap-4 mb-10"
            >
              <a
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all"
              >
                <Instagram className="w-5 h-5 text-[#D4AF37]" />
              </a>
            </motion.div>
          )}

          {/* Hashtag */}
          {social.hashtag && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-[#D4AF37] font-serif text-xl mb-10"
            >
              {social.hashtag}
            </motion.p>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#2a2a2a] mb-10" />

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <p className="text-[#707070] text-sm font-sans flex items-center justify-center gap-2">
            Made with love
            <Heart className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
          </p>
          <p className="text-[#505050] text-xs mt-3 font-sans">
            © {new Date().getFullYear()} {couple.partner1.firstName} & {couple.partner2.firstName}. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
