import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { weddingConfig } from "@/lib/weddingData";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const coupleNames = `${weddingConfig.couple.partner1.firstName} & ${weddingConfig.couple.partner2.firstName}`;
const venueLocation = `${weddingConfig.venue.ceremony.city}, ${weddingConfig.venue.ceremony.state}`;

export const metadata: Metadata = {
  title: `${coupleNames} | Wedding`,
  description: `Join us as we celebrate our love. ${weddingConfig.date.displayDate} in ${venueLocation}.`,
  keywords: ["wedding", coupleNames, "celebration", venueLocation],
  openGraph: {
    title: `${coupleNames} | Wedding`,
    description: `Join us as we celebrate our love. ${weddingConfig.date.displayDate} in ${venueLocation}.`,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${inter.variable} antialiased bg-[#0a0a0a]`}
      >
        {children}
      </body>
    </html>
  );
}
