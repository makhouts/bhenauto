import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield, Award, Calendar, CheckCircle } from "lucide-react";

// Placeholder data for featured cars (to be replaced by DB fetch later)
const featuredCars = [
  {
    id: "1",
    title: "2023 Porsche 911 Carrera S",
    price: "$135,000",
    mileage: "4,500 miles",
    image: "https://images.unsplash.com/photo-1503376760367-1b61b3699c27?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "2022 Mercedes-Benz G-Class",
    price: "$165,000",
    mileage: "12,000 miles",
    image: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "2024 Audi RS e-tron GT",
    price: "$145,000",
    mileage: "1,200 miles",
    image: "https://images.unsplash.com/photo-1620882863868-b3ee58b45688?q=80&w=2070&auto=format&fit=crop",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop"
            alt="Luxury Car Dark Hero"
            fill
            className="object-cover object-center scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-background"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-headings text-white mb-6 leading-tight tracking-tight font-black">
            Ontdek Compromisloze <br />
            <span className="text-[#d91c1c] italic pr-2">Uitmuntendheid</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium tracking-wide">
            Uw bestemming voor 's werelds meest exclusieve tweedehands voertuigen.
            Met precisie geselecteerd, met prestige geleverd.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/inventory"
              className="px-8 py-4 bg-[#d91c1c] text-white font-bold rounded-lg hover:bg-[#b91515] hover:shadow-lg hover:shadow-[#d91c1c]/20 transition-all duration-300 uppercase tracking-widest text-sm w-full sm:w-auto text-center"
            >
              Verken de Collectie
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/30 font-bold rounded-lg hover:bg-white hover:text-slate-900 transition-all duration-300 uppercase tracking-widest text-sm w-full sm:w-auto text-center"
            >
              Contacteer de Conciërge
            </Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 flex min-w-[32px] min-h-[32px] -translate-x-1/2 justify-center z-10 animate-bounce">
          <div className="w-[30px] h-[50px] border-2 border-white/50 rounded-full flex justify-center p-2">
            <div className="w-[4px] h-[8px] bg-white rounded-full mt-1"></div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm uppercase tracking-[0.3em] font-bold text-[#d91c1c] mb-4">Onze Filosofie</h2>
          <h3 className="text-3xl md:text-5xl font-headings font-black text-slate-900 mb-16">De Kunst van Auto-uitmuntendheid</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl hover:shadow-lg transition-shadow border border-slate-100">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                <Award className="text-[#d91c1c]" size={28} />
              </div>
              <h4 className="text-xl font-headings font-bold text-slate-900 mb-3">Gecureerde Selectie</h4>
              <p className="text-slate-600 text-sm leading-relaxed text-center font-medium">
                Elk voertuig in onze showroom wordt minutieus geïnspecteerd en geselecteerd om te voldoen aan de hoogste eisen van luxe en prestaties.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl hover:shadow-lg transition-shadow border border-slate-100">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                <Shield className="text-[#d91c1c]" size={28} />
              </div>
              <h4 className="text-xl font-headings font-bold text-slate-900 mb-3">Gecertificeerde Kwaliteit</h4>
              <p className="text-slate-600 text-sm leading-relaxed text-center font-medium">
                Onze rigoureuze inspectie op 150 punten garandeert dat uw investering solide, veilig en klaar is voor de weg die voor u ligt.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl hover:shadow-lg transition-shadow border border-slate-100">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                <Calendar className="text-[#d91c1c]" size={28} />
              </div>
              <h4 className="text-xl font-headings font-bold text-slate-900 mb-3">White-Glove Service</h4>
              <p className="text-slate-600 text-sm leading-relaxed text-center font-medium">
                Van uw eerste aanvraag tot de levering van uw voertuig, ervaar een ongeëvenaard niveau van persoonlijke aandacht.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vehicles Section */}
      <section className="py-24 bg-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-sm uppercase tracking-[0.3em] font-bold text-[#d91c1c] mb-4">Showroom</h2>
              <h3 className="text-3xl md:text-5xl font-headings font-black text-slate-900">Uitgelichte Aanwinsten</h3>
            </div>
            <Link href="/inventory" className="hidden md:flex items-center text-sm uppercase tracking-widest font-bold text-slate-500 hover:text-[#d91c1c] group transition-colors">
              Bekijk Alles <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCars.map((car, index) => (
              <div key={car.id} className="group cursor-pointer animate-fade-in bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="relative h-[250px] w-full overflow-hidden">
                  <Image
                    src={car.image}
                    alt={car.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-headings font-bold text-slate-900 mb-2 group-hover:text-[#d91c1c] transition-colors">{car.title}</h4>
                  <div className="flex justify-between items-center text-sm mb-4">
                    <span className="text-slate-500 font-medium">{car.mileage}</span>
                    <span className="text-[#d91c1c] font-black text-lg">{car.price}</span>
                  </div>
                  <div className="h-[1px] w-full bg-slate-100"></div>
                  <div className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-[#d91c1c] transition-colors">
                    Bekijk Details
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Link href="/inventory" className="inline-flex items-center text-sm uppercase tracking-widest font-bold text-slate-600 border border-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors">
              Bekijk Alle Voertuigen <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop"
            alt="Find your next car"
            fill
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/80"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-headings font-black text-white mb-6">Klaar om het Buitengewone te Ervaren?</h2>
          <p className="text-white/90 font-medium mb-10 text-lg sm:px-10">
            Plan een privébezichtiging of spreek met een van onze autospecialisten om de perfecte aanvulling op uw collectie te vinden.
          </p>
          <Link
            href="/contact"
            className="inline-block px-10 py-5 bg-[#d91c1c] text-white font-bold rounded-lg hover:bg-[#b91515] hover:shadow-lg hover:shadow-[#d91c1c]/20 transition-all duration-300 uppercase tracking-widest text-sm"
          >
            Plan een Consultatie
          </Link>
        </div>
      </section>
    </div>
  );
}
