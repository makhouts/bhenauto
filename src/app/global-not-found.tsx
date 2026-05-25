import NotFoundClient from "@/components/NotFoundClient";
import { getDictionary } from "@/lib/dictionaries";
import { defaultLocale } from "@/lib/i18n";
import { manrope } from "@/app/fonts";
import "./globals.css";

export default async function GlobalNotFound() {
  const dict = await getDictionary(defaultLocale);

  return (
    <html lang={defaultLocale} className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="dns-prefetch" href="https://images.bhenauto.com" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#020214" />
      </head>
      <body className={`${manrope.variable} antialiased min-h-screen flex flex-col`}>
        <NotFoundClient dict={dict.notFound} locale={defaultLocale} />
      </body>
    </html>
  );
}
