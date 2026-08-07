"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import logo from "@/assets/logo.webp";
import wallpaper from "@/assets/login-wallpaper.webp";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import AdminLocaleSwitcher from "@/components/admin/AdminLocaleSwitcher";

export default function LoginPage() {
    const router = useRouter();
    const { dict } = useAdminI18n();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [authChecked, setAuthChecked] = useState(false);

    // If already authenticated, redirect to dashboard; otherwise show the page
    useEffect(() => {
        fetch("/api/auth/check", { credentials: "same-origin" })
            .then(res => {
                if (res.ok) {
                    router.replace("/admin");
                } else {
                    setAuthChecked(true);
                }
            })
            .catch(() => { setAuthChecked(true); });
    }, [router]);

    if (!authChecked) return null;

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
        <div className="flex min-h-screen bg-[#efeee9]">
            {/* Left side: Premium Image */}
            <div className="relative hidden w-[58%] lg:flex" aria-hidden="true">
                <Image
                    src={wallpaper}
                    alt=""
                    fill
                    sizes="50vw"
                    quality={65}
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 flex items-end bg-black/65 p-14 xl:p-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.15 }}
                        className="max-w-xl border-l-2 border-[#d91c1c] pl-8 text-left"
                    >
                        <div className="mb-7">
                            <Image
                                src={logo}
                                alt="BhenAuto"
                                width={180}
                                height={60}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <p className="max-w-md text-sm font-medium uppercase leading-7 tracking-[0.12em] text-white/55">
                            {dict.login.eyebrow}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="relative flex w-full items-center justify-center p-6 sm:p-12 lg:w-[42%]">
                <div className="absolute right-6 top-6 sm:right-10 sm:top-10">
                    <AdminLocaleSwitcher compact />
                </div>

                <motion.div
                    className="relative z-10 w-full max-w-sm"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <div className="mb-8 flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center border border-[#c9c7c0] bg-white text-[#d91c1c]">
                            <ShieldCheck size={20} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">BhenAuto / Admin</p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                    >
                        <h1 className="mb-3 text-4xl font-black uppercase leading-none tracking-[-0.04em] text-[#111116]">
                            {dict.login.title}
                        </h1>
                        <p className="mb-10 border-b border-[#c9c7c0] pb-7 text-sm leading-6 text-slate-600">
                            {dict.login.subtitle}
                        </p>
                    </motion.div>

                    <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.15 }}
                    >
                        {error && (
                            <motion.div
                                role="alert"
                                aria-live="assertive"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div>
                            <label htmlFor="password" className="mb-3 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                {dict.login.passwordLabel}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                disabled={isSubmitting}
                                className="min-h-12 w-full border border-[#c9c7c0] bg-white px-4 py-3.5 tracking-widest text-slate-900 transition-colors placeholder:text-slate-300 focus:border-[#d91c1c] focus:outline-none focus:ring-2 focus:ring-[#d91c1c]/10 disabled:opacity-50"
                                placeholder="••••••••"
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            whileTap={{ scale: 0.99 }}
                            className="group flex min-h-12 w-full items-center justify-center bg-[#d91c1c] py-4 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors duration-200 hover:bg-[#b91515] disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    {dict.login.submitting}
                                </>
                            ) : (
                                <>
                                    {dict.login.submit}
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </motion.form>

                    <motion.div
                        className="mt-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.35, delay: 0.2 }}
                    >
                        <Link
                            href="/"
                            className="inline-block border-b border-transparent py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-[#d91c1c] hover:text-[#d91c1c]"
                        >
                            {dict.login.backToWebsite}
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
