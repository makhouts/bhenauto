import { Inter, Playfair_Display, Nunito_Sans } from "next/font/google";
import { DARK_THEME } from "@/lib/themeConfig";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={`scroll-smooth ${DARK_THEME ? "dark" : ""}`}>
      <head>
        {/* Preconnect to image CDN — vehicle photos are served from R2 */}
        <link rel="preconnect" href="https://images.bhenauto.com" />
        <link rel="dns-prefetch" href="https://images.bhenauto.com" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${nunitoSans.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
