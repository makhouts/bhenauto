// Server Component — fetches nav/footer dict slices and passes them to Header/Footer.
// The locale is passed directly from [lang]/layout.tsx to avoid re-deriving it
// from the x-pathname header (which could fall back to "fr" on certain routes).

import { getDictionary } from "@/lib/dictionaries";
import { type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ClientConditionalLayout from "@/components/ClientConditionalLayout";
import PageTransition from "@/components/PageTransition";

export default async function ConditionalLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const dict = await getDictionary(locale);

  return (
    <ClientConditionalLayout
      header={<Header dict={dict.nav} />}
      footer={<Footer dict={dict.footer} />}
      whatsApp={<WhatsAppButton />}
    >
      <PageTransition>{children}</PageTransition>
    </ClientConditionalLayout>
  );
}
