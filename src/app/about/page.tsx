import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Over Ons | bhenauto",
    description: "Lees meer over ons erfgoed, filosofie en toewijding aan het leveren van de meest voortreffelijke automobielen ter wereld.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background-light">
            {/* Hero Section */}
            <div className="relative h-[60vh] flex items-center justify-center overflow-hidden border-b border-slate-200 mt-20">
                <div className="absolute inset-0 z-0 opacity-50">
                    <Image
                        src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2064&auto=format&fit=crop"
                        alt="bhenauto Heritage"
                        fill
                        className="object-cover object-center scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white to-black/40"></div>
                </div>

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <h1 className="text-sm uppercase tracking-[0.4em] font-bold text-[#d91c1c] mb-6">Ons Erfgoed</h1>
                    <h2 className="text-4xl md:text-6xl font-headings text-slate-900 font-black leading-tight drop-shadow-md">
                        Curators van Automotive <span className="text-[#d91c1c] italic">Kunst</span>
                    </h2>
                </div>
            </div>

            {/* Philosophy Content */}
            <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white my-12 rounded-3xl shadow-sm border border-slate-100">
                <div className="prose prose-slate prose-lg max-w-none prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed prose-headings:font-headings prose-headings:text-slate-900">
                    <p className="text-2xl text-slate-800 font-bold mb-12 text-center leading-normal">
                        "We verkopen niet zomaar auto's. We verbinden gepassioneerde fijnproevers met hun volgende meesterwerk."
                    </p>

                    <div className="flex flex-col md:flex-row gap-12 items-start mt-16 pb-16 border-b border-slate-200">
                        <div className="md:w-1/3 text-3xl font-headings text-[#d91c1c] font-black">De Standaard van Uitmuntendheid.</div>
                        <div className="md:w-2/3 space-y-6">
                            <p>
                                Opgericht vanuit een onwrikbare passie voor de beste automobielen ter wereld, heeft bhenauto zich gevestigd als de ultieme bestemming voor verzamelaars, liefhebbers en degenen die niets minder dan perfectie eisen.
                            </p>
                            <p>
                                Onze voorraad is niet gebaseerd op volume; het gedijt op uitzonderlijke kwaliteit. Elk voertuig dat onze showroomvloer siert, heeft een rigoureus evaluatieproces ondergaan dat de herkomst, mechanische integriteit en esthetische staat onderzoekt.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-12 items-start mt-16">
                        <div className="md:w-1/3 text-3xl font-headings text-[#d91c1c] font-black">Ongeëvenaarde Ervaring.</div>
                        <div className="md:w-2/3 space-y-6">
                            <p>
                                De aankoop van een premium automobiel moet een gebeurtenis zijn die het voertuig zelf waardig is. Vanaf uw eerste aanvraag tot de gepersonaliseerde aflevering, orkestreert ons conciërgeteam een naadloos proces, volledig afgestemd op uw voorkeuren.
                            </p>
                            <p>
                                Of u nu uw eerste exotische sportwagen aanschaft of toevoegt aan een collectie van wereldklasse, onze toewijding aan transparantie, uitmuntende service en automotive perfectie blijft resoluut. Wij nodigen u uit om het verschil te ervaren.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
