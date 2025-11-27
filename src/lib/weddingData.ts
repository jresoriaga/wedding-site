// Wedding configuration - Edit these values to customize your wedding website

export const weddingConfig = {
  // Couple Information
  couple: {
    partner1: {
      firstName: "Shiela",
      lastName: "Teves",
    },
    partner2: {
      firstName: "Erwin",
      lastName: "Flores",
    },
  },

  // Wedding Date & Time
  date: {
    full: new Date("2026-02-26T10:00:00"),
    displayDate: "February 26, 2026",
    displayTime: "09:30 AM",
    dayOfWeek: "Wednesday",
  },

  // Venue Information
  venue: {
    ceremony: {
      name: "Immaculate Heart of Mary Parish Church",
      address: "Daang Bakal Rd",
      city: "Antipolo",
      state: "Rizal",
      zip: "1870",
      description: "Join us at the historic Immaculate Heart of Mary Parish Church for our wedding ceremony.",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Immaculate+Heart+of+Mary+Parish+Church+Antipolo+Rizal",
      coordinates: {
        lat: 14.5914,
        lng: 121.1583,
      },
    },
    reception: {
      name: "Wood Lane Forest Events Place and Resort",
      address: "Brgy, Inarawan Marcos Highway",
      city: "Antipolo",
      state: "Rizal",
      zip: "1870",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Wood+Lane+Forest+Events+Place+and+Resort+Antipolo+Rizal",
    },
  },

  // Event Details
  details: {
    dressCode: "Semi-Formal / Garden Attire",
    colors: "Sage green, blush, and champagne",
    ceremony: "Catholic ceremony at the historic parish church",
    cocktailHour: "4:00 PM - 5:00 PM at Wood Lane Forest Events Place and Resort",
    reception: "5:00 PM - 10:00 PM at Wood Lane Forest Events Place and Resort",
  },

  // Schedule
  schedule: [
    { time: "10:00 AM", activity: "Ceremony" },
    { time: "4:00 PM", activity: "Cocktail Hour" },
    { time: "5:00 PM", activity: "Reception" },
  ],

  // Love Story Timeline
  loveStory: [
    {
      date: "September 2018",
      title: "First Met",
      description: "We met at a mutual friend's birthday party. Little did we know that night would change our lives forever.",
      icon: "heart",
    },
    {
      date: "December 2018",
      title: "First Date",
      description: "Our first official date was at a cozy Italian restaurant downtown. We talked for hours and didn't want the night to end.",
      icon: "coffee",
    },
    {
      date: "June 2019",
      title: "Said 'I Love You'",
      description: "During a sunset picnic at the beach, we finally said those three magical words to each other.",
      icon: "sparkles",
    },
    {
      date: "March 2020",
      title: "Moved In Together",
      description: "We took the leap and moved into our first apartment together. Every day felt like an adventure.",
      icon: "home",
    },
    {
      date: "August 2024",
      title: "The Proposal",
      description: "Under the stars at the same beach where we first said 'I love you,' Michael got down on one knee.",
      icon: "ring",
    },
    {
      date: "June 2025",
      title: "Forever Begins",
      description: "We can't wait to celebrate our love with all of you and begin this beautiful new chapter.",
      icon: "calendar",
    },
  ],

  // Gallery Images (replace with your own images in /public/gallery/)
  gallery: [
    { src: "/gallery/photo1.jpg", alt: "Couple photo 1", width: 800, height: 1200 },
    { src: "/gallery/photo2.jpg", alt: "Couple photo 2", width: 1200, height: 800 },
    { src: "/gallery/photo3.jpg", alt: "Couple photo 3", width: 800, height: 800 },
    { src: "/gallery/photo4.jpg", alt: "Couple photo 4", width: 1200, height: 800 },
    { src: "/gallery/photo5.jpg", alt: "Couple photo 5", width: 800, height: 1200 },
    { src: "/gallery/photo6.jpg", alt: "Couple photo 6", width: 800, height: 800 },
    { src: "/gallery/photo7.jpg", alt: "Couple photo 7", width: 1200, height: 800 },
    { src: "/gallery/photo8.jpg", alt: "Couple photo 8", width: 800, height: 1200 },
  ],

  // Social Media Links (optional)
  social: {
    instagram: "https://instagram.com/shielaanderwin",
    hashtag: "#ShielaAnnAndErwinForever",
  },

  // Footer - these will auto-generate from couple names if left empty
  footer: {
    initials: "", // Leave empty to auto-generate from couple names
    message: "Made with love",
  },
};
