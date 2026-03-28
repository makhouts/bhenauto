"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";
import { Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const result = await login(formData);

        if (result.error) {
            setError(result.error);
            setIsSubmitting(false);
        } else {
            router.push("/admin");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Left side: Premium Image */}
            <div className="hidden lg:flex w-1/2 relative">
                <Image
                    src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2070&auto=format&fit=crop"
                    alt="bhenauto Hoofdkantoor"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-[#d91c1c]/30 flex items-center justify-center p-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="text-[#d91c1c]">
                                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.92 6c-.2-.58-.76-1-1.42-1h-11c-.66 0-1.22.42-1.42 1L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-6zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z" />
                                    <circle cx="7.5" cy="14.5" r="1.5" />
                                    <circle cx="16.5" cy="14.5" r="1.5" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-headings font-black text-white tracking-tighter uppercase">
                                BHEN<span className="text-[#d91c1c]">AUTO</span>
                            </h2>
                        </div>
                        <p className="text-white/60 font-medium max-w-md mx-auto text-sm leading-relaxed">
                            Beveiligd beheersportaal voor geautoriseerd personeel.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden bg-white">
                {/* Subtle decorative gradient */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#d91c1c]/5 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-slate-200/50 blur-3xl rounded-full pointer-events-none" />

                <motion.div
                    className="w-full max-w-sm relative z-10"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    {/* Icon */}
                    <motion.div
                        className="flex justify-center mb-8"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl">
                            <ShieldCheck size={28} className="text-[#d91c1c]" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h1 className="text-3xl font-headings font-black text-slate-900 text-center mb-2">
                            Toegangsportaal
                        </h1>
                        <p className="text-slate-500 text-center mb-10 text-sm">
                            Log in met uw beheerdersgegevens.
                        </p>
                    </motion.div>

                    <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm text-center rounded-lg font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                Toegangscode
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                disabled={isSubmitting}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3.5 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-2 focus:ring-[#d91c1c]/20 transition-all disabled:opacity-50 tracking-widest placeholder:text-slate-300"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-slate-400 mt-2 italic flex justify-between">
                                <span>Demo Hint:</span>
                                <span className="text-slate-600 font-medium not-italic">admin123</span>
                            </p>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-[#d91c1c] hover:bg-[#b91515] text-white py-4 font-bold uppercase tracking-widest text-sm flex justify-center items-center rounded-lg transition-colors duration-300 shadow-lg shadow-[#d91c1c]/20 disabled:opacity-70 group"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    Verifiëren...
                                </>
                            ) : (
                                <>
                                    Beveiligd Inloggen
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </motion.form>

                    <motion.div
                        className="mt-10 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <Link
                            href="/"
                            className="text-xs text-slate-400 hover:text-[#d91c1c] transition-colors uppercase tracking-widest font-bold py-2 inline-block"
                        >
                            Terug naar de website
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
