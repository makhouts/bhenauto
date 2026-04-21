"use client";

import { useState } from "react";
import { Shield, FileText, ChevronRight, Mail, Phone, MapPin } from "lucide-react";
import type { Locale } from "@/lib/i18n";

/* ─── tiny prose helpers ─── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d91c1c] mt-8 mb-3 flex items-center gap-3">
      <span className="h-px flex-1" style={{ background: "rgba(217,28,28,0.2)" }} />
      {children}
      <span className="h-px flex-1" style={{ background: "rgba(217,28,28,0.2)" }} />
    </h3>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="theme-text-muted text-sm leading-relaxed mb-3">{children}</p>;
}
function UL({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mb-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm theme-text-muted">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#d91c1c] shrink-0" />
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ul>
  );
}
function InfoGrid({ items }: { items: { icon: React.ReactNode; label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "rgba(217,28,28,0.04)", border: "1px solid var(--theme-border-subtle)" }}>
          <span className="text-[#d91c1c] shrink-0">{item.icon}</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider theme-text-faint">{item.label}</p>
            <p className="text-sm font-semibold theme-text">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
function Article({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#d91c1c]">{number}</span>
        <h4 className="font-headings font-black theme-text text-base">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/* ─── content per locale ─── */
function PrivacyContent({ locale }: { locale: Locale }) {
  const t = {
    nl: {
      intro: <>Dit Privacybeleid beschrijft hoe <strong className="theme-text">Bhenauto BV</strong> persoonsgegevens verzamelt, gebruikt en beschermt via de website of showroom, conform de GDPR/AVG.</>,
      who: "1.1 — Wie zijn wij?", addr: "Adres", vat: "BTW-nummer", email: "E-mail", phone: "Telefoon",
      what: "1.2 — Welke gegevens verzamelen wij?",
      whatIntro: "Wij verzamelen gegevens wanneer u contact opneemt, een proefrit aanvraagt of een voertuig aankoopt:",
      whatItems: ["<strong>Identificatiegegevens:</strong> Naam, adres, e-mailadres, telefoonnummer.", "<strong>Voertuiggegevens:</strong> Chassisnummer, nummerplaat en technische staat (bij inruil).", "<strong>Financiële gegevens:</strong> Bankrekeningnummer (bij betaling of overname).", "<strong>Documentatie:</strong> Kopie van identiteitskaart of rijbewijs (voor proefritten of inschrijvingen)."],
      why: "1.3 — Waarom gebruiken wij uw gegevens?",
      whyItems: ["Om een verkoopovereenkomst op te stellen en uit te voeren.", "Voor de wettelijke inschrijving van voertuigen en Car-Pass verplichtingen.", "Om te antwoorden op uw vragen via het contactformulier.", "Voor de boekhouding en fiscale verplichtingen."],
      share: "1.4 — Delen met derden",
      shareText: "Wij verkopen uw gegevens niet. Wij delen deze enkel met derden als dit noodzakelijk is voor de dienstverlening (bijv. verzekeringsmakelaar, DIV, boekhouder).",
      rights: "1.5 — Uw rechten",
      rightsText: "U heeft het recht om uw gegevens in te zien, te corrigeren of te laten verwijderen. Neem contact op via",
    },
    fr: {
      intro: <>Cette Politique de Confidentialité décrit comment <strong className="theme-text">Bhenauto BV</strong> collecte, utilise et protège les données personnelles, conformément au RGPD.</>,
      who: "1.1 — Qui sommes-nous ?", addr: "Adresse", vat: "N° de TVA", email: "E-mail", phone: "Téléphone",
      what: "1.2 — Quelles données collectons-nous ?",
      whatIntro: "Nous collectons des données lors d'un contact, d'un essai ou d'un achat :",
      whatItems: ["<strong>Données d'identification :</strong> Nom, adresse, e-mail, téléphone.", "<strong>Données véhicule :</strong> Châssis, plaque d'immatriculation et état technique (reprise).", "<strong>Données financières :</strong> Numéro de compte bancaire (paiement ou reprise).", "<strong>Documentation :</strong> Copie de la carte d'identité ou du permis (essais ou immatriculations)."],
      why: "1.3 — Pourquoi utilisons-nous vos données ?",
      whyItems: ["Pour établir et exécuter un contrat de vente.", "Pour l'immatriculation légale et les obligations Car-Pass.", "Pour répondre à vos questions via le formulaire.", "Pour la comptabilité et les obligations fiscales."],
      share: "1.4 — Partage avec des tiers",
      shareText: "Nous ne vendons pas vos données. Nous les partageons uniquement si nécessaire (courtier, DIV, comptable).",
      rights: "1.5 — Vos droits",
      rightsText: "Vous avez le droit de consulter, corriger ou supprimer vos données. Contactez-nous à",
    },
    en: {
      intro: <>This Privacy Policy describes how <strong className="theme-text">Bhenauto BV</strong> collects, uses and protects personal data obtained via the website or showroom, in accordance with GDPR.</>,
      who: "1.1 — Who are we?", addr: "Address", vat: "VAT number", email: "Email", phone: "Phone",
      what: "1.2 — What data do we collect?",
      whatIntro: "We collect data when you contact us, request a test drive or purchase a vehicle:",
      whatItems: ["<strong>Identification data:</strong> Name, address, email, phone number.", "<strong>Vehicle data:</strong> Chassis number, licence plate and technical condition (trade-in).", "<strong>Financial data:</strong> Bank account number (payment or trade-in).", "<strong>Documentation:</strong> Copy of identity card or driving licence (test drives or registrations)."],
      why: "1.3 — Why do we use your data?",
      whyItems: ["To draw up and execute a sales agreement.", "For legal vehicle registration and Car-Pass obligations.", "To respond to your queries via the contact form.", "For accounting and fiscal obligations."],
      share: "1.4 — Sharing with third parties",
      shareText: "We do not sell your data. We only share it when necessary for services (e.g. insurance broker, DIV, accountant).",
      rights: "1.5 — Your rights",
      rightsText: "You have the right to view, correct or delete your data. Please contact us at",
    },
  }[locale];

  return (
    <>
      <P>{t.intro}</P>
      <SectionTitle>{t.who}</SectionTitle>
      <InfoGrid items={[
        { icon: <MapPin size={15} />, label: t.addr, value: "Brusselsesteenweg 223, 1730 Asse" },
        { icon: <FileText size={15} />, label: t.vat, value: "BE 0542.809.426" },
        { icon: <Mail size={15} />, label: t.email, value: "info@bhenauto.be" },
        { icon: <Phone size={15} />, label: t.phone, value: "02 582 83 53" },
      ]} />
      <SectionTitle>{t.what}</SectionTitle>
      <P>{t.whatIntro}</P>
      <UL items={t.whatItems} />
      <SectionTitle>{t.why}</SectionTitle>
      <UL items={t.whyItems} />
      <SectionTitle>{t.share}</SectionTitle>
      <P>{t.shareText}</P>
      <SectionTitle>{t.rights}</SectionTitle>
      <P>{t.rightsText}{" "}<a href="mailto:info@bhenauto.be" className="text-[#d91c1c] font-semibold hover:underline">info@bhenauto.be</a>.</P>
    </>
  );
}

function TermsContent({ locale }: { locale: Locale }) {
  const t = {
    nl: {
      a1n: "Artikel 1", a1t: "Toepasselijkheid", a1: "Deze voorwaarden zijn van toepassing op alle aanbiedingen en overeenkomsten van Bhenauto BV. Door een bestelbon te ondertekenen, verklaart de klant zich akkoord.",
      a2n: "Artikel 2", a2t: "Totstandkoming van de verkoop", a2: "Aangezien Bhenauto BV geen online verkoop aanbiedt, komt de verkoop uitsluitend tot stand door fysieke ondertekening van een bestelbon in onze showroom te Asse.",
      a3n: "Artikel 3", a3t: "Geen Herroepingsrecht", a3: "Conform de Belgische wetgeving bij verkoop in een fysieke vestiging, beschikt de consument niet over een herroepingsrecht. Een ondertekende bestelbon is definitief en bindend voor beide partijen.",
      a4n: "Artikel 4", a4t: "Levering en Betaling", a4: ["De wagen wordt pas geleverd na volledige betaling van de overeengekomen prijs.", "Bij niet-betaling heeft Bhenauto BV het recht de verkoop te ontbinden en 15% schadevergoeding te eisen.", "Overnamewagens moeten bij levering in exact dezelfde staat zijn als tijdens de taxatie."],
      a5n: "Artikel 5", a5t: "Garantie (Tweedehandswagens)", a5: ["<strong>B2C (Consumenten):</strong> Wettelijke garantie van één jaar vanaf levering, conform de wet van 1 september 2004.", "<strong>B2B (Bedrijven):</strong> Wagen verkocht in de staat zoals ze is, zonder garantie, tenzij schriftelijk anders overeengekomen.", "De garantie dekt enkel verborgen gebreken bij levering, niet slijtage of schade door verkeerd gebruik."],
      a6n: "Artikel 6", a6t: "Klachten en Geschillen", a6: "Klachten dienen binnen 7 dagen schriftelijk gemeld te worden. Bij betwisting zijn de rechtbanken van Brussel/Halle-Vilvoorde bevoegd. Belgisch recht is van toepassing.",
    },
    fr: {
      a1n: "Article 1", a1t: "Applicabilité", a1: "Ces conditions s'appliquent à toutes les offres et contrats de Bhenauto BV. En signant un bon de commande, le client les accepte.",
      a2n: "Article 2", a2t: "Formation de la vente", a2: "Bhenauto BV ne proposant pas de vente en ligne, la vente est conclue exclusivement par signature physique d'un bon de commande dans notre showroom à Asse.",
      a3n: "Article 3", a3t: "Absence de droit de rétractation", a3: "Conformément à la législation belge, le consommateur ne dispose pas de droit de rétractation pour les ventes en établissement physique. Le bon de commande signé est définitif et contraignant.",
      a4n: "Article 4", a4t: "Livraison et Paiement", a4: ["Le véhicule n'est livré qu'après paiement intégral du prix convenu.", "En cas de non-paiement, Bhenauto BV peut résilier la vente et réclamer 15 % du prix à titre d'indemnité.", "Les véhicules de reprise doivent être dans le même état à la livraison qu'à l'évaluation."],
      a5n: "Article 5", a5t: "Garantie (Véhicules d'occasion)", a5: ["<strong>B2C (Consommateurs) :</strong> Garantie légale d'un an dès la livraison, conformément à la loi du 1er septembre 2004.", "<strong>B2B (Entreprises) :</strong> Véhicule vendu en l'état, sans garantie, sauf accord écrit contraire sur le bon de commande.", "La garantie couvre uniquement les défauts cachés présents à la livraison, pas l'usure ni la mauvaise utilisation."],
      a6n: "Article 6", a6t: "Réclamations et Litiges", a6: "Les réclamations doivent être signalées par écrit dans les 7 jours. En cas de litige, les tribunaux de Bruxelles/Hal-Vilvorde sont compétents. Le droit belge s'applique.",
    },
    en: {
      a1n: "Article 1", a1t: "Applicability", a1: "These terms apply to all offers and agreements of Bhenauto BV. By signing an order form, the customer agrees to these terms.",
      a2n: "Article 2", a2t: "Formation of the sale", a2: "Since Bhenauto BV does not offer online sales, the sale is concluded exclusively by physical signing of an order form at our showroom in Asse.",
      a3n: "Article 3", a3t: "No Right of Withdrawal", a3: "Under Belgian law for sales at a physical establishment, the consumer has no right of withdrawal. A signed order form is final and binding for both parties.",
      a4n: "Article 4", a4t: "Delivery and Payment", a4: ["The vehicle is only delivered after full payment of the agreed price.", "In case of non-payment, Bhenauto BV may dissolve the sale and claim 15% of the sale price as compensation.", "Trade-in vehicles must be in exactly the same condition at delivery as during the valuation."],
      a5n: "Article 5", a5t: "Warranty (Second-hand vehicles)", a5: ["<strong>B2C (Consumers):</strong> Statutory one-year warranty from delivery, per the law of 1 September 2004.", "<strong>B2B (Businesses):</strong> Vehicle sold as-is, without further warranty, unless otherwise agreed in writing.", "Warranty covers only latent defects at delivery — not wear parts or misuse damage."],
      a6n: "Article 6", a6t: "Complaints and Disputes", a6: "Complaints must be reported in writing within 7 days. In case of dispute, the courts of Brussels/Halle-Vilvoorde have jurisdiction. Belgian law applies.",
    },
  }[locale];

  return (
    <>
      <Article number={t.a1n} title={t.a1t}><P>{t.a1}</P></Article>
      <Article number={t.a2n} title={t.a2t}><P>{t.a2}</P></Article>
      <Article number={t.a3n} title={t.a3t}><P>{t.a3}</P></Article>
      <Article number={t.a4n} title={t.a4t}><UL items={t.a4} /></Article>
      <Article number={t.a5n} title={t.a5t}><UL items={t.a5} /></Article>
      <Article number={t.a6n} title={t.a6t}><P>{t.a6}</P></Article>
    </>
  );
}

/* ─── page labels ─── */
const labels: Record<Locale, {
  pageLabel: string; pageTitle: string; pageSubtitle: string;
  privacyLabel: string; privacyTitle: string; privacyUpdated: string;
  termsLabel: string; termsTitle: string; termsUpdated: string;
}> = {
  nl: {
    pageLabel: "Juridische Informatie", pageTitle: "Privacybeleid & Algemene Voorwaarden",
    pageSubtitle: "Bhenauto BV — Brusselsesteenweg 223, 1730 Asse",
    privacyLabel: "GDPR / AVG", privacyTitle: "Privacybeleid", privacyUpdated: "Bijgewerkt: 21 april 2026",
    termsLabel: "Voorwaarden", termsTitle: "Algemene Voorwaarden", termsUpdated: "Versie: april 2026",
  },
  fr: {
    pageLabel: "Informations Juridiques", pageTitle: "Politique de Confidentialité & Conditions Générales",
    pageSubtitle: "Bhenauto BV — Brusselsesteenweg 223, 1730 Asse",
    privacyLabel: "RGPD", privacyTitle: "Politique de Confidentialité", privacyUpdated: "Mis à jour : 21 avril 2026",
    termsLabel: "Conditions", termsTitle: "Conditions Générales de Vente", termsUpdated: "Version : avril 2026",
  },
  en: {
    pageLabel: "Legal Information", pageTitle: "Privacy Policy & Terms and Conditions",
    pageSubtitle: "Bhenauto BV — Brusselsesteenweg 223, 1730 Asse",
    privacyLabel: "GDPR", privacyTitle: "Privacy Policy", privacyUpdated: "Updated: 21 April 2026",
    termsLabel: "Terms", termsTitle: "Terms & Conditions", termsUpdated: "Version: April 2026",
  },
};

/* ─── main export ─── */
export default function LegalClient({ locale }: { locale: Locale }) {
  const t = labels[locale];
  const [active, setActive] = useState<"privacy" | "terms">("privacy");

  const navItems = [
    { id: "privacy" as const, icon: <Shield size={16} />, label: t.privacyLabel, title: t.privacyTitle, updated: t.privacyUpdated },
    { id: "terms" as const, icon: <FileText size={16} />, label: t.termsLabel, title: t.termsTitle, updated: t.termsUpdated },
  ];

  return (
    <main className="min-h-screen theme-bg pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.22em] uppercase text-[#d91c1c] mb-3">
            <Shield size={11} />{t.pageLabel}
          </div>
          <h1 className="text-3xl md:text-4xl font-headings font-black theme-text tracking-tight mb-2 leading-tight">
            {t.pageTitle}
          </h1>
          <p className="theme-text-faint text-sm font-medium">{t.pageSubtitle}</p>
        </div>

        {/* Side layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left nav ── */}
          <aside className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-3">
            {navItems.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className="w-full text-left rounded-2xl px-5 py-4 transition-all duration-300 group"
                  style={{
                    border: `1px solid ${isActive ? "#d91c1c" : "var(--theme-border)"}`,
                    background: isActive ? "rgba(217,28,28,0.06)" : "var(--theme-surface)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300"
                      style={{
                        background: isActive ? "#d91c1c" : "rgba(217,28,28,0.08)",
                        color: isActive ? "#fff" : "#d91c1c",
                      }}
                    >
                      {item.icon}
                    </span>
                    <ChevronRight
                      size={14}
                      className="shrink-0 transition-all duration-300"
                      style={{ color: isActive ? "#d91c1c" : "var(--theme-text-faint)", opacity: isActive ? 1 : 0.4 }}
                    />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] mt-3 mb-0.5"
                    style={{ color: isActive ? "#d91c1c" : "var(--theme-text-faint)" }}>
                    {item.label}
                  </p>
                  <p className="text-sm font-headings font-black leading-tight theme-text">
                    {item.title}
                  </p>
                  <p className="text-[10px] theme-text-faint mt-1">{item.updated}</p>
                </button>
              );
            })}
          </aside>

          {/* ── Right content panel ── */}
          <div
            className="flex-1 min-w-0 rounded-2xl px-6 py-7"
            style={{ border: "1px solid var(--theme-border)", background: "var(--theme-surface)" }}
          >
            {/* Panel header */}
            <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: "1px solid var(--theme-border)" }}>
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: "#d91c1c" }}
              >
                {navItems.find((i) => i.id === active)?.icon}
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d91c1c]">
                  {navItems.find((i) => i.id === active)?.label}
                </p>
                <h2 className="font-headings font-black theme-text text-xl leading-tight">
                  {navItems.find((i) => i.id === active)?.title}
                </h2>
              </div>
            </div>

            {/* Animated panel body */}
            <div key={active} style={{ animation: "fadeSlideIn 0.25s ease" }}>
              {active === "privacy"
                ? <PrivacyContent locale={locale} />
                : <TermsContent locale={locale} />}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
