import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "bhenauto | Premium Tweedehands Voertuigen",
  description: "Ontdek onze zorgvuldig geselecteerde collectie van premium en luxe tweedehands voertuigen. Betrouwbare en deskundige dealer.",
  keywords: ["premium auto's", "luxe auto's", "tweedehands dealer", "occasions", "exclusieve voertuigen"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="scroll-smooth">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased min-h-screen flex flex-col bg-background-light text-slate-900`}
      >
        <Header />
        <main className="flex-grow pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
