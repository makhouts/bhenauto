import type { Metadata } from "next";
import { Inter, Playfair_Display, Nunito_Sans } from "next/font/google";
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

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BhenAuto | Premium Pre-Owned Vehicles",
    template: "%s | BhenAuto",
  },
  description:
    "BhenAuto in Asse offers carefully selected premium pre-owned vehicles, transparent service, bodywork, repairs, and workshop appointments.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="dns-prefetch" href="https://images.bhenauto.com" />
        {/* Favicon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#020214" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${nunitoSans.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
