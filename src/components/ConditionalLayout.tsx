// Server Component — fetches nav/footer dict slices and passes them to Header/Footer.
// The locale is passed directly from [lang]/layout.tsx so the public root
// document can remain static/ISR-friendly.

import { getDictionary } from "@/lib/dictionaries";
import { type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ClientConditionalLayout from "@/components/ClientConditionalLayout";

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
      whatsApp={
        <WhatsAppButton
          label={dict.common.whatsappLabel}
          message={dict.common.whatsappGenericMessage}
        />
      }
    >
      {children}
    </ClientConditionalLayout>
  );
}
