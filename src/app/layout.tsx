import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "sonner";
import AuthSync from "@/components/AuthSync";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ApplyBoost — Optimiza tu CV con IA",
  description:
    "Optimiza tu CV y genera cover letters personalizadas para cada oferta en segundos. Score ATS, edición inline y exportación en PDF pixel-perfect.",
  openGraph: {
    title: "ApplyBoost — De oferta a candidatura en segundos",
    description: "Genera un CV optimizado y una cover letter adaptada a la oferta, con formato listo para enviar.",
    url: "https://www.45.90.237.160.sslip.io",
    siteName: "ApplyBoost",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "https://www.45.90.237.160.sslip.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "ApplyBoost Identity",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ApplyBoost — De oferta a candidatura en segundos",
    description: "Genera un CV optimizado y una cover letter adaptada a la oferta, con formato listo para enviar.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased font-sans bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-50 transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            {children}
            <Toaster richColors position="top-right" />
            <AuthSync />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
