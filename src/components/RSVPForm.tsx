"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, AlertCircle, X, User, Users, MessageSquare } from "lucide-react";

interface FormData {
  name: string;
  attending: string;
  guestCount: number;
  message: string;
}

interface FormErrors {
  name?: string;
  attending?: string;
  guestCount?: string;
}

export default function RSVPForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    attending: "",
    guestCount: 1,
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [showModal, setShowModal] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name";
    }

    if (!formData.attending) {
      newErrors.attending = "Please let us know if you're attending";
    }

    if (formData.attending === "yes" && formData.guestCount < 1) {
      newErrors.guestCount = "Please enter the number of guests";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          attending: formData.attending === "yes",
          guest_count: formData.guestCount,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit RSVP");
      }

      setSubmitStatus("success");
      setShowModal(true);
      setFormData({
        name: "",
        attending: "",
        guestCount: 1,
        message: "",
      });
    } catch {
      setSubmitStatus("error");
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guestCount" ? parseInt(value) || 1 : value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <section id="rsvp" className="py-32 bg-[#0a0a0a]">
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
            Join Us
          </p>
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-6">
            RSVP
          </h2>
          <p className="text-[#b0b0b0] max-w-md mx-auto">
            We would be honored to have you celebrate this special day with us.
            Please let us know if you can make it.
          </p>
          <div className="section-divider mt-8" />
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-[#151515] rounded-3xl p-10 md:p-14 border border-[#2a2a2a]">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Name Field */}
              <div>
                <label className="block text-white font-medium mb-3 font-sans">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                    Your Name *
                  </div>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className={`input-field ${errors.name ? "border-red-400" : ""}`}
                />
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm mt-2 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </motion.p>
                )}
              </div>

              {/* Attending Field */}
              <div>
                <label className="block text-white font-medium mb-4 font-sans">
                  Will you be attending? *
                </label>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { value: "yes", label: "Joyfully Accepts", emoji: "🎉" },
                    { value: "no", label: "Regretfully Declines", emoji: "💔" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`relative flex items-center justify-center p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                        formData.attending === option.value
                          ? "border-[#D4AF37] bg-[#D4AF37]/10"
                          : "border-[#2a2a2a] hover:border-[#D4AF37]/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="attending"
                        value={option.value}
                        checked={formData.attending === option.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <span className="text-2xl mr-3">{option.emoji}</span>
                      <span className="text-white font-medium">{option.label}</span>
                      {formData.attending === option.value && (
                        <motion.div
                          layoutId="attending-check"
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </label>
                  ))}
                </div>
                {errors.attending && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm mt-2 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.attending}
                  </motion.p>
                )}
              </div>

              {/* Guest Count Field */}
              <AnimatePresence>
                {formData.attending === "yes" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-white font-medium mb-3 font-sans">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                        Number of Guests (including yourself)
                      </div>
                    </label>
                    <select
                      name="guestCount"
                      value={formData.guestCount}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Guest" : "Guests"}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Field */}
              <div>
                <label className="block text-white font-medium mb-3 font-sans">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                    Message for the Couple (optional)
                  </div>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Share your wishes, dietary restrictions, or any special requests..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send RSVP
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Success/Error Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#151515] rounded-3xl p-10 max-w-md w-full text-center border border-[#2a2a2a] relative"
              >
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#2a2a2a] transition-colors"
                >
                  <X className="w-4 h-4 text-[#707070]" />
                </button>

                {submitStatus === "success" ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center"
                    >
                      <Check className="w-10 h-10 text-[#D4AF37]" />
                    </motion.div>
                    <h3 className="font-serif text-3xl text-white mb-5">
                      Thank You!
                    </h3>
                    <p className="text-[#b0b0b0] mb-8">
                      Your RSVP has been received. We can&apos;t wait to celebrate with
                      you!
                    </p>
                    <div className="text-4xl">💐</div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-500/20 flex items-center justify-center"
                    >
                      <AlertCircle className="w-10 h-10 text-red-400" />
                    </motion.div>
                    <h3 className="font-serif text-3xl text-white mb-5">
                      Oops!
                    </h3>
                    <p className="text-[#b0b0b0] mb-8">
                      Something went wrong. Please try again or contact us directly.
                    </p>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSubmitStatus("idle");
                      }}
                      className="btn-secondary"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
