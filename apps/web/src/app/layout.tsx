import { Inter } from "next/font/google";

import type { Metadata } from "next";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GovSphere — Plateforme de Collaboration Gouvernementale",
  description:
    "Plateforme sécurisée de collaboration interne pour le Gouvernement de la République Démocratique du Congo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
