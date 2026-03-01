import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "About Us | bhenauto",
    description: "Learn about our heritage, philosophy, and dedication to providing the world's most exquisite automobiles.",
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
                    <h1 className="text-sm uppercase tracking-[0.4em] font-bold text-[#d91c1c] mb-6">Our Heritage</h1>
                    <h2 className="text-4xl md:text-6xl font-headings text-slate-900 font-black leading-tight drop-shadow-md">
                        Curators of Automotive <span className="text-[#d91c1c] italic">Artistry</span>
                    </h2>
                </div>
            </div>

            {/* Philosophy Content */}
            <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white my-12 rounded-3xl shadow-sm border border-slate-100">
                <div className="prose prose-slate prose-lg max-w-none prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed prose-headings:font-headings prose-headings:text-slate-900">
                    <p className="text-2xl text-slate-800 font-bold mb-12 text-center leading-normal">
                        "We don't simply sell cars. We connect passionate connoisseurs with their next masterpiece."
                    </p>

                    <div className="flex flex-col md:flex-row gap-12 items-start mt-16 pb-16 border-b border-slate-200">
                        <div className="md:w-1/3 text-3xl font-headings text-[#d91c1c] font-black">The Standard of Excellence.</div>
                        <div className="md:w-2/3 space-y-6">
                            <p>
                                Founded on an unwavering passion for the finest automobiles in the world, bhenauto has established itself as the premier destination for collectors, enthusiasts, and those who demand nothing less than perfection.
                            </p>
                            <p>
                                Our inventory doesn't rely on volume; it thrives on exceptional quality. Every vehicle that graces our showroom floor has been subjected to a rigorous evaluation process that examines its provenance, mechanical integrity, and aesthetic condition.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-12 items-start mt-16">
                        <div className="md:w-1/3 text-3xl font-headings text-[#d91c1c] font-black">Unrivaled Experience.</div>
                        <div className="md:w-2/3 space-y-6">
                            <p>
                                The acquisition of a premium automobile should be an event worthy of the vehicle itself. From your initial inquiry to the personalized delivery, our concierge team orchestrates a seamless process tailored entirely to your preferences.
                            </p>
                            <p>
                                Whether you are acquiring your first exotic sports car or adding to a world-class collection, our commitment to transparency, white-glove service, and automotive excellence remains resolute. We invite you to experience the difference.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
