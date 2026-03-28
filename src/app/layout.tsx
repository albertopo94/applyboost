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
    title: "ApplyBoost — Multiplica tus entrevistas",
    description: "Obtén un CV y carta de presentación a medida en segundos — optimizados para superar los filtros (ATS).",
    url: "https://www.45.90.237.160.sslip.io",
    siteName: "ApplyBoost",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ApplyBoost — Optimiza tu CV con IA",
    description: "Multiplica tus posibilidades de éxito con CVs optimizados por IA.",
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
