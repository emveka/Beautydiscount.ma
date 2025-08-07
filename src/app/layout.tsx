// app/layout.tsx - Version avec Poppins + metadataBase ajouté
import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ['400', '500', '600', '700', '800'],
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  // 🆕 AJOUT pour corriger le warning
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  
  title: "BeautyDiscount.ma - Cosmétiques et Parfums à Prix Réduits",
  description: "Découvrez notre sélection de produits de beauté et cosmétiques de grandes marques à prix discount au Maroc.",
  
  // 🆕 AJOUT pour optimiser le SEO
  openGraph: {
    title: "BeautyDiscount.ma - Cosmétiques et Parfums à Prix Réduits",
    description: "Découvrez notre sélection de produits de beauté et cosmétiques de grandes marques à prix discount au Maroc.",
    url: '/',
    siteName: 'BeautyDiscount.ma',
    images: ['/BDlogo.png'],
    locale: 'fr_MA',
    type: 'website',
  },
  
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable}`}>
        {/* ✅ Wrapper client pour gérer l'hydratation Zustand */}
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}