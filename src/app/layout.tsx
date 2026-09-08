import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  robots: { index: true, follow: true },
  title: {
    default: "ABACUSUP — Mental Arithmetic & Education Management Platform",
    template: "%s | ABACUSUP",
  },
  description:
    "Professional Education Management Platform and premier academy for Soroban mental arithmetic, photographic memory, and accelerated calculation.",
  keywords: [
    "Abacus",
    "Soroban",
    "Mental Arithmetic",
    "Anzan",
    "Education Management System",
    "EMS SaaS",
    "STEM Education",
    "Child Cognitive Development",
  ],
  authors: [{ name: "ABACUSUP Education Technologies" }],
  openGraph: {
    title: "ABACUSUP — Professional Education Management Platform",
    description:
      "Modern full-stack education management system for Soroban arithmetic academies, campuses, instructors, and student cohorts.",
    type: "website",
    locale: "en_US",
    siteName: "ABACUSUP",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
