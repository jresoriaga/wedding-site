# 💒 Sarah & Michael Wedding Website

A beautiful, modern, and interactive wedding website built with Next.js 16, TailwindCSS, and Framer Motion.

## ✨ Features

- **Hero Section** - Full-screen hero with animated floral elements and countdown
- **Countdown Timer** - Real-time countdown with smooth animations
- **Wedding Details** - Date, time, dress code, venue with Google Maps integration
- **Photo Gallery** - Masonry layout with custom lightbox viewer
- **Love Story Timeline** - Scroll-triggered animations telling your story
- **RSVP Form** - Interactive form with Supabase integration
- **Responsive Design** - Beautiful on all devices
- **Modern Animations** - Smooth Framer Motion animations throughout

## 🎨 Design

- **Color Palette**: Blush, ivory, champagne, sage green, gold accents
- **Typography**: Cormorant Garamond (headings) + Inter (body)
- **Style**: Minimalistic, elegant, luxurious

## 🛠️ Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TailwindCSS 4**
- **Framer Motion** for animations
- **Supabase** for RSVP database
- **Lucide React** for icons

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables (Optional)

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials. If not configured, RSVPs will save to local JSON.

### 3. Customize Your Wedding Details

Edit `src/lib/weddingData.ts` to update:

- Couple names
- Wedding date & time
- Venue information
- Love story timeline events
- Social media links

### 4. Add Your Photos

Place your photos in `public/gallery/`:
- Name them `1.jpg`, `2.jpg`, `3.jpg`, etc.
- Mix of landscape, portrait, and square photos works best
- Recommended: 8-12 high-quality images

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your site.

## 📦 Supabase Setup (For Production RSVPs)

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Create the RSVP Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create the RSVPs table
CREATE TABLE rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  attending BOOLEAN NOT NULL,
  guest_count INTEGER DEFAULT 1,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for RSVP submissions)
CREATE POLICY "Allow anonymous inserts" ON rsvps
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read all RSVPs (for admin)
CREATE POLICY "Allow authenticated reads" ON rsvps
  FOR SELECT
  TO authenticated
  USING (true);
```

### 3. Get Your API Keys

1. Go to Project Settings → API
2. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy the **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Update Environment Variables

Add the keys to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🌐 Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial wedding site"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" and import your repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click "Deploy"

Your site will be live in minutes!

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── rsvp/
│   │       └── route.ts      # API endpoint for RSVPs
│   ├── globals.css           # Global styles & theme
│   ├── layout.tsx            # Root layout with fonts
│   └── page.tsx              # Main page
├── components/
│   ├── Hero.tsx              # Hero section with animations
│   ├── Countdown.tsx         # Countdown timer section
│   ├── WeddingDetails.tsx    # Event details & map
│   ├── Gallery.tsx           # Photo gallery with lightbox
│   ├── LoveStory.tsx         # Timeline section
│   ├── RSVPForm.tsx          # RSVP form with validation
│   ├── Navigation.tsx        # Navigation bar
│   └── Footer.tsx            # Footer
└── lib/
    ├── supabase.ts           # Supabase client
    └── weddingData.ts        # Wedding configuration
```

## 🎨 Customization Guide

### Change Colors

Edit the CSS variables in `src/app/globals.css`:

```css
:root {
  --blush: #F8E8E8;
  --ivory: #FFFEF9;
  --champagne: #F7E7CE;
  --sage: #9CAF88;
  --gold: #D4AF37;
  --charcoal: #36454F;
}
```

### Change Fonts

Edit `src/app/layout.tsx` to use different Google Fonts.

### Update Wedding Info

All wedding details are in `src/lib/weddingData.ts`:

```typescript
export const weddingConfig = {
  couple: {
    partner1: { firstName: "Sarah", lastName: "Anderson" },
    partner2: { firstName: "Michael", lastName: "Johnson" },
  },
  date: {
    full: new Date("2025-06-15T16:00:00"),
    displayDate: "June 15, 2025",
    displayTime: "4:00 PM",
    dayOfWeek: "Saturday",
  },
  venue: {
    ceremony: {
      name: "Rosewood Garden Estate",
      address: "1234 Garden Lane",
      city: "Napa Valley",
      state: "California",
      // ... more details
    },
  },
  // ... more configuration
};
```

## 🔧 Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📱 Mobile Responsive

The website is fully responsive with:
- Mobile-friendly navigation menu
- Touch-friendly gallery lightbox
- Optimized layouts for all screen sizes
- Fast loading on mobile networks

## 💡 Tips

1. **Images**: Use high-quality, optimized images (under 500KB each)
2. **Testing**: Test RSVP form before going live
3. **Custom Domain**: Add your domain in Vercel settings
4. **Analytics**: Add Vercel Analytics for visitor insights

## 📄 License

MIT License - Free to use for your wedding!

---

Made with 💕 for celebrating love
