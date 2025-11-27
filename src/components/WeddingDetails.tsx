"use client";

import { motion } from "framer-motion";
import { weddingConfig } from "@/lib/weddingData";
import { MapPin, Clock, Shirt, Calendar, ExternalLink } from "lucide-react";

export default function WeddingDetails() {
  const { venue, details, date, schedule } = weddingConfig;

  const detailCards = [
    {
      icon: Calendar,
      title: "When",
      content: (
        <>
          <p className="font-serif text-2xl text-white mb-2">{date.displayDate}</p>
          <p className="text-[#b0b0b0]">{date.dayOfWeek} at {date.displayTime}</p>
        </>
      ),
    },
    {
      icon: MapPin,
      title: "Where",
      content: (
        <>
          <p className="font-serif text-2xl text-white mb-2">{venue.ceremony.name}</p>
          <p className="text-[#b0b0b0]">
            {venue.ceremony.address}, {venue.ceremony.city}, {venue.ceremony.state}
          </p>
        </>
      ),
    },
    {
      icon: Shirt,
      title: "Dress Code",
      content: (
        <>
          <p className="font-serif text-2xl text-white mb-2">{details.dressCode}</p>
          <p className="text-[#b0b0b0]">Colors: {details.colors}</p>
        </>
      ),
    },
    {
      icon: Clock,
      title: "Schedule",
      content: (
        <div className="space-y-3 text-left">
          {schedule.map((item, index) => (
            <p key={index} className="text-[#b0b0b0]">
              <span className="font-medium text-white">{item.time}</span> - {item.activity}
            </p>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section id="details" className="py-32 bg-[#111111]">
      <div className="container-wedding">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-[#D4AF37] tracking-[0.4em] uppercase text-sm mb-6 font-sans">
            The Details
          </p>
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-6">
            Wedding Information
          </h2>
          <div className="section-divider" />
        </motion.div>

        {/* Detail Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 mb-20">
          {detailCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-[#151515] rounded-3xl p-10 border border-[#2a2a2a] hover:border-[#D4AF37]/30 transition-all duration-300 group"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <card.icon className="w-7 h-7 text-[#0a0a0a]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#D4AF37] uppercase tracking-[0.2em] text-sm mb-4 font-sans">
                    {card.title}
                  </h3>
                  {card.content}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-[#151515] rounded-3xl overflow-hidden border border-[#2a2a2a]"
        >
          <div className="grid md:grid-cols-2">
            {/* Map Embed */}
            <div className="h-72 md:h-auto min-h-[350px] bg-[#1a1a1a] relative">
              <iframe
                src={`https://maps.google.com/maps?q=${venue.ceremony.coordinates.lat},${venue.ceremony.coordinates.lng}&hl=en&z=14&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              />
            </div>

            {/* Venue Info */}
            <div className="p-10 md:p-14 flex flex-col justify-center">
              <h3 className="font-serif text-3xl text-white mb-5">
                {venue.ceremony.name}
              </h3>
              <p className="text-[#b0b0b0] mb-2">
                {venue.ceremony.address}
              </p>
              <p className="text-[#b0b0b0] mb-8">
                {venue.ceremony.city}, {venue.ceremony.state} {venue.ceremony.zip}
              </p>
              <p className="text-[#707070] mb-10 leading-relaxed">
                {venue.ceremony.description}
              </p>
              
              <div className="flex flex-wrap gap-5">
                <motion.a
                  href={venue.ceremony.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary inline-flex items-center gap-3"
                >
                  <MapPin className="w-4 h-4" />
                  Open in Google Maps
                  <ExternalLink className="w-3 h-3" />
                </motion.a>
                <motion.a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${venue.ceremony.coordinates.lat},${venue.ceremony.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-secondary inline-flex items-center gap-3"
                >
                  Get Directions
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <div className="inline-block bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-10 py-7">
            <p className="text-[#b0b0b0] font-sans">
              <span className="font-medium text-[#D4AF37]">Parking:</span> Complimentary valet parking will be available
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
