import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#000000" }],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Secured2 - Quantum-secure® & AI-safe Data Protection",
  description: "Protecting your data against tomorrow's threats—today with QuantaMorphic® technology. Shrink, shred, and secure your data against quantum computing threats.",
  keywords: ["quantum security", "data protection", "AI security", "cybersecurity", "QuantaMorphic", "encryption", "data privacy"],
  authors: [{ name: "Secured2" }],
  creator: "Secured2",
  publisher: "Secured2",
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body 
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-black text-white antialiased selection:bg-blue-500/30 selection:text-white [&_h1]:font-space-grotesk [&_h2]:font-space-grotesk [&_h3]:font-space-grotesk min-h-screen`}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
              </div>
            </div>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}
