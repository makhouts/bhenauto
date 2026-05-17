"use client";

import { useState, useRef, useCallback } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";
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
import { getImageUrl } from "@/lib/image-url";
import { v4 as uuidv4 } from "uuid";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { tpl } from "@/lib/admin-i18n";

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
}: {
    id: string;
    url: string;
    index: number;
    onRemove: () => void;
    isNew?: boolean;
    aiScore?: number;
}) {
    const { dict } = useAdminI18n();
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
            <Image src={url.startsWith("blob:") ? url : getImageUrl(url)} alt={`Image ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 200px" className="object-cover" />

            {/* Cover badge */}
            {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-[#d91c1c] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded z-10">
                    {dict.carForm.cover}
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

// ─── Formatted Number Field ─────────────────────────────────────────
// Displays a space-separated number (e.g. "123 456") for readability,
// while submitting the raw numeric value via a hidden input.
// Supports an optional prefix (e.g. "€") or suffix (e.g. "km") shown inside the field.
function FormattedNumberField({
    label,
    name,
    defaultValue,
    required,
    prefix,
    suffix,
}: {
    label: string;
    name: string;
    defaultValue?: number;
    required?: boolean;
    prefix?: string;
    suffix?: string;
}) {
    const format = (n: number | undefined) =>
        n != null ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") : "";

    const [display, setDisplay] = useState(format(defaultValue));
    const [raw, setRaw] = useState(defaultValue ?? "");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, "");
        const num = digits === "" ? "" : parseInt(digits, 10);
        setRaw(num);
        setDisplay(digits === "" ? "" : digits.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0"));
    };

    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">{prefix}</span>
                )}
                <input
                    type="text"
                    inputMode="numeric"
                    value={display}
                    onChange={handleChange}
                    required={required}
                    className={`w-full bg-slate-50 border border-slate-300 text-slate-900 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium ${
                        prefix ? "pl-7 pr-4" : suffix ? "pl-4 pr-10" : "px-4"
                    }`}
                    placeholder="0"
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">{suffix}</span>
                )}
            </div>
            <input type="hidden" name={name} value={raw} />
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
    const { dict } = useAdminI18n();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [customMode, setCustomMode] = useState(() => Boolean(value && !options.includes(value)));
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const customInputRef = useRef<HTMLInputElement>(null);

    const closeDropdown = useCallback(() => {
        setOpen(false);
        setSearch("");
    }, []);
    useOutsideClick(ref, closeDropdown, open);

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
                    placeholder={tpl(dict.carForm.placeholderManualEntry, { label })}
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
                    ← {dict.carForm.backToList}
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
                            placeholder={dict.carForm.placeholderSearch}
                            className="w-full text-sm outline-none text-slate-800 placeholder:text-slate-400 bg-transparent"
                        />
                    </div>
                    <div className="overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400">{dict.carForm.placeholderNoResults}</div>
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
                            ✏️ {dict.carForm.placeholderOther}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main CarForm ───────────────────────────────────────────────────
type InitialCarImage = { url: string };
type CarFormInitialData = {
    id?: string;
    slug?: string;
    title?: string;
    brand?: string;
    model?: string;
    year?: number;
    mileage?: number;
    price?: number;
    horsepower?: number;
    fuel_type?: string;
    transmission?: string;
    color?: string;
    description?: string;
    featured?: boolean;
    sold?: boolean;
    carpass_url?: string | null;
    features?: string[];
    images?: InitialCarImage[];
};

interface CarFormProps {
    initialData?: CarFormInitialData;
}

export default function CarForm({ initialData }: CarFormProps) {
    const { dict, locale } = useAdminI18n();
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
        const existing: ImageItem[] = (initialData?.images || []).map((img, i: number) => ({
            id: `existing-${i}`,
            url: img.url,
            type: "existing" as const,
        }));
        return existing;
    };

    const [images, setImages] = useState<ImageItem[]>(buildInitial);
    // Stable car ID for R2 key prefix — use existing ID or generate a temporary one for new cars
    const [carId] = useState(() => initialData?.id || uuidv4());
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

    // Trigger AI analysis (only when user clicks the button)
    const triggerAiAnalysis = async () => {
        if (images.length === 0) {
            toast.error(dict.carForm.aiNeedPhotos);
            return;
        }

        setAiAnalyzing(true);
        setAiOrdered(false);
        setAiProgress(dict.carForm.aiPreparing);

        try {
            // Build FormData with both existing URLs and new file blobs
            const formData = new FormData();

            for (let i = 0; i < images.length; i++) {
                const item = images[i];
                if (item.url.startsWith("blob:") && item.file) {
                    // New file — send the raw file data
                    formData.append("entryTypes", "file");
                    formData.append("entryUrls", "");           // placeholder
                    formData.append("entryFiles", item.file);   // actual file
                } else {
                    // Existing R2 image — send the URL/key
                    formData.append("entryTypes", "url");
                    formData.append("entryUrls", item.url);
                    formData.append("entryFiles", "");          // placeholder
                }
            }

            setAiProgress(dict.carForm.aiAnalyzing);

            const aiRes = await fetch("/api/analyze-images", {
                method: "POST",
                body: formData,
            });

            if (!aiRes.ok) {
                const errData = await aiRes.json().catch(() => ({}));
                throw new Error(errData.error || dict.carForm.aiError);
            }

            setAiProgress(dict.carForm.aiOptimizing);

            const aiData = await aiRes.json();
            if (aiData.ordered && aiData.aiEnabled) {
                // Rebuild images in AI-scored order.
                // The API returns identifiers: R2 URLs for existing images,
                // or "__file_N__" placeholders for new file entries.
                setImages((prev) => {
                    // Build a map: identifier → original item
                    const idToItem = new Map<string, ImageItem>();
                    for (let i = 0; i < prev.length; i++) {
                        const item = prev[i];
                        if (item.url.startsWith("blob:")) {
                            idToItem.set(`__file_${i}__`, item);
                        } else {
                            idToItem.set(item.url, item);
                        }
                    }

                    const reordered: ImageItem[] = [];
                    for (const scored of aiData.ordered) {
                        const existing = idToItem.get(scored.url);
                        if (existing) {
                            reordered.push({ ...existing, aiScore: scored.score, aiAngle: scored.angle });
                            idToItem.delete(scored.url);
                        }
                    }
                    // Append any remaining items that weren't in the AI response
                    for (const remaining of idToItem.values()) {
                        reordered.push(remaining);
                    }
                    return reordered;
                });
                setAiOrdered(true);
                setAiStale(false); // AI just ran, results are fresh
                toast.success(dict.carForm.aiSuccess);
            } else {
                toast.info(dict.carForm.aiUnavailable);
            }
        } catch (err: unknown) {
            console.error("AI analysis error:", err);
            toast.error(err instanceof Error ? err.message : dict.carForm.aiError);
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

            // NOTE: features is managed separately as a string[] array in state,
            // do NOT add it to carData (FormData only supports strings).
            // It will be passed directly as an array to saveCar() below.

            // Upload any new blob images to R2 now (only happens at save time)
            const newFiles = images
                .filter((i) => i.type === "new" && i.file && i.url.startsWith("blob:"))
                .map((i) => i.file!);

            let uploadedKeys: string[] = [];

            // Upload any remaining new files that weren't uploaded during AI analysis
            if (newFiles.length > 0) {
                setIsUploading(true);
                const uploadFormData = new FormData();
                uploadFormData.append("carId", carId);
                newFiles.forEach((file) => uploadFormData.append("files", file));

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                });

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json().catch(() => ({}));
                    throw new Error(errData.error || dict.carForm.uploadError);
                }

                const uploadData = await uploadRes.json();
                uploadedKeys = uploadData.keys;
                setIsUploading(false);
            }

            // Build ordered list matching the current image order
            let uploadIndex = 0;
            const allImages = images.map((item) => {
                if (item.type === "existing" || !item.url.startsWith("blob:")) {
                    return item.url; // Already an R2 key
                }
                return uploadedKeys[uploadIndex++]; // Newly uploaded R2 key
            });

            // Auto-generate slug from brand + model + year + unique suffix
            const uniqueSuffix = Math.random().toString(36).substring(2, 6);
            const slug = initialData?.slug || `${carData.year}-${carData.brand}-${carData.model}-${uniqueSuffix}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const result = await saveCar({
                ...carData,
                slug,
                id: initialData?.id,
                features,           // Pass the actual string[] array, not JSON string
                images: allImages,
                featured: initialData?.featured || false,
                sold: initialData?.sold || false,
            });

            if (result.error) {
                toast.error(result.error);
                setIsSubmitting(false);
            } else {
                toast.success(initialData?.id ? dict.carForm.saveEdit : dict.carForm.saveNew);
                router.push("/admin/cars");
                router.refresh();
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : dict.carForm.unexpectedError);
            setIsSubmitting(false);
            setIsUploading(false);
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
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">{dict.carForm.sectionIdentity}</h3>

                {/* Row 1: brand + model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SearchableDropdown
                        label={dict.carForm.brand}
                        name="brand"
                        options={BRAND_NAMES}
                        value={brand}
                        onChange={(val) => {
                            setBrand(val);
                            setModel(""); // Reset model when brand changes
                            updateTitleFromBrandModel(val, "");
                        }}
                        placeholder={dict.carForm.placeholderBrand}
                        required
                    />

                    <SearchableDropdown
                        label={dict.carForm.model}
                        name="model"
                        options={availableModels}
                        value={model}
                        onChange={(val) => {
                            setModel(val);
                            updateTitleFromBrandModel(brand, val);
                        }}
                        placeholder={brand ? dict.carForm.placeholderModel : dict.carForm.placeholderBrandFirst}
                        required
                        disabled={!brand}
                    />
                </div>

                {/* Row 2: year + internal title */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.year}</label>
                        <select
                            name="year"
                            defaultValue={initialData?.year || new Date().getFullYear()}
                            required
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        >
                            {Array.from({ length: new Date().getFullYear() - 1960 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.title}</label>
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
                            placeholder={dict.carForm.autoTitlePlaceholder}
                        />
                        {!titleManuallyEdited && brand && (
                            <p className="text-xs text-slate-400 mt-1">{dict.carForm.autoTitleHint}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6 pt-4">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">{dict.carForm.sectionSpecs}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FormattedNumberField
                        label={dict.carForm.price}
                        name="price"
                        defaultValue={initialData?.price}
                        required
                        prefix="€"
                    />
                    <FormattedNumberField
                        label={dict.carForm.mileage}
                        name="mileage"
                        defaultValue={initialData?.mileage}
                        required
                        suffix="km"
                    />
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.horsepower}</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="horsepower"
                                defaultValue={initialData?.horsepower}
                                required
                                min="0"
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 pl-4 pr-10 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">{dict.carForm.horsepowerUnit}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.color}</label>
                        <select
                            name="color"
                            defaultValue={initialData?.color || ""}
                            required
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        >
                            <option value="" disabled>{dict.carForm.placeholderColor}</option>
                            <option value="Zwart">{locale === "fr" ? "Noir" : "Zwart"}</option>
                            <option value="Wit">{locale === "fr" ? "Blanc" : "Wit"}</option>
                            <option value="Grijs">{locale === "fr" ? "Gris" : "Grijs"}</option>
                            <option value="Zilver">{locale === "fr" ? "Argent" : "Zilver"}</option>
                            <option value="Blauw">{locale === "fr" ? "Bleu" : "Blauw"}</option>
                            <option value="Rood">{locale === "fr" ? "Rouge" : "Rood"}</option>
                            <option value="Groen">{locale === "fr" ? "Vert" : "Groen"}</option>
                            <option value="Oranje">{locale === "fr" ? "Orange" : "Oranje"}</option>
                            <option value="Geel">{locale === "fr" ? "Jaune" : "Geel"}</option>
                            <option value="Bruin">{locale === "fr" ? "Brun" : "Bruin"}</option>
                            <option value="Beige">Beige</option>
                            <option value="Bordeaux">Bordeaux</option>
                            <option value="Paars">{locale === "fr" ? "Violet" : "Paars"}</option>
                            <option value="Goud">{locale === "fr" ? "Or" : "Goud"}</option>
                            <option value="Brons">{locale === "fr" ? "Bronze" : "Brons"}</option>
                            <option value="Champagne">Champagne</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.fuel}</label>
                        <select
                            name="fuel_type"
                            defaultValue={initialData?.fuel_type || "Benzine"}
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        >
                            <option value="Benzine">{locale === "fr" ? "Essence" : "Benzine"}</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Elektrisch">{locale === "fr" ? "Électrique" : "Elektrisch"}</option>
                            <option value="Hybride">Hybride</option>
                            <option value="Plug-in Hybride">{locale === "fr" ? "Hybride rechargeable" : "Plug-in Hybride"}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.transmission}</label>
                        <select
                            name="transmission"
                            defaultValue={initialData?.transmission || "Automatisch"}
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        >
                            <option value="Automatisch">{locale === "fr" ? "Automatique" : "Automatisch"}</option>
                            <option value="Handgeschakeld">{locale === "fr" ? "Manuelle" : "Handgeschakeld"}</option>
                            <option value="Dubbele Koppeling">{locale === "fr" ? "Double embrayage" : "Dubbele Koppeling"}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-6 pt-4">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">{dict.carForm.sectionDescription}</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.description}</label>
                    <textarea
                        name="description"
                        defaultValue={initialData?.description}
                        required
                        rows={6}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] resize-y font-medium"
                        placeholder={dict.carForm.placeholderDescription}
                    />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">{dict.carForm.sectionDocuments}</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                        {dict.carForm.carPass} <span className="text-slate-300 normal-case font-normal">({dict.carForm.optional})</span>
                    </label>
                    <input
                        type="url"
                        name="carpass_url"
                        defaultValue={initialData?.carpass_url || ""}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium"
                        placeholder="https://www.carpass.be/..."
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                        {dict.carForm.carPassHint}
                    </p>
                </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-slate-100">
                <h3 className="text-xl font-headings text-slate-900 font-bold border-b border-slate-200 pb-2">{dict.carForm.sectionFeatures}</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.addFeatureLabel}</label>
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
                            placeholder={dict.carForm.placeholderFeatureInput}
                        />
                        <button
                            type="button"
                            onClick={addFeature}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-lg font-bold text-sm transition-colors"
                        >
                            {dict.carForm.addFeatureButton}
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
                            {dict.carForm.noFeatures}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="text-xl font-headings text-slate-900 font-bold">{dict.carForm.sectionGallery}</h3>
                    <div className="flex items-center gap-3">
                        {aiOrdered && !aiAnalyzing && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                                <Sparkles size={11} />
                                {dict.carForm.aiOrderedBadge}
                            </span>
                        )}
                        <p className="text-xs text-slate-400 font-medium">{dict.carForm.dragHint}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200 rounded-xl px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${
                            aiEnabled ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                        }`}>
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">{dict.carForm.aiOptimizationTitle}</p>
                            <p className="text-xs text-slate-400">{dict.carForm.aiOptimizationDescription}</p>
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
                                {aiOrdered && aiStale ? dict.carForm.aiOptimizeAgain : dict.carForm.aiOptimize}
                            </button>
                        )}
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
                                    />
                                ))}

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
                                    <span className="text-xs uppercase tracking-widest font-bold">{dict.carForm.photos}</span>
                                </label>
                            </div>
                        </SortableContext>
                    </DndContext>

                    {aiAnalyzing && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />

                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -inset-[100%] animate-shimmer bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent" style={{ transform: 'rotate(-12deg)' }} />
                            </div>

                            <div className="relative flex flex-col items-center gap-4 py-6 px-8">
                                <div className="relative">
                                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" />
                                    <div className="relative p-4 bg-white rounded-2xl shadow-lg shadow-indigo-200/50 border border-indigo-100">
                                        <Sparkles size={28} className="text-indigo-600 animate-pulse" />
                                    </div>
                                </div>

                                <div className="text-center space-y-1.5">
                                    <h4 className="text-base font-bold text-slate-800">{dict.carForm.aiOrder}</h4>
                                    <p className="text-sm text-slate-500">{aiProgress || dict.common.loading}</p>
                                </div>

                                <div className="w-56 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full animate-ai-progress" style={{ width: '60%' }} />
                                </div>

                                <div className="flex items-center gap-5 mt-1">
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                        aiProgress.includes('upload') ? 'text-indigo-600' : aiProgress.includes('analys') || aiProgress.includes('optim') ? 'text-green-500' : 'text-slate-300'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full ${
                                            aiProgress.includes('upload') ? 'bg-indigo-500 animate-pulse' : aiProgress.includes('analys') || aiProgress.includes('optim') ? 'bg-green-500' : 'bg-slate-300'
                                        }`} />
                                        {dict.carForm.aiStepUpload}
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                        aiProgress.includes('analys') ? 'text-indigo-600' : aiProgress.includes('optim') ? 'text-green-500' : 'text-slate-300'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full ${
                                            aiProgress.includes('analys') ? 'bg-indigo-500 animate-pulse' : aiProgress.includes('optim') ? 'bg-green-500' : 'bg-slate-300'
                                        }`} />
                                        {dict.carForm.aiStepAnalyze}
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                        aiProgress.includes('optim') ? 'text-indigo-600' : 'text-slate-300'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full ${
                                            aiProgress.includes('optim') ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'
                                        }`} />
                                        {dict.carForm.aiStepSort}
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
                    {dict.common.cancel}
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || aiAnalyzing || isUploading}
                    className="px-8 py-3 bg-[#d91c1c] hover:bg-[#b91515] text-white rounded-lg uppercase tracking-widest text-xs font-bold transition-colors flex items-center shadow-md shadow-[#d91c1c]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            {dict.common.loading}
                        </>
                    ) : (
                        <>
                            <Save size={16} className="mr-2" />
                            {initialData?.id ? dict.carForm.saveButtonEdit : dict.carForm.saveButtonNew}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
