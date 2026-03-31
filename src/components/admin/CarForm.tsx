"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveCar } from "@/app/actions/cars";
import { Save, X, ImagePlus, Loader2, GripVertical, ChevronDown, Search, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { BRAND_NAMES, getModelsForBrand } from "@/lib/carBrands";

const COMMON_FEATURES = [
    'Panoramisch Dak',
    '360° Camera',
    'Stoelverwarming',
    'Spoorassistent',
    'Apple CarPlay',
    'Android Auto',
    'Matrix LED Koplampen',
    'Keyless Entry',
    'Adaptieve Cruisecontrol',
    'Dodehoekdetectie',
    'Lederen Bekleding',
    'Sfeerverlichting',
    'Luchtvering'
];

// ─── Sortable Image Item ────────────────────────────────────────────
function SortableImage({
    id,
    url,
    index,
    onRemove,
    isNew,
    aiScore,
    aiAngle,
}: {
    id: string;
    url: string;
    index: number;
    onRemove: () => void;
    isNew?: boolean;
    aiScore?: number;
    aiAngle?: string;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative aspect-[4/3] group rounded-xl overflow-hidden border-2 ${
                index === 0 ? "border-[#d91c1c] ring-2 ring-[#d91c1c]/20" : isNew ? "border-[#d91c1c]/40" : "border-slate-200"
            } shadow-sm select-none`}
        >
            <Image src={url} alt={`Image ${index + 1}`} fill className="object-cover" />

            {/* Cover badge */}
            {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-[#d91c1c] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded z-10">
                    Cover
                </div>
            )}

            {/* AI Score badge */}
            {aiScore !== undefined && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm z-10 flex items-center gap-1">
                    <Sparkles size={9} className="text-yellow-400" />
                    {aiScore}
                </div>
            )}

            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 p-1.5 bg-black/50 text-white rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10"
            >
                <GripVertical size={14} />
            </div>

            {/* Remove button */}
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// ─── Searchable Dropdown with free-text fallback ────────────────────
function SearchableDropdown({
    label,
    name,
    options,
    value,
    onChange,
    placeholder,
    required,
    disabled,
}: {
    label: string;
    name: string;
    options: string[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    required?: boolean;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [customMode, setCustomMode] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const customInputRef = useRef<HTMLInputElement>(null);

    // Check if current value is custom (not in the options list)
    useEffect(() => {
        if (value && !options.includes(value)) {
            setCustomMode(true);
        }
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = options.filter((o) =>
        o.toLowerCase().includes(search.toLowerCase())
    );

    // Custom/free-text mode
    if (customMode) {
        return (
            <div ref={ref}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    {label}
                </label>
                <input type="hidden" name={name} value={value} />
                <input
                    ref={customInputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`${label} handmatig invoeren...`}
                    required={required}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                />
                <button
                    type="button"
                    onClick={() => {
                        setCustomMode(false);
                        onChange("");
                    }}
                    className="text-xs text-[#d91c1c] font-bold mt-1.5 hover:underline"
                >
                    ← Terug naar lijst
                </button>
            </div>
        );
    }

    return (
        <div ref={ref} className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                {label}
            </label>
            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={value} />
            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    setOpen(!open);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`w-full bg-slate-50 border border-slate-300 text-left px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium flex items-center justify-between transition-colors ${
                    value ? "text-slate-900" : "text-slate-400"
                } disabled:opacity-50`}
            >
                <span className="truncate">{value || placeholder}</span>
                <ChevronDown size={16} className={`shrink-0 ml-2 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden max-h-64 flex flex-col">
                    {/* Search input */}
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Zoeken..."
                            className="w-full text-sm outline-none text-slate-800 placeholder:text-slate-400 bg-transparent"
                        />
                    </div>
                    <div className="overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400">Geen resultaten</div>
                        ) : (
                            filtered.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        onChange(option);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                                        option === value
                                            ? "bg-[#d91c1c]/10 text-[#d91c1c] font-bold"
                                            : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    {option}
                                </button>
                            ))
                        )}

                        {/* Free-text fallback */}
                        <button
                            type="button"
                            onClick={() => {
                                setCustomMode(true);
                                setOpen(false);
                                setSearch("");
                                onChange("");
                                setTimeout(() => customInputRef.current?.focus(), 50);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-[#d91c1c] hover:bg-slate-50 transition-colors border-t border-slate-100"
                        >
                            ✏️ Anders (handmatig invoeren)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main CarForm ───────────────────────────────────────────────────
interface CarFormProps {
    initialData?: any;
}

export default function CarForm({ initialData }: CarFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Brand/Model state
    const [brand, setBrand] = useState(initialData?.brand || "");
    const [model, setModel] = useState(initialData?.model || "");
    const [title, setTitle] = useState(initialData?.title || "");
    const availableModels = getModelsForBrand(brand);

    // Features state
    const [features, setFeatures] = useState<string[]>(initialData?.features || []);
    const [featureInput, setFeatureInput] = useState("");

    const addFeature = () => {
        const val = featureInput.trim();
        if (val && !features.includes(val)) {
            setFeatures([...features, val]);
        }
        setFeatureInput("");
    };

    const removeFeature = (tag: string) => {
        setFeatures(features.filter(f => f !== tag));
    };

    // Auto-prefill title when brand or model changes (only if title hasn't been manually edited)
    const [titleManuallyEdited, setTitleManuallyEdited] = useState(!!initialData?.title);

    const updateTitleFromBrandModel = (newBrand: string, newModel: string) => {
        if (!titleManuallyEdited) {
            const parts = [newBrand, newModel].filter(Boolean);
            setTitle(parts.join(" "));
        }
    };

    // Handle image state — unified list with unique IDs
    type ImageItem = { id: string; url: string; type: "existing" | "new"; file?: File; aiScore?: number; aiAngle?: string };

    const buildInitial = (): ImageItem[] => {
        const existing: ImageItem[] = (initialData?.images || []).map((img: any, i: number) => ({
            id: `existing-${i}`,
            url: img.url,
            type: "existing" as const,
        }));
        return existing;
    };

    const [images, setImages] = useState<ImageItem[]>(buildInitial);
    const [aiEnabled, setAiEnabled] = useState(false);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiOrdered, setAiOrdered] = useState(false);
    const [aiStale, setAiStale] = useState(false); // true when images changed since last AI run
    const [aiProgress, setAiProgress] = useState("");
    const [isUploading, setIsUploading] = useState(false);


    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setAiStale(true); // User manually reordered, AI results are stale
            setImages((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const filesArray = Array.from(e.target.files);
        e.target.value = "";

        // Create local blob previews
        const previewItems: ImageItem[] = filesArray.map((file, i) => ({
            id: `new-${Date.now()}-${i}`,
            url: URL.createObjectURL(file),
            type: "new" as const,
            file,
        }));
        setImages((prev) => [...prev, ...previewItems]);
        setAiStale(true); // New images added, AI results are stale
    };

    // Upload blob images to Cloudinary and return their URLs
    const uploadBlobImages = async (currentImages: ImageItem[]): Promise<ImageItem[]> => {
        const blobItems = currentImages.filter((i) => i.url.startsWith("blob:") && i.file);
        if (blobItems.length === 0) return currentImages;

        setIsUploading(true);
        try {
            const uploadFormData = new FormData();
            blobItems.forEach((item) => uploadFormData.append("files", item.file!));

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: uploadFormData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");

            const uploadData = await uploadRes.json();
            const cloudinaryUrls: string[] = uploadData.urls;

            let uploadIdx = 0;
            const updated = currentImages.map((item) => {
                if (item.url.startsWith("blob:") && item.file) {
                    URL.revokeObjectURL(item.url);
                    return { ...item, url: cloudinaryUrls[uploadIdx++], type: "existing" as const, file: undefined };
                }
                return item;
            });
            setImages(updated);
            return updated;
        } finally {
            setIsUploading(false);
        }
    };

    // Trigger AI analysis (only when user clicks the button)
    const triggerAiAnalysis = async () => {
        if (images.length === 0) {
            toast.error("Voeg eerst foto's toe voordat je AI-analyse start.");
            return;
        }

        setAiAnalyzing(true);
        setAiOrdered(false);
        setAiProgress("Foto's uploaden naar cloud...");

        try {
            // First ensure all blob images are uploaded to Cloudinary
            const updatedImages = await uploadBlobImages(images);

            const allUrls = updatedImages.map((i) => i.url);

            setAiProgress("AI analyseert elke foto...");

            const aiRes = await fetch("/api/analyze-images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrls: allUrls }),
            });

            if (!aiRes.ok) {
                const errData = await aiRes.json().catch(() => ({}));
                throw new Error(errData.error || "AI analyse mislukt");
            }

            setAiProgress("Volgorde optimaliseren...");

            const aiData = await aiRes.json();
            if (aiData.ordered && aiData.aiEnabled) {
                // Rebuild images in AI-scored order
                setImages((prev) => {
                    const urlToItem = new Map(prev.map((item) => [item.url, item]));
                    const reordered: ImageItem[] = [];
                    for (const scored of aiData.ordered) {
                        const existing = urlToItem.get(scored.url);
                        if (existing) {
                            reordered.push({ ...existing, aiScore: scored.score, aiAngle: scored.angle });
                            urlToItem.delete(scored.url);
                        }
                    }
                    for (const remaining of urlToItem.values()) {
                        reordered.push(remaining);
                    }
                    return reordered;
                });
                setAiOrdered(true);
                setAiStale(false); // AI just ran, results are fresh
                toast.success("AI heeft de foto's gerangschikt!");
            } else {
                toast.info("AI-analyse is niet beschikbaar. Controleer je API-sleutel.");
            }
        } catch (err: any) {
            console.error("AI analysis error:", err);
            toast.error(err.message || "AI-analyse is mislukt.");
        } finally {
            setAiAnalyzing(false);
            setAiProgress("");
        }
    };

    const removeImage = (id: string) => {
        setImages((prev) => {
            const item = prev.find((i) => i.id === id);
            if (item?.type === "new" && item.url.startsWith("blob:")) {
                URL.revokeObjectURL(item.url);
            }
            return prev.filter((i) => i.id !== id);
        });
        setAiStale(true); // Image removed, AI results are stale
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const formData = new FormData(e.currentTarget);
            const carData = Object.fromEntries(formData.entries());
            
            // Add the features array as JSON string
            if (features.length > 0) {
                carData.features = JSON.stringify(features);
            }

            // All images should already be uploaded to Cloudinary at this point
            // (uploaded during handleFileChange for AI analysis)
            const newFiles = images
                .filter((i) => i.type === "new" && i.file && i.url.startsWith("blob:"))
                .map((i) => i.file!);

            let uploadedUrls: string[] = [];

            // Upload any remaining new files that weren't uploaded during AI analysis
            if (newFiles.length > 0) {
                const uploadFormData = new FormData();
                newFiles.forEach((file) => uploadFormData.append("files", file));

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                });

                if (!uploadRes.ok) throw new Error("Uploaden van afbeeldingen mislukt");

                const uploadData = await uploadRes.json();
                uploadedUrls = uploadData.urls;
            }

            // Build ordered list matching the current image order
            let uploadIndex = 0;
            const allImages = images.map((item) => {
                if (item.type === "existing" || !item.url.startsWith("blob:")) {
                    return item.url; // Already on Cloudinary, reuse URL
                }
                return uploadedUrls[uploadIndex++]; // Newly uploaded
            });

            // Auto-generate slug from brand + model + year + unique suffix
            const uniqueSuffix = Math.random().toString(36).substring(2, 6);
            const slug = initialData?.slug || `${carData.year}-${carData.brand}-${carData.model}-${uniqueSuffix}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const result = await saveCar({
                ...carData,
                slug,
                id: initialData?.id,
                images: allImages,
                featured: initialData?.featured || false,
                sold: initialData?.sold || false,
            });

            if (result.error) {
                toast.error(result.error);
                setIsSubmitting(false);
            } else {
                toast.success(initialData?.id ? "Voertuig succesvol bijgewerkt!" : "Voertuig succesvol toegevoegd!");
                router.push("/admin/cars");
                router.refresh();
            }
        } catch (err: any) {
            toast.error(err.message || "Er is een onverwachte fout opgetreden.");
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
            {error && (
                <div className="p-4 bg-red-50/50 border border-red-200 text-red-600 text-sm rounded-lg">
                    {error}
                </div>
            )}

            {/* Vehicle Identity */}
            <div className="space-y-6">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">Voertuig Identiteit</h3>

                {/* Row 1: Merk + Model + Bouwjaar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Brand Dropdown */}
                    <SearchableDropdown
                        label="Merk"
                        name="brand"
                        options={BRAND_NAMES}
                        value={brand}
                        onChange={(val) => {
                            setBrand(val);
                            setModel(""); // Reset model when brand changes
                            updateTitleFromBrandModel(val, "");
                        }}
                        placeholder="Selecteer merk..."
                        required
                    />

                    {/* Model Dropdown — filtered by selected brand */}
                    <SearchableDropdown
                        label="Model"
                        name="model"
                        options={availableModels}
                        value={model}
                        onChange={(val) => {
                            setModel(val);
                            updateTitleFromBrandModel(brand, val);
                        }}
                        placeholder={brand ? "Selecteer model..." : "Kies eerst een merk"}
                        required
                        disabled={!brand}
                    />

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

                {/* Row 2: Interne Titel (auto-prefilled) */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Interne Titel</label>
                    <input
                        type="text"
                        name="title"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            setTitleManuallyEdited(true);
                        }}
                        required
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        placeholder="Wordt automatisch ingevuld vanuit merk + model"
                    />
                    {!titleManuallyEdited && brand && (
                        <p className="text-xs text-slate-400 mt-1">Automatisch ingevuld. Pas aan indien gewenst.</p>
                    )}
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
                            defaultValue={initialData?.fuel_type || "Benzine"}
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

            {/* Carpass URL */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">Documenten</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Carpass URL <span className="text-slate-300 normal-case font-normal">(optioneel)</span>
                    </label>
                    <input
                        type="url"
                        name="carpass_url"
                        defaultValue={initialData?.carpass_url || ""}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        placeholder="https://www.carpass.be/..."
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                        Vul de Carpass URL in — er verschijnt dan een Carpass-knop op de voertuigpagina.
                    </p>
                </div>
            </div>

            {/* Options & Features (Tags) */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">Kenmerken & Opties</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Voeg opties of accessoires toe</label>
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="text"
                            value={featureInput}
                            onChange={(e) => setFeatureInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                    e.preventDefault();
                                    addFeature();
                                }
                            }}
                            className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                            placeholder="Typ optie (bijv. Panoramisch Dak) en druk op Enter..."
                        />
                        <button
                            type="button"
                            onClick={addFeature}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-lg font-bold text-sm transition-colors"
                        >
                            Toevoegen
                        </button>
                    </div>
                    
                    {/* Common Features Preview */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {COMMON_FEATURES.filter(f => !features.includes(f)).map(f => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => setFeatures([...features, f])}
                                className="text-[11px] font-medium bg-white border border-slate-200 text-slate-500 hover:border-[#d91c1c] hover:bg-red-50 hover:text-[#d91c1c] px-2.5 py-1.5 rounded-md transition-colors shadow-sm"
                            >
                                + {f}
                            </button>
                        ))}
                    </div>

                    {/* Tag Cloud */}
                    {features.length > 0 ? (
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            {features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg shadow-sm font-medium text-sm group">
                                    <span>{feature}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFeature(feature)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50 rounded-xl text-slate-400 text-sm italic text-center border border-slate-200 border-dashed">
                            Nog geen opties toegevoegd.
                        </div>
                    )}
                </div>
            </div>

            {/* Image Gallery Manager with Drag & Drop */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="text-xl font-headings text-slate-900 font-bold">Media Galerij</h3>
                    <div className="flex items-center gap-3">
                        {aiOrdered && !aiAnalyzing && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                                <Sparkles size={11} />
                                AI Gerangschikt
                            </span>
                        )}
                        <p className="text-xs text-slate-400 font-medium">Sleep om de volgorde te wijzigen. Eerste foto = cover.</p>
                    </div>
                </div>

                {/* AI Toggle + Optimize Button */}
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200 rounded-xl px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${
                            aiEnabled ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                        }`}>
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">AI Foto Optimalisatie</p>
                            <p className="text-xs text-slate-400">Laat AI automatisch de beste coverfoto kiezen en de volgorde bepalen</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {aiEnabled && images.length > 0 && !aiAnalyzing && (!aiOrdered || aiStale) && (
                            <button
                                type="button"
                                onClick={triggerAiAnalysis}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200"
                            >
                                <Zap size={13} />
                                {aiOrdered && aiStale ? "Opnieuw" : "Optimaliseer"}
                            </button>
                        )}
                        {/* Toggle Switch */}
                        <button
                            type="button"
                            onClick={() => {
                                setAiEnabled(!aiEnabled);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                aiEnabled ? "bg-indigo-600" : "bg-slate-300"
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                                    aiEnabled ? "translate-x-6" : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {images.map((item, index) => (
                                    <SortableImage
                                        key={item.id}
                                        id={item.id}
                                        url={item.url}
                                        index={index}
                                        onRemove={() => removeImage(item.id)}
                                        isNew={item.type === "new"}
                                        aiScore={item.aiScore}
                                        aiAngle={item.aiAngle}
                                    />
                                ))}

                                {/* Upload Button */}
                                <label className={`aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors relative ${
                                    aiAnalyzing || isUploading
                                        ? "border-amber-300 bg-amber-50 text-amber-400 cursor-wait"
                                        : "border-slate-300 hover:border-[#d91c1c] hover:bg-[#d91c1c]/5 cursor-pointer text-slate-400 hover:text-[#d91c1c]"
                                }`}>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        disabled={isSubmitting || aiAnalyzing || isUploading}
                                    />
                                    <ImagePlus size={24} className="mb-2" />
                                    <span className="text-xs uppercase tracking-widest font-bold">Foto&apos;s Toevoegen</span>
                                </label>
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* AI Analysis Overlay — on top of images */}
                    {aiAnalyzing && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl overflow-hidden">
                            {/* Frosted glass backdrop */}
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />

                            {/* Shimmer effect */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -inset-[100%] animate-shimmer bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent" style={{ transform: 'rotate(-12deg)' }} />
                            </div>

                            <div className="relative flex flex-col items-center gap-4 py-6 px-8">
                                {/* Pulsing sparkles icon */}
                                <div className="relative">
                                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" />
                                    <div className="relative p-4 bg-white rounded-2xl shadow-lg shadow-indigo-200/50 border border-indigo-100">
                                        <Sparkles size={28} className="text-indigo-600 animate-pulse" />
                                    </div>
                                </div>

                                <div className="text-center space-y-1.5">
                                    <h4 className="text-base font-bold text-slate-800">AI Analyse Bezig</h4>
                                    <p className="text-sm text-slate-500">{aiProgress || 'Bezig met verwerken...'}</p>
                                </div>

                                {/* Animated progress bar */}
                                <div className="w-56 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full animate-ai-progress" style={{ width: '60%' }} />
                                </div>

                                {/* Step indicators */}
                                <div className="flex items-center gap-5 mt-1">
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                        aiProgress.includes('upload') ? 'text-indigo-600' : aiProgress.includes('analys') || aiProgress.includes('optim') ? 'text-green-500' : 'text-slate-300'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full ${
                                            aiProgress.includes('upload') ? 'bg-indigo-500 animate-pulse' : aiProgress.includes('analys') || aiProgress.includes('optim') ? 'bg-green-500' : 'bg-slate-300'
                                        }`} />
                                        Upload
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                        aiProgress.includes('analys') ? 'text-indigo-600' : aiProgress.includes('optim') ? 'text-green-500' : 'text-slate-300'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full ${
                                            aiProgress.includes('analys') ? 'bg-indigo-500 animate-pulse' : aiProgress.includes('optim') ? 'bg-green-500' : 'bg-slate-300'
                                        }`} />
                                        Analyse
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                        aiProgress.includes('optim') ? 'text-indigo-600' : 'text-slate-300'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full ${
                                            aiProgress.includes('optim') ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'
                                        }`} />
                                        Rangschikken
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
                    disabled={isSubmitting || aiAnalyzing || isUploading}
                    className="px-8 py-3 bg-[#d91c1c] hover:bg-[#b91515] text-white rounded-lg uppercase tracking-widest text-xs font-bold transition-colors flex items-center shadow-md shadow-[#d91c1c]/20 disabled:opacity-70 disabled:cursor-not-allowed"
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
