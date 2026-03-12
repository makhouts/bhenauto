import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, CheckCircle, Shield, Award, PenTool, Wind, Wrench } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Carrosserie | bhenauto',
    description: 'Expert carrosserie, lakwerk en restauratiediensten voor premium en luxe voertuigen.',
};

export default function CarrosseriePage() {
    const services = [
        {
            title: "Schadeherstel",
            description: "Precisie chassis uitlijning en carrosserieherstel naar fabrieksspecificaties.",
            icon: Wrench,
            highlight: "Fabrieksstandaard"
        },
        {
            title: "Custom Lakwerk",
            description: "Vlekkeloze kleurovereenkomst en custom afwerkingen met premium materialen.",
            icon: PenTool,
            highlight: "Perfecte Match"
        },
        {
            title: "Aero & Styling",
            description: "Professionele installatie van bodykits en aerodynamische verbeteringen.",
            icon: Wind,
            highlight: "Performance Parts"
        }
    ];

    return (
        <div className="min-h-screen bg-background-light pt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

                {/* Hero / Header Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-headings font-black text-slate-900 mb-4 tracking-tight">Expert Carrosserie</h1>
                    <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">
                        Meesterlijke restauratie en op maat gemaakte modificaties voor de meest veeleisende autoliefhebbers.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100">
                    {/* Left Column - Content */}
                    <div className="p-8 md:p-16 flex flex-col justify-center bg-slate-900 text-white relative overflow-hidden">
                        {/* Abstract Background Element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d91c1c]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                        <div className="relative z-10">
                            <div className="text-[#d91c1c] font-bold text-xs uppercase tracking-widest mb-4">Onze Diensten</div>
                            <h2 className="text-3xl md:text-4xl font-headings font-black mb-6 leading-tight">
                                Perfectie Herstellen.<br />Prestaties Verbeteren.
                            </h2>
                            <p className="text-slate-300 mb-10 text-lg leading-relaxed">
                                Onze ultramoderne faciliteit is uitgerust om alles aan te kunnen, van kleine cosmetische reparaties tot volledige chassisherstel. Wij behandelen elk voertuig als een meesterwerk.
                            </p>

                            <div className="grid gap-6 mb-12">
                                {services.map((service, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-12 h-12 rounded bg-[#d91c1c]/10 flex items-center justify-center shrink-0 text-[#d91c1c]">
                                            <service.icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-headings font-bold text-xl mb-1 flex items-center gap-2">
                                                {service.title}
                                                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase tracking-wider">{service.highlight}</span>
                                            </h3>
                                            <p className="text-slate-400 text-sm leading-relaxed">{service.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/contact?service=carrosserie"
                                className="inline-flex items-center gap-2 bg-[#d91c1c] text-white px-8 py-4 font-bold rounded hover:bg-[#b91515] transition-colors uppercase tracking-widest text-sm"
                            >
                                <Calendar size={18} />
                                Boek Consultatie
                            </Link>
                        </div>
                    </div>

                    {/* Right Column - Images/Visuals */}
                    <div className="relative h-96 lg:h-auto bg-slate-200">
                        <Image
                            src="https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=2000&auto=format&fit=crop"
                            alt="Carrosserie Workshop"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-8">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <Award className="text-[#d91c1c]" size={24} />
                                    <h4 className="font-black font-headings text-xl">Gecertificeerde Meesters</h4>
                                </div>
                                <p className="text-sm text-slate-200">Meer dan 20 jaar gecombineerde ervaring in luxe auto-afwerking.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Process / Why Us Footer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-slate-200">
                    <div className="text-center px-4">
                        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center text-[#d91c1c] mb-6">
                            <Shield size={32} />
                        </div>
                        <h3 className="text-lg font-headings font-bold text-slate-900 mb-2">Levenslange Garantie</h3>
                        <p className="text-slate-500 text-sm">Wij staan volledig achter ons spuitwerk en schadeherstel met een uitgebreide dekking.</p>
                    </div>
                    <div className="text-center px-4">
                        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center text-[#d91c1c] mb-6">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-lg font-headings font-bold text-slate-900 mb-2">Alleen OEM Onderdelen</h3>
                        <p className="text-slate-500 text-sm">Strikte naleving van fabrieksspecificaties met gebruik van originele onderdelen van de fabrikant.</p>
                    </div>
                    <div className="text-center px-4">
                        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center text-[#d91c1c] mb-6">
                            <Award size={32} />
                        </div>
                        <h3 className="text-lg font-headings font-bold text-slate-900 mb-2">Kleur Match Garantie</h3>
                        <p className="text-slate-500 text-sm">Geavanceerde spectrofotometer technologie zorgt voor een perfecte menging naar de fabrieksafwerking.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
