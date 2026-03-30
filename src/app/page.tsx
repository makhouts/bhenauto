import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import LatestOccasionsCarousel from "@/components/LatestOccasionsCarousel";
import prisma from "@/lib/prisma";
import heroBg from "@/assets/wallpaper.avif";
// Placeholder data removed

export default async function Home() {
  // 1. Fetch up to 9 featured cars
  const featuredDb = await prisma.car.findMany({
    where: { featured: true },
    orderBy: { createdAt: 'desc' },
    take: 9,
    include: { images: { take: 1 } }
  });

  let displayCarsDb = [...featuredDb];

  // 2. If < 9, fill the rest with newest non-featured cars
  if (displayCarsDb.length < 9) {
    const additionalDb = await prisma.car.findMany({
      where: { featured: false },
      orderBy: { createdAt: 'desc' },
      take: 9 - displayCarsDb.length,
      include: { images: { take: 1 } }
    });
    displayCarsDb = [...displayCarsDb, ...additionalDb];
  }

  // 3. Map to simple prop format
  const carouselData = displayCarsDb.map(c => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    price: c.price,
    year: c.year,
    mileage: c.mileage,
    fuel_type: c.fuel_type,
    image: c.images[0]?.url || "https://images.unsplash.com/photo-1555312399-28c11e73dbd6?q=80&w=2070&auto=format&fit=crop",
    sold: c.sold,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f6f6]">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroBg}
            alt="Luxury Showcase"
            fill
            className="object-cover animate-slow-zoom"
            priority
          />
          {/* Subtle dark overlay to ensure white text pops */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-12 w-full max-w-7xl mx-auto flex flex-col items-start animate-fade-in pt-20">
          <h1 className="text-6xl md:text-8xl font-headings text-white mb-2 leading-tight tracking-tighter font-black">
            Ervaar <br />
            <span className="text-[#d91c1c]">Uitmuntendheid.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-xl font-medium tracking-wide">
            Premium Auto's & Professionele Carrosserie in België.
            Ontdek onze zorgvuldig geselecteerde collectie high-performance voertuigen.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/inventory"
              className="px-8 py-3.5 bg-[#d91c1c] text-white font-bold rounded hover:bg-[#b91515] transition-colors w-full sm:w-auto text-center"
            >
              Bekijk Onze Voorraad
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3.5 bg-transparent text-white border border-white/50 backdrop-blur-sm font-bold rounded hover:bg-white hover:text-slate-900 hover:border-white transition-colors w-full sm:w-auto text-center"
            >
              Maak een Carrosserie Afspraak
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Occasions Carousel */}
      <LatestOccasionsCarousel cars={carouselData} />

      {/* Why Choose BhenAuto */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-headings font-black text-slate-900 mb-4">Waarom Kiezen Voor BhenAuto</h3>
          <p className="text-slate-500 mb-16 max-w-2xl mx-auto">Ervaar ongeëvenaarde kwaliteit en service in de luxe automarkt.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <CheckCircle className="text-[#d91c1c]" size={24} />
              </div>
              <h4 className="text-lg font-headings font-bold text-slate-900 mb-3">Premium Selectie</h4>
              <p className="text-slate-500 text-sm leading-relaxed text-center">
                Alleen de beste, goed onderhouden luxe voertuigen komen in onze voorraad na een strenge inspectie.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#d91c1c]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h4 className="text-lg font-headings font-bold text-slate-900 mb-3">Meester Carrosserie</h4>
              <p className="text-slate-500 text-sm leading-relaxed text-center">
                Deskundig schadeherstel en restauratiediensten met gebruik van de nieuwste technologie en spuittechnieken.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#d91c1c]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h4 className="text-lg font-headings font-bold text-slate-900 mb-3">Ervaring Op Maat</h4>
              <p className="text-slate-500 text-sm leading-relaxed text-center">
                Persoonlijk advies om uw droomauto te vinden of uw klassieker perfect te restaureren.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* World-Class Carrosserie */}
      <section className="py-24 bg-[#f8f6f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row rounded-2xl overflow-hidden shadow-2xl">
            {/* Dark Left Side */}
            <div className="bg-[#1e2333] p-12 lg:p-16 flex-1 text-white flex flex-col justify-center">
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-[#d91c1c] mb-4">EXPERT DIENSTEN</div>
              <h3 className="text-3xl md:text-5xl font-headings font-black mb-6 leading-tight">Wereldklasse Carrosserie</h3>
              <p className="text-slate-300 mb-10 text-sm leading-relaxed max-w-md">
                Van kleine krasreparaties tot volledige carrosserierestauratie, onze gecertificeerde specialisten zorgen ervoor dat uw voertuig terugkeert naar zijn originele showroomstaat. We gebruiken ultra-precieze gereedschappen en premium materialen.
              </p>

              <ul className="space-y-4 mb-10 text-sm">
                <li className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-[#d91c1c] shrink-0" />
                  <span>Kleurscreening & Verfcorrectie</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-[#d91c1c] shrink-0" />
                  <span>Structureel Chassisherstel</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-[#d91c1c] shrink-0" />
                  <span>Keramische Coating & Bescherming</span>
                </li>
              </ul>

              <div>
                <Link
                  href="/contact"
                  className="inline-block px-8 py-3 bg-[#d91c1c] text-white font-bold rounded hover:bg-[#b91515] transition-colors"
                >
                  Boek Service
                </Link>
              </div>
            </div>

            {/* White/Image Right Side */}
            <div className="bg-[#f0f0f0] flex-1 flex justify-center items-center p-8">
              {/* We create a composite look of two vertical cards as seen in mockup */}
              <div className="grid grid-cols-2 gap-4 h-full w-full max-w-sm">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col items-center justify-center p-6 relative">
                  <div className="text-center font-bold text-slate-800 tracking-widest text-[10px] mb-4 uppercase">Kleursysteem</div>
                  <div className="w-16 h-24 bg-slate-200 rounded border border-slate-300"></div>
                  <div className="w-full h-8 bg-slate-800 rounded mt-8"></div>
                  <div className="absolute bottom-4 left-4 text-[10px] font-bold bg-slate-500 text-white px-2 py-0.5 rounded-full">VOOR</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col items-center justify-center p-6 relative relative">
                  <div className="text-center mt-auto mb-4 w-12 h-24 bg-gradient-to-t from-slate-200 to-white rounded-t-xl border border-b-0 border-slate-300 relative">
                    <div className="absolute top-0 w-full h-4 bg-slate-800 rounded-t-xl"></div>
                  </div>
                  <div className="absolute bottom-4 left-4 text-[10px] font-bold bg-[#d91c1c] text-white px-2 py-0.5 rounded-full">NA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Experiences Section - Google Reviews Styled */}
      <section className="py-24 bg-[#f8f6f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h3 className="text-3xl font-headings font-black text-slate-900 inline-block border-b-2 border-[#d91c1c] pb-2 mb-3">Klantervaringen</h3>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-slate-900 leading-none">5.0</span>
                <div className="flex text-amber-500">
                  {/* 5 solid stars */}
                  {Array(5).fill(0).map((_, j) => (
                    <svg key={j} className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-slate-500">
                  Google Reviews
                  <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Marc Desmet", role: "1 maand geleden", quote: `"De expertise die het team toonde tijdens de aankoop van mijn droomauto was opmerkelijk. Vlotte service en zeer betrouwbaar."` },
              { name: "Sophie Dubois", role: "3 maanden geleden", quote: `"Professioneel carrosseriewerk! Mijn auto ziet er weer uit alsof hij net uit de fabriek komt. Uitstekende communicatie gedurende het proces."` },
              { name: "Jean-Luc Gerard", role: "4 maanden geleden", quote: `"Een gespecialiseerde service voor bijzondere auto's. Ze begrijpen high-end voertuigen beter dan elke andere dealer die ik heb bezocht in België."` },
              { name: "Thomas Peeters", role: "5 maanden geleden", quote: `"Perfect geholpen bij de aankoop van mijn Audi RS6. Geen loze beloftes, alles netjes afgehandeld zoals het hoort. Een ware aanrader!"` }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative flex flex-col items-start hover:shadow-md transition-shadow">
                <div className="flex gap-4 items-center mb-4">
                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-black text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 leading-tight">{testimonial.name}</h5>
                    <p className="text-xs text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 text-amber-400 mb-3">
                  {Array(5).fill(0).map((_, j) => (
                    <svg key={j} className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
                <p className="text-slate-600 text-[13px] leading-relaxed mb-4 flex-grow">
                  {testimonial.quote}
                </p>
                <div className="mt-auto w-4 h-4 opacity-50">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
