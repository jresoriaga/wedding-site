"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

// Sample gallery images - in production, replace with actual images
const galleryImages = [
  { id: 1, src: "/gallery/1.jpg", alt: "Couple photo 1", width: 800, height: 1200 },
  { id: 2, src: "/gallery/2.jpg", alt: "Couple photo 2", width: 1200, height: 800 },
  { id: 3, src: "/gallery/3.jpg", alt: "Couple photo 3", width: 800, height: 800 },
  { id: 4, src: "/gallery/4.jpg", alt: "Couple photo 4", width: 1200, height: 900 },
  { id: 5, src: "/gallery/5.jpg", alt: "Couple photo 5", width: 900, height: 1200 },
  { id: 6, src: "/gallery/6.jpg", alt: "Couple photo 6", width: 800, height: 800 },
  { id: 7, src: "/gallery/7.jpg", alt: "Couple photo 7", width: 1200, height: 800 },
  { id: 8, src: "/gallery/8.jpg", alt: "Couple photo 8", width: 800, height: 1000 },
];

// Placeholder component for when images don't exist
function ImagePlaceholder({ index }: { index: number }) {
  const colors = [
    "from-[#1a1a1a] to-[#252525]",
    "from-[#252525] to-[#1a1a1a]",
    "from-[#1f1f1f] to-[#2a2a2a]",
    "from-[#2a2a2a] to-[#1f1f1f]",
  ];
  
  return (
    <div className={`w-full h-full bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center border border-[#2a2a2a]`}>
      <div className="text-center text-[#707070]">
        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-sans">Photo {index + 1}</p>
      </div>
    </div>
  );
}

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (id: number) => {
    setImageErrors(prev => new Set(prev).add(id));
  };

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  // Handle body overflow for lightbox
  useEffect(() => {
    if (selectedImage !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedImage]);

  const goToPrevious = useCallback(() => {
    setSelectedImage((prev) =>
      prev !== null ? (prev === 0 ? galleryImages.length - 1 : prev - 1) : null
    );
  }, []);

  const goToNext = useCallback(() => {
    setSelectedImage((prev) =>
      prev !== null ? (prev === galleryImages.length - 1 ? 0 : prev + 1) : null
    );
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, goToPrevious, goToNext]);

  return (
    <section id="gallery" className="py-32 bg-[#0a0a0a]">
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
            Our Moments
          </p>
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-6">
            Photo Gallery
          </h2>
          <div className="section-divider" />
        </motion.div>

        {/* Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="break-inside-avoid"
            >
              <div
                onClick={() => openLightbox(index)}
                className="relative overflow-hidden rounded-2xl cursor-pointer group border border-[#2a2a2a]"
                style={{
                  aspectRatio: `${image.width} / ${image.height}`,
                }}
              >
                {imageErrors.has(image.id) ? (
                  <ImagePlaceholder index={index} />
                ) : (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={() => handleImageError(image.id)}
                  />
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    className="w-14 h-14 rounded-full bg-[#D4AF37] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <ZoomIn className="w-6 h-6 text-[#0a0a0a]" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-[#D4AF37]" />
            </button>

            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-6 z-50 w-12 h-12 rounded-full bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-[#D4AF37]" />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-6 z-50 w-12 h-12 rounded-full bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-[#D4AF37]" />
            </button>

            {/* Image */}
            <motion.div
              key={selectedImage}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full">
                {imageErrors.has(galleryImages[selectedImage].id) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="bg-white/10 rounded-2xl p-12 text-center">
                      <p className="text-white/70">Image not available</p>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={galleryImages[selectedImage].src}
                    alt={galleryImages[selectedImage].alt}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    onError={() => handleImageError(galleryImages[selectedImage].id)}
                    priority
                  />
                )}
              </div>
            </motion.div>

            {/* Image Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#D4AF37] font-sans tracking-wider">
              {selectedImage + 1} / {galleryImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
