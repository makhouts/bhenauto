"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveCar } from "@/app/actions/cars";
import { Save, X, ImagePlus, Loader2 } from "lucide-react";

interface CarFormProps {
    initialData?: any;
}

export default function CarForm({ initialData }: CarFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Handle image upload state
    const [existingImages, setExistingImages] = useState<string[]>(
        initialData?.images?.map((img: any) => img.url) || []
    );
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            setNewFiles((prev) => [...prev, ...filesArray]);

            // Create previews
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviewUrls((prev) => [...prev, ...newPreviews]);
        }
    };

    const removeExistingImage = (index: number) => {
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
    };

    const removeNewFile = (index: number) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => {
            // Release memory
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const formData = new FormData(e.currentTarget);
            const carData = Object.fromEntries(formData.entries());

            let uploadedUrls: string[] = [];

            // Upload new files
            if (newFiles.length > 0) {
                const uploadFormData = new FormData();
                newFiles.forEach((file) => uploadFormData.append("files", file));

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                });

                if (!uploadRes.ok) throw new Error("Failed to upload images");

                const uploadData = await uploadRes.json();
                uploadedUrls = uploadData.urls;
            }

            // Combine all images
            const allImages = [...existingImages, ...uploadedUrls];

            // Automatically generate slug if not provided or new
            if (!carData.slug) {
                carData.slug = `${carData.year}-${carData.brand}-${carData.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            }

            const result = await saveCar({
                ...carData,
                id: initialData?.id,
                images: allImages,
                featured: initialData?.featured || false,
                sold: initialData?.sold || false,
            });

            if (result.error) {
                setError(result.error);
                setIsSubmitting(false);
            } else {
                router.push("/admin/cars");
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
            {error && (
                <div className="p-4 bg-red-50/50 border border-red-200 text-red-600 text-sm rounded-lg">
                    {error}
                </div>
            )}

            {/* Basic Info */}
            <div className="space-y-6">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">Voertuig Identiteit</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Interne Titel</label>
                        <input
                            type="text"
                            name="title"
                            defaultValue={initialData?.title}
                            required
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                            placeholder="e.g. 2023 Porsche 911 Carrera S"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">URL Slug (Optioneel)</label>
                        <input
                            type="text"
                            name="slug"
                            defaultValue={initialData?.slug}
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                            placeholder="Auto-generated if left blank"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Merk</label>
                        <input
                            type="text"
                            name="brand"
                            defaultValue={initialData?.brand}
                            required
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                            placeholder="e.g. Porsche"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Model</label>
                        <input
                            type="text"
                            name="model"
                            defaultValue={initialData?.model}
                            required
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                            placeholder="e.g. 911 Carrera S"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bouwjaar</label>
                        <input
                            type="number"
                            name="year"
                            defaultValue={initialData?.year}
                            required
                            min="1900"
                            max="2100"
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Specifications */}
            <div className="space-y-6 pt-4">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">Specificaties</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Prijs (€)</label>
                        <input
                            type="number"
                            name="price"
                            defaultValue={initialData?.price}
                            required
                            min="0"
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Kilometerstand</label>
                        <input
                            type="number"
                            name="mileage"
                            defaultValue={initialData?.mileage}
                            required
                            min="0"
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Vermogen</label>
                        <input
                            type="number"
                            name="horsepower"
                            defaultValue={initialData?.horsepower}
                            required
                            min="0"
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Kleur</label>
                        <input
                            type="text"
                            name="color"
                            defaultValue={initialData?.color}
                            required
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                            placeholder="e.g. Obsidian Black"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Brandstoftype</label>
                        <select
                            name="fuel_type"
                            defaultValue={initialData?.fuel_type || "Gasoline"}
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        >
                            <option value="Benzine">Benzine</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Elektrisch">Elektrisch</option>
                            <option value="Hybride">Hybride</option>
                            <option value="Plug-in Hybride">Plug-in Hybride</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Transmissie</label>
                        <select
                            name="transmission"
                            defaultValue={initialData?.transmission || "Automatisch"}
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        >
                            <option value="Automatisch">Automatisch</option>
                            <option value="Handgeschakeld">Handgeschakeld</option>
                            <option value="Dubbele Koppeling">Dubbele Koppeling</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-6 pt-4">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">Overzicht</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Voertuigbeschrijving</label>
                    <textarea
                        name="description"
                        defaultValue={initialData?.description}
                        required
                        rows={6}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] resize-y font-medium"
                        placeholder="Highlight the key features, history, and bespoke options..."
                    />
                </div>
            </div>

            {/* Image Gallery Manager */}
            <div className="space-y-6 pt-4">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">Media Galerij</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Existing Images */}
                    {existingImages.map((url, i) => (
                        <div key={url} className="relative aspect-[4/3] group rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <Image src={url} alt={`Existing image ${i}`} fill className="object-cover" />
                            <button
                                type="button"
                                onClick={() => removeExistingImage(i)}
                                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}

                    {/* New Previews */}
                    {previewUrls.map((url, i) => (
                        <div key={url} className="relative aspect-[4/3] group rounded-xl overflow-hidden border-2 border-[#d91c1c]/50 shadow-sm">
                            <Image src={url} alt={`New image preview ${i}`} fill className="object-cover" />
                            <div className="absolute inset-0 border-2 border-dashed border-transparent group-hover:border-[#d91c1c] pointer-events-none transition-colors rounded-xl"></div>
                            <button
                                type="button"
                                onClick={() => removeNewFile(i)}
                                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}

                    {/* Upload Button */}
                    <label className="aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-[#d91c1c] hover:bg-[#d91c1c]/5 cursor-pointer transition-colors rounded-xl text-slate-400 hover:text-[#d91c1c] relative">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                        />
                        <ImagePlus size={24} className="mb-2" />
                        <span className="text-xs uppercase tracking-widest font-bold">Foto's Toevoegen</span>
                    </label>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-200 flex justify-end gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-slate-300 rounded-lg text-slate-600 uppercase tracking-widest text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                    Annuleren
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-[#d91c1c] hover:bg-[#b91515] text-white rounded-lg uppercase tracking-widest text-xs font-bold transition-colors flex items-center shadow-md shadow-[#d91c1c]/20 disabled:opacity-70"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Opslaan...
                        </>
                    ) : (
                        <>
                            <Save size={16} className="mr-2" />
                            Voertuig Opslaan
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
