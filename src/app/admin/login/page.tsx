"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";

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
            router.refresh(); // Ensure layout respects the new cookie state
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left side: Premium Image */}
            <div className="hidden lg:flex w-1/2 relative">
                <Image
                    src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2070&auto=format&fit=crop"
                    alt="bhenauto Headquarters"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-12 text-center">
                    <div>
                        <h2 className="text-3xl font-headings text-white mb-4">bhenauto</h2>
                        <p className="text-gray-300 font-light max-w-md mx-auto">
                            Secure Operations Portal for authorized personnel.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#cc0000]/5 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>

                <div className="w-full max-w-sm">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-surface-dark flex items-center justify-center border border-white/10 shadow-2xl">
                            <Lock size={28} className="text-gold" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-headings text-white text-center mb-2">Access Portal</h1>
                    <p className="text-gray-500 text-center mb-10 text-sm">Sign in with your administrative credentials.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500 text-red-500 text-sm text-center animate-fade-in shadow-xl backdrop-blur-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Access Code</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                disabled={isSubmitting}
                                className="w-full bg-surface-dark border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors disabled:opacity-50 tracking-widest"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-gray-600 mt-2 italic flex justify-between">
                                <span>Demo Hint:</span>
                                <span className="text-gray-400">admin123</span>
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#cc0000] hover:bg-[#aa0000] text-white py-4 font-semibold uppercase tracking-widest text-sm flex justify-center items-center transition-all duration-300 shadow-lg disabled:opacity-70 group"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Enter Secure Area
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <a href="/" className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest block py-2">
                            Return to Public Site
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
