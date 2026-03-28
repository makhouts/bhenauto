import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import LatestOccasionsCarousel from "@/components/LatestOccasionsCarousel";

// Placeholder data for featured cars (to be replaced by DB fetch later)
const featuredCars = [
  {
    id: "1",
    title: "2023 Porsche 911 Carrera S",
    price: "€135.000",
    mileage: "4.500 km",
    image: "https://images.unsplash.com/photo-1503376760367-1b61b3699c27?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "2022 Mercedes-Benz G-Class",
    price: "€165.000",
    mileage: "12.000 km",
    image: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "2024 Audi RS e-tron GT",
    price: "€145.000",
    mileage: "1.200 km",
    image: "https://images.unsplash.com/photo-1620882863868-b3ee58b45688?q=80&w=2070&auto=format&fit=crop",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f6f6]">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden bg-[#e6e6e6]">
        {/* We use a solid light/gradient background to let the car pop, similar to the mockup */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#f0f0f0] to-[#e0e0e0]">
          <Image
            src="https://images.unsplash.com/photo-1503376760367-1b61b3699c27?q=80&w=2070&auto=format&fit=crop"
            alt="Luxury Showcase"
            fill
            className="object-cover mix-blend-multiply opacity-50"
            priority
          />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-12 w-full max-w-7xl mx-auto flex flex-col items-start animate-fade-in pt-20">
          <h1 className="text-6xl md:text-8xl font-headings text-slate-900 mb-2 leading-tight tracking-tighter font-black">
            Ervaar <br />
            <span className="text-[#d91c1c]">Uitmuntendheid.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-800 mb-10 max-w-xl font-medium tracking-wide">
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
              className="px-8 py-3.5 bg-transparent text-slate-900 border border-slate-900 font-bold rounded hover:bg-slate-900 hover:text-white transition-colors w-full sm:w-auto text-center"
            >
              Maak een Carrosserie Afspraak
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Occasions Carousel */}
      <LatestOccasionsCarousel />

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

      {/* Client Experiences Section */}
      <section className="py-24 bg-[#f8f6f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-headings font-black text-slate-900 inline-block border-b-2 border-[#d91c1c] pb-2">Klantervaringen</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Marc Desmet", role: "Ondernemer", quote: `"De expertise die het BhenAuto team toonde tijdens de aankoop van mijn Porsche was opmerkelijk. Werkelijk de beste in België."` },
              { name: "Sophie Dubois", role: "Architect", quote: `"Professioneel carrosseriewerk! Mijn auto ziet er weer uit alsof hij net uit de fabriek komt. Uitstekende kleurovereenkomst."` },
              { name: "Jean-Luc Gerard", role: "Verzamelaar", quote: `"Een gespecialiseerde service voor bijzondere auto's. Ze begrijpen high-end voertuigen beter dan elke andere dealer die ik heb bezocht."` }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 relative">
                <div className="absolute top-6 right-6 text-red-100">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                </div>
                <div className="flex gap-1 text-[#d91c1c] mb-6">
                  {Array(5).fill(0).map((_, j) => (
                    <svg key={j} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
                <p className="text-slate-500 text-sm italic mb-6 min-h-[60px]">
                  {testimonial.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                    <Image src={`https://i.pravatar.cc/150?img=${i + 11}`} width={40} height={40} alt={testimonial.name} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{testimonial.name}</h5>
                    <p className="text-xs text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
