import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import NavBar from "./components/NavBar";

// Replace with your real publisher ID from Google AdSense → https://adsense.google.com
const ADSENSE_PUBLISHER_ID = 'ca-pub-9216805517889728'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "La Union Summer Outing — Friends Itinerary Planner",
  description: "Plan your La Union outing with your squad. Vote on restaurants, see the live poll, and find spots on the map.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google AdSense — loads once for the whole site */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <NavBar />
        <main className="sm:pt-14 pb-16 sm:pb-0 min-h-dvh">
          {children}
        </main>
      </body>
    </html>
  );
}
