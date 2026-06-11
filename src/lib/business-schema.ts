import { absoluteUrl } from "@/lib/site-seo";

const SITE_URL = absoluteUrl("/");

const verifiedSameAsUrls = [
  "https://www.facebook.com/autobhen/",
  "https://www.instagram.com/bhen_auto",
] as const;

const marketplaceSameAsUrls = [
  "https://cartobike.com/en/shop/bhenauto/classic/car",
  "https://www.autoscout24.be/fr/professional/bhen-auto-votre-mobilite-notre-metier",
  "https://www.2dehands.be/u/bhen-auto/31535006/",
  "https://gocar.be/nl/showroom/bhen-auto",
] as const;

export const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  "@id": `${SITE_URL}#business`,
  name: "BHEN Auto",
  alternateName: "BhenAuto",
  url: SITE_URL,
  telephone: "+32 2 582 83 53",
  email: "info@bhenauto.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Brusselsesteenweg 223",
    postalCode: "1730",
    addressLocality: "Asse",
    addressRegion: "Vlaams-Brabant",
    addressCountry: "BE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 50.89861107168115,
    longitude: 4.225758377155591,
  },
  openingHours: "Mo-Sa 10:00-18:00",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "10:00",
      closes: "18:00",
    },
  ],
  sameAs: [...verifiedSameAsUrls, ...marketplaceSameAsUrls],
} as const;

export function jsonLdScriptContent(data: unknown) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}
