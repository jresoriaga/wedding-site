"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { weddingConfig } from "@/lib/weddingData";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#countdown", label: "Countdown" },
    { href: "#details", label: "Details" },
    { href: "#gallery", label: "Gallery" },
    { href: "#story", label: "Our Story" },
    { href: "#rsvp", label: "RSVP" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#2a2a2a]"
            : "bg-transparent"
        }`}
      >
        <div className="container-wedding">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo / Initials */}
            <Link href="#" className="flex items-center">
              <span className="font-serif text-2xl text-white">
                {weddingConfig.couple.partner1.firstName.charAt(0)}
                <span className="text-[#D4AF37] mx-1">&</span>
                {weddingConfig.couple.partner2.firstName.charAt(0)}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-sans text-sm uppercase tracking-wider transition-colors duration-300 text-[#b0b0b0] hover:text-[#D4AF37]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="#rsvp"
                className="btn-primary py-2 px-8 text-sm"
              >
                RSVP
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#1a1a1a] transition-colors"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-full bg-[#111111] shadow-2xl md:hidden border-l border-[#2a2a2a]"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-[#2a2a2a]">
                  <span className="font-serif text-2xl text-white">
                    {weddingConfig.couple.partner1.firstName.charAt(0)}
                    <span className="text-[#D4AF37] mx-1">&</span>
                    {weddingConfig.couple.partner2.firstName.charAt(0)}
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#1a1a1a] transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 py-10 px-8">
                  <nav className="space-y-3">
                    {navLinks.map((link, index) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-4 px-5 rounded-xl text-white font-sans hover:bg-[#1a1a1a] hover:text-[#D4AF37] transition-colors"
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                  </nav>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-[#2a2a2a]">
                  <Link
                    href="#rsvp"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-primary w-full py-4 text-center block"
                  >
                    RSVP Now
                  </Link>
                  <p className="text-center text-[#707070] text-sm mt-6">
                    {weddingConfig.date.displayDate}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
