"use client";

import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveCar } from "@/app/actions/cars";
import { Save, X, ImagePlus, Loader2, GripVertical, ChevronDown, ChevronLeft, ChevronRight, Search, Sparkles, Zap, Plus, Calendar, Check, CircleAlert, CarFront, Gauge, Send, BadgeEuro, FileText, ListChecks, Images, Paperclip, Settings2, type LucideIcon } from "lucide-react";
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
import type { AutoScoutFormOptions, AutoScoutSelectOption } from "@/lib/autoscout24/form-options.types";
import {
    getAutoScoutValidationMessage,
    groupAutoScoutValidationIssues,
    validateAutoScoutListingValues,
    type AutoScoutValidationField,
    type AutoScoutValidationIssue,
} from "@/lib/autoscout24/listing-validation";

const KW_TO_HP = 1.359621617;
const HP_TO_KW = 0.73549875;
const COMMON_EQUIPMENT_CODES = [
    "5",   // Air conditioning
    "30",  // Automatic climate control
    "23",  // Navigation system
    "122", // Bluetooth
    "221", // Apple CarPlay
    "222", // Android Auto
    "38",  // Cruise control
    "133", // Adaptive Cruise Control
    "130", // Parking camera
    "187", // 360 camera
    "128", // Parking sensors front
    "129", // Parking sensors rear
    "34",  // Seat heating
    "50",  // Panorama roof
    "239", // Full LED headlights
    "15",  // Alloy wheels
    "153", // Keyless entry
    "125", // Isofix
    "157", // Lane assist
    "158", // Blind spot monitor
    "219", // Ambient lighting
    "114", // Multifunction steering wheel
    "13",  // Power windows
    "20",  // Trailer hitch
];

const EMPTY_AUTOSCOUT_OPTIONS: AutoScoutFormOptions = {
    makes: [],
    references: {
        availabilityTypes: [],
        bodyColors: [],
        bodyTypes: [],
        drivetrains: [],
        emissionClasses: [],
        equipment: [],
        fuelCategories: [],
        fuelTypes: [],
        offerTypes: [],
        transmissions: [],
        upholsteryColors: [],
        upholsteryTypes: [],
        vehicleTypes: [],
    },
};

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-red-600">
            <CircleAlert size={13} className="mt-0.5 shrink-0" />
            <span>{message}</span>
        </p>
    );
}

function notifyClosestFormChanged(element: HTMLElement) {
    const form = element.closest("form");
    window.setTimeout(() => {
        form?.dispatchEvent(new Event("change", { bubbles: true }));
    }, 0);
}

const SECTION_CARD_CLASS = "scroll-mt-24 rounded-lg border border-slate-200 bg-white shadow-sm";
type SectionId =
    | "identity"
    | "specifications"
    | "publication"
    | "commercial"
    | "description"
    | "documents"
    | "features"
    | "gallery";

type SectionCompletionMap = Record<SectionId, boolean>;
const SECTION_IDS: SectionId[] = [
    "identity",
    "specifications",
    "publication",
    "commercial",
    "description",
    "documents",
    "features",
    "gallery",
];

function sectionCardClass(active?: boolean, completed?: boolean) {
    if (active) {
        return `${SECTION_CARD_CLASS} border-[#d91c1c]/30 bg-red-50/30 shadow-md shadow-red-100/70 ring-1 ring-[#d91c1c]/10`;
    }

    if (completed) {
        return `${SECTION_CARD_CLASS} border-emerald-200/80 shadow-sm shadow-emerald-100/60`;
    }

    return SECTION_CARD_CLASS;
}

function SectionHeader({
    icon: Icon,
    index,
    title,
    subtitle,
    optional,
    active,
    completed,
}: {
    icon: LucideIcon;
    index: string;
    title: string;
    subtitle: string;
    optional?: string;
    active?: boolean;
    completed?: boolean;
}) {
    return (
        <div className={`flex items-start gap-3 rounded-t-lg border-b px-5 py-4 sm:px-6 ${
            active
                ? "border-red-100 bg-red-50/80"
                : completed
                    ? "border-emerald-100 bg-emerald-50/60"
                    : "border-slate-100 bg-slate-50/70"
        }`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-white shadow-sm ${
                active
                    ? "border-[#d91c1c]/20 text-[#d91c1c]"
                    : completed
                        ? "border-emerald-200 text-emerald-600"
                        : "border-slate-200 text-[#d91c1c]"
            }`}>
                <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-black uppercase ${
                        active
                            ? "text-[#d91c1c]"
                            : completed
                                ? "text-emerald-600"
                                : "text-slate-400"
                    }`}>{index}</span>
                    {optional && (
                        <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                            {optional}
                        </span>
                    )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                    <h3 className={`text-lg font-bold ${active ? "text-[#d91c1c]" : "text-slate-900"}`}>{title}</h3>
                    {completed && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                            <Check size={12} strokeWidth={3} />
                        </span>
                    )}
                </div>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
            </div>
        </div>
    );
}

function FormSection({
    id,
    icon,
    index,
    title,
    subtitle,
    active,
    completed,
    children,
}: {
    id: string;
    icon: LucideIcon;
    index: string;
    title: string;
    subtitle: string;
    active?: boolean;
    completed?: boolean;
    children: ReactNode;
}) {
    return (
        <section id={id} data-form-section className={sectionCardClass(active, completed)}>
            <SectionHeader
                icon={icon}
                index={index}
                title={title}
                subtitle={subtitle}
                active={active}
                completed={completed}
            />
            <div className="space-y-6 p-5 sm:p-6">{children}</div>
        </section>
    );
}

function ExpandableFormSection({
    id,
    icon,
    index,
    title,
    subtitle,
    optional,
    defaultOpen,
    active,
    completed,
    children,
}: {
    id: string;
    icon: LucideIcon;
    index: string;
    title: string;
    subtitle: string;
    optional: string;
    defaultOpen?: boolean;
    active?: boolean;
    completed?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(Boolean(defaultOpen));

    return (
        <details id={id} data-form-section className={`${sectionCardClass(active, completed)} group`} open={open}>
            <summary
                className="cursor-pointer list-none [&::-webkit-details-marker]:hidden"
                onClick={(event) => {
                    event.preventDefault();
                    setOpen((current) => !current);
                }}
            >
                <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                        <SectionHeader
                            icon={icon}
                            index={index}
                            title={title}
                            subtitle={subtitle}
                            optional={optional}
                            active={active}
                            completed={completed}
                        />
                    </div>
                    <ChevronDown
                        size={18}
                        className={`-ml-10 mr-5 shrink-0 transition-transform ${
                            open ? "rotate-180" : ""
                        } ${
                            active ? "text-[#d91c1c]" : "text-slate-400"
                        }`}
                    />
                </div>
            </summary>
            <div className="space-y-6 p-5 sm:p-6">{children}</div>
        </details>
    );
}

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
    min,
    max,
    error,
}: {
    label: string;
    name: string;
    defaultValue?: number;
    required?: boolean;
    prefix?: string;
    suffix?: string;
    min?: number;
    max?: number;
    error?: string;
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
        <div data-autoscout-field={name}>
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
                    aria-invalid={Boolean(error)}
                    data-min={min}
                    data-max={max}
                    className={`w-full bg-slate-50 border text-slate-900 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium ${
                        error ? "border-red-500" : "border-slate-300"
                    } ${
                        prefix ? "pl-7 pr-4" : suffix ? "pl-4 pr-10" : "px-4"
                    }`}
                    placeholder="0"
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">{suffix}</span>
                )}
            </div>
            <input type="hidden" name={name} value={raw} />
            <FieldError message={error} />
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
    error,
}: {
    label: string;
    name: string;
    options: string[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
}) {
    const { dict } = useAdminI18n();
    const uniqueOptions = uniqueDropdownOptions(options);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [customMode, setCustomMode] = useState(() => Boolean(value && !uniqueOptions.includes(value)));
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const customInputRef = useRef<HTMLInputElement>(null);

    const closeDropdown = useCallback(() => {
        setOpen(false);
        setSearch("");
    }, []);
    useOutsideClick(ref, closeDropdown, open);

    const normalizedSearch = normalizeFeature(search);
    const filtered = uniqueOptions.filter((option) =>
        normalizeFeature(option).includes(normalizedSearch)
    );

    // Custom/free-text mode
    if (customMode) {
        return (
            <div ref={ref} data-autoscout-field={name}>
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
                    aria-invalid={Boolean(error)}
                    className={`w-full bg-slate-50 border text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium ${error ? "border-red-500" : "border-slate-300"}`}
                />
                <FieldError message={error} />
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
        <div ref={ref} className="relative" data-autoscout-field={name}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                {label}
            </label>
            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={value} />
            <button
                type="button"
                disabled={disabled}
                data-invalid={Boolean(error)}
                onClick={() => {
                    setOpen(!open);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`w-full bg-slate-50 border text-left px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium flex items-center justify-between transition-colors ${
                    error ? "border-red-500" : "border-slate-300"
                } ${
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
                                    onClick={(event) => {
                                        onChange(option);
                                        setOpen(false);
                                        setSearch("");
                                        notifyClosestFormChanged(event.currentTarget);
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
                            onClick={(event) => {
                                setCustomMode(true);
                                setOpen(false);
                                setSearch("");
                                onChange("");
                                setTimeout(() => customInputRef.current?.focus(), 50);
                                notifyClosestFormChanged(event.currentTarget);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-[#d91c1c] hover:bg-slate-50 transition-colors border-t border-slate-100"
                        >
                            ✏️ {dict.carForm.placeholderOther}
                        </button>
                    </div>
                </div>
            )}
            <FieldError message={error} />
        </div>
    );
}

function SelectField({
    label,
    name,
    options,
    defaultValue,
    required,
    placeholder,
    error,
}: {
    label: string;
    name: string;
    options: AutoScoutSelectOption[];
    defaultValue?: string | null;
    required?: boolean;
    placeholder: string;
    error?: string;
}) {
    const { dict } = useAdminI18n();
    const uniqueOptions = uniqueSelectOptions(options);
    const initialValue = defaultValue && !uniqueOptions.some((option) => option.value === defaultValue)
        ? findReferenceOptionByLabel(uniqueOptions, defaultValue)?.value ?? defaultValue
        : defaultValue ?? "";
    const [selectedValue, setSelectedValue] = useState(initialValue);
    const selectedOption = uniqueOptions.find((option) => option.value === selectedValue);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const filteredOptions = uniqueOptions.filter((option) => (
        normalizeFeature(option.label).includes(normalizeFeature(search))
    ));

    const closeDropdown = useCallback(() => {
        setOpen(false);
        setSearch("");
    }, []);

    useOutsideClick(ref, closeDropdown, open);

    return (
        <div ref={ref} className="relative" data-autoscout-field={name}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            <input
                type="text"
                tabIndex={-1}
                aria-hidden="true"
                readOnly
                required={required}
                name={name}
                value={selectedValue}
                className="sr-only"
            />
            <button
                type="button"
                data-invalid={Boolean(error)}
                onClick={() => {
                    setOpen((current) => !current);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`w-full rounded-lg border px-4 py-3 text-left font-medium transition-colors focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] ${
                    error
                        ? "border-red-500 bg-red-50/30"
                        : open
                        ? "border-[#d91c1c] bg-white shadow-sm shadow-[#d91c1c]/10"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                } ${selectedOption || selectedValue ? "text-slate-900" : "text-slate-400"}`}
            >
                <span className="flex items-center justify-between gap-3">
                    <span className="truncate">{selectedOption?.label || selectedValue || placeholder}</span>
                    <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </span>
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                        <Search size={14} className="shrink-0 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={dict.carForm.placeholderSearch}
                            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                        {!required && selectedValue && (
                            <button
                                type="button"
                                onClick={(event) => {
                                    setSelectedValue("");
                                    closeDropdown();
                                    notifyClosestFormChanged(event.currentTarget);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                            >
                                {placeholder}
                            </button>
                        )}
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400">{dict.carForm.placeholderNoResults}</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={(event) => {
                                        setSelectedValue(option.value);
                                        closeDropdown();
                                        notifyClosestFormChanged(event.currentTarget);
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                        option.value === selectedValue
                                            ? "bg-red-50 text-[#d91c1c]"
                                            : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    <span>{option.label}</span>
                                    {option.value === selectedValue && <Check size={14} className="shrink-0" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
            <FieldError message={error} />
        </div>
    );
}

function NumberInputField({
    label,
    name,
    defaultValue,
    suffix,
    step = "1",
    min = "0",
    max,
    error,
}: {
    label: string;
    name: string;
    defaultValue?: number | null;
    suffix?: string;
    step?: string;
    min?: string;
    max?: string;
    error?: string;
}) {
    return (
        <div data-autoscout-field={name}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            <div className="relative">
                <input
                    type="number"
                    name={name}
                    defaultValue={defaultValue ?? ""}
                    step={step}
                    min={min}
                    max={max}
                    aria-invalid={Boolean(error)}
                    className={`w-full bg-slate-50 border text-slate-900 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium ${error ? "border-red-500" : "border-slate-300"} ${suffix ? "pl-4 pr-16" : "px-4"}`}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">{suffix}</span>
                )}
            </div>
            <FieldError message={error} />
        </div>
    );
}

function findReferenceOptionByLabel(options: AutoScoutSelectOption[], label?: string | null) {
    if (!label) return null;
    const normalizedLabel = normalizeFeature(label);
    return options.find((option) => normalizeFeature(option.label) === normalizedLabel) ?? null;
}

function ReferenceSelectField({
    label,
    codeName,
    labelName,
    options,
    defaultCode,
    fallbackLabel,
    required,
    placeholder,
    error,
}: {
    label: string;
    codeName: string;
    labelName: string;
    options: AutoScoutSelectOption[];
    defaultCode?: string | null;
    fallbackLabel?: string | null;
    required?: boolean;
    placeholder: string;
    error?: string;
}) {
    const { dict } = useAdminI18n();
    const uniqueOptions = uniqueSelectOptions(options);
    const initialCode = uniqueOptions.find((option) => option.value === defaultCode)?.value
        ?? findReferenceOptionByLabel(uniqueOptions, defaultCode)?.value
        ?? findReferenceOptionByLabel(uniqueOptions, fallbackLabel)?.value
        ?? defaultCode
        ?? "";
    const [code, setCode] = useState(initialCode);
    const selectedOption = uniqueOptions.find((option) => option.value === code);
    const labelValue = selectedOption?.label ?? fallbackLabel ?? "";
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const filteredOptions = uniqueOptions.filter((option) => (
        normalizeFeature(option.label).includes(normalizeFeature(search))
    ));

    const closeDropdown = useCallback(() => {
        setOpen(false);
        setSearch("");
    }, []);

    useOutsideClick(ref, closeDropdown, open);

    return (
        <div ref={ref} className="relative" data-autoscout-field={codeName}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            <input
                type="text"
                tabIndex={-1}
                aria-hidden="true"
                readOnly
                required={required}
                name={codeName}
                value={code}
                className="sr-only"
            />
            <input type="hidden" name={labelName} value={labelValue} />
            <button
                type="button"
                data-invalid={Boolean(error)}
                onClick={() => {
                    setOpen((current) => !current);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`w-full rounded-lg border px-4 py-3 text-left font-medium transition-colors focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] ${
                    error
                        ? "border-red-500 bg-red-50/30"
                        : open
                        ? "border-[#d91c1c] bg-white shadow-sm shadow-[#d91c1c]/10"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                } ${selectedOption || fallbackLabel ? "text-slate-900" : "text-slate-400"}`}
            >
                <span className="flex items-center justify-between gap-3">
                    <span className="truncate">{selectedOption?.label || fallbackLabel || placeholder}</span>
                    <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </span>
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                        <Search size={14} className="shrink-0 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={dict.carForm.placeholderSearch}
                            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                        {!required && code && (
                            <button
                                type="button"
                                onClick={(event) => {
                                    setCode("");
                                    closeDropdown();
                                    notifyClosestFormChanged(event.currentTarget);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                            >
                                {placeholder}
                            </button>
                        )}
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400">{dict.carForm.placeholderNoResults}</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={(event) => {
                                        setCode(option.value);
                                        closeDropdown();
                                        notifyClosestFormChanged(event.currentTarget);
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                        option.value === code
                                            ? "bg-red-50 text-[#d91c1c]"
                                            : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    <span>{option.label}</span>
                                    {option.value === code && <Check size={14} className="shrink-0" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
            <FieldError message={error} />
        </div>
    );
}

function MultiReferenceDropdownField({
    label,
    hint,
    options,
    values,
    onChange,
}: {
    label: string;
    hint: string;
    options: AutoScoutSelectOption[];
    values: string[];
    onChange: (values: string[]) => void;
}) {
    const { dict } = useAdminI18n();
    const uniqueOptions = uniqueSelectOptions(options);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const filteredOptions = uniqueOptions.filter((option) => (
        !values.includes(option.value) &&
        normalizeFeature(option.label).includes(normalizeFeature(search))
    ));

    const closeDropdown = useCallback(() => {
        setOpen(false);
        setSearch("");
    }, []);

    useOutsideClick(ref, closeDropdown, open);

    const addValue = (value: string) => {
        if (values.includes(value)) return;
        onChange([...values, value]);
        closeDropdown();
    };

    const removeValue = (value: string) => {
        onChange(values.filter((current) => current !== value));
    };

    const selectedSummary = (() => {
        if (values.length === 0) return dict.carForm.placeholderOptionalSelect;
        const selectedOptions = values
            .map((value) => uniqueOptions.find((entry) => entry.value === value)?.label)
            .filter((value): value is string => Boolean(value));
        if (selectedOptions.length === 0) return dict.carForm.placeholderOptionalSelect;
        if (selectedOptions.length === 1) return selectedOptions[0];
        return `${selectedOptions[0]} +${selectedOptions.length - 1}`;
    })();

    return (
        <div ref={ref} className="relative md:col-span-2 lg:col-span-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</label>
            <p className="mb-3 text-xs font-medium text-slate-400">{hint}</p>
            <button
                type="button"
                onClick={() => {
                    setOpen((current) => !current);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`w-full rounded-lg border px-4 py-3 text-left font-medium transition-colors focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] ${
                    open
                        ? "border-[#d91c1c] bg-white shadow-sm shadow-[#d91c1c]/10"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                } ${values.length > 0 ? "text-slate-900" : "text-slate-400"}`}
            >
                <span className="flex items-center justify-between gap-3">
                    <span className="truncate">
                        {selectedSummary}
                    </span>
                    <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </span>
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                        <Search size={14} className="shrink-0 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={dict.carForm.placeholderSearch}
                            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400">{dict.carForm.placeholderNoResults}</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => addValue(option.value)}
                                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                >
                                    <span>{option.label}</span>
                                    <Plus size={14} className="shrink-0 text-slate-400" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
                {values.map((value) => {
                    const option = uniqueOptions.find((entry) => entry.value === value);
                    if (!option) return null;
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => removeValue(value)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-[#d91c1c]/30 hover:text-[#d91c1c]"
                        >
                            <span>{option.label}</span>
                            <X size={13} className="shrink-0" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function MonthYearField({
    label,
    name,
    defaultValue,
    required,
    error,
}: {
    label: string;
    name: string;
    defaultValue: string;
    required?: boolean;
    error?: string;
}) {
    const { dict, locale } = useAdminI18n();
    const monthLabels = getMonthLabels(locale);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const defaultDate = /^\d{4}-\d{2}$/.test(defaultValue) ? defaultValue : `${currentYear}-01`;
    const [value, setValue] = useState(defaultDate);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [visibleYear, setVisibleYear] = useState(() => Math.min(Number(defaultDate.split("-")[0]) || currentYear, currentYear));
    const selectedMonth = Number(value.split("-")[1]) || 1;
    const currentMonthValue = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    const closeDropdown = useCallback(() => setOpen(false), []);
    useOutsideClick(ref, closeDropdown, open);

    return (
        <div ref={ref} className="relative" data-autoscout-field={name}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            <input
                type="text"
                tabIndex={-1}
                aria-hidden="true"
                readOnly
                required={required}
                name={name}
                value={value}
                className="sr-only"
            />
            <button
                type="button"
                data-invalid={Boolean(error)}
                onClick={() => setOpen((current) => !current)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] ${
                    error
                        ? "border-red-500 bg-red-50/30"
                        : open
                        ? "border-[#d91c1c] bg-white shadow-sm shadow-[#d91c1c]/10"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                }`}
                aria-expanded={open}
            >
                <span className="flex items-center justify-between gap-4">
                    <span>
                        <span className="block text-base font-semibold text-slate-900">{formatMonthValue(value, locale)}</span>
                        <span className="block text-xs font-medium text-slate-400">{dict.carForm.firstRegistrationPickerHint}</span>
                    </span>
                    <Calendar size={18} className="shrink-0 text-slate-400" />
                </span>
            </button>

            {open && (
                <div className="absolute left-0 top-full z-30 mt-1 w-full min-w-[19rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <button
                            type="button"
                            onClick={() => setVisibleYear((current) => current - 1)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            aria-label={dict.carForm.previousYear}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="text-sm font-bold tracking-wide text-slate-900">{visibleYear}</div>
                        <button
                            type="button"
                            onClick={() => setVisibleYear((current) => current + 1)}
                            disabled={visibleYear >= currentYear}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={dict.carForm.nextYear}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-4">
                        {monthLabels.map((monthLabel, index) => {
                            const monthNumber = index + 1;
                            const monthValue = `${visibleYear}-${String(monthNumber).padStart(2, "0")}`;
                            const isSelected = monthValue === value;
                            const isFutureMonth = visibleYear > currentYear || (visibleYear === currentYear && monthNumber > currentMonth);

                            return (
                                <button
                                    key={monthValue}
                                    type="button"
                                    disabled={isFutureMonth}
                                    onClick={(event) => {
                                        setValue(monthValue);
                                        setOpen(false);
                                        notifyClosestFormChanged(event.currentTarget);
                                    }}
                                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                                        isSelected
                                            ? "border-[#d91c1c] bg-red-50 text-[#d91c1c]"
                                            : isFutureMonth
                                                ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                                            : visibleYear === Number(value.split("-")[0]) && monthNumber === selectedMonth
                                                ? "border-slate-300 bg-slate-100 text-slate-900"
                                                : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                >
                                    {monthLabel}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                        <button
                            type="button"
                            onClick={(event) => {
                                setValue(currentMonthValue);
                                setVisibleYear(currentYear);
                                setOpen(false);
                                notifyClosestFormChanged(event.currentTarget);
                            }}
                            className="text-sm font-semibold text-[#d91c1c] transition-colors hover:text-[#b91515]"
                        >
                            {dict.carForm.thisMonth}
                        </button>
                        <span className="text-xs font-medium text-slate-400">{formatMonthValue(value, locale)}</span>
                    </div>
                </div>
            )}
            <FieldError message={error} />
        </div>
    );
}

function PowerKwField({
    label,
    defaultKw,
    defaultHp,
    error,
}: {
    label: string;
    defaultKw?: number | null;
    defaultHp?: number | null;
    error?: string;
}) {
    const initialKw = defaultKw ?? (defaultHp ? Math.max(0, Math.round(defaultHp * HP_TO_KW)) : 0);
    const [kw, setKw] = useState(initialKw);
    const horsepower = Math.max(0, Math.round((Number.isFinite(kw) ? kw : 0) * KW_TO_HP));

    return (
        <div data-autoscout-field="powerKw">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            <div className="relative">
                <input
                    type="number"
                    name="powerKw"
                    value={kw}
                    required
                    min="1"
                    max="9999"
                    aria-invalid={Boolean(error)}
                    onChange={(event) => setKw(event.target.value === "" ? 0 : Number(event.target.value))}
                    className={`w-full bg-slate-50 border text-slate-900 pl-4 pr-10 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium ${error ? "border-red-500" : "border-slate-300"}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">kW</span>
            </div>
            <input type="hidden" name="horsepower" value={horsepower} />
            <FieldError message={error} />
        </div>
    );
}

// ─── Main CarForm ───────────────────────────────────────────────────
type InitialCarImage = { url: string };
type ImageItem = { id: string; url: string; type: "existing" | "new"; file?: File; aiScore?: number; aiAngle?: string };
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
    equipmentCodes?: string[];
    images?: InitialCarImage[];
    makeCode?: string | null;
    modelCode?: string | null;
    offerTypeCode?: string | null;
    availabilityTypeCode?: string | null;
    vin?: string | null;
    referenceNumber?: string | null;
    crossReferenceId?: string | null;
    licencePlate?: string | null;
    version?: string | null;
    bodyTypeCode?: string | null;
    vehicleTypeCode?: string | null;
    fuelTypeCode?: string | null;
    fuelCategory?: string | null;
    additionalFuelTypeCodes?: string[];
    isPluginHybrid?: boolean | null;
    transmissionCode?: string | null;
    drivetrainCode?: string | null;
    powerKw?: number | null;
    engineSize?: number | null;
    cylinderCount?: number | null;
    firstRegistrationRaw?: string | null;
    constructionYear?: number | null;
    doors?: number | null;
    seats?: number | null;
    exteriorColorCode?: string | null;
    manufacturerColorName?: string | null;
    interiorColorCode?: string | null;
    upholsteryCode?: string | null;
    emissionClassCode?: string | null;
    co2Emissions?: number | null;
    consumptionCombined?: number | null;
    priceCurrency?: string | null;
    netPrice?: number | null;
    vatRate?: number | null;
    vatDeductible?: boolean | null;
    priceNegotiable?: boolean | null;
    warrantyMonths?: number | null;
    hasWarranty?: boolean | null;
    autoscoutSyncStatus?: string | null;
    autoscoutSyncError?: string | null;
};

type ComparableCarSnapshot = {
    title: string;
    brand: string;
    model: string;
    year: number | null;
    mileage: number | null;
    price: number | null;
    description: string;
    images: string[];
    features: string[];
    equipmentCodes: string[];
    makeCode: string | null;
    modelCode: string | null;
    offerTypeCode: string | null;
    availabilityTypeCode: string | null;
    vin: string | null;
    referenceNumber: string | null;
    crossReferenceId: string | null;
    licencePlate: string | null;
    version: string | null;
    bodyTypeCode: string | null;
    vehicleTypeCode: string | null;
    fuelTypeCode: string | null;
    fuelCategory: string | null;
    additionalFuelTypeCodes: string[];
    isPluginHybrid: boolean;
    transmissionCode: string | null;
    drivetrainCode: string | null;
    powerKw: number | null;
    engineSize: number | null;
    cylinderCount: number | null;
    firstRegistrationRaw: string | null;
    constructionYear: number | null;
    doors: number | null;
    seats: number | null;
    exteriorColorCode: string | null;
    manufacturerColorName: string | null;
    interiorColorCode: string | null;
    upholsteryCode: string | null;
    emissionClassCode: string | null;
    co2Emissions: number | null;
    consumptionCombined: number | null;
    netPrice: number | null;
    vatRate: number | null;
    vatDeductible: boolean;
    priceNegotiable: boolean;
    warrantyMonths: number | null;
    hasWarranty: boolean;
    carpass_url: string | null;
};

function normalizeComparableString(value: FormDataEntryValue | string | null | undefined) {
    if (typeof value !== "string") return "";
    return value.trim();
}

function normalizeComparableOptionalString(value: FormDataEntryValue | string | null | undefined) {
    const normalized = normalizeComparableString(value);
    return normalized || null;
}

function normalizeComparableInt(value: FormDataEntryValue | string | number | null | undefined) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function normalizeComparableNumber(value: FormDataEntryValue | string | number | null | undefined) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function hasFilledValue(value: FormDataEntryValue | null) {
    return typeof value === "string" ? value.trim().length > 0 : value !== null;
}

function emptySectionCompletion(): SectionCompletionMap {
    return {
        identity: false,
        specifications: false,
        publication: false,
        commercial: false,
        description: false,
        documents: false,
        features: false,
        gallery: false,
    };
}

function sectionCompletionChanged(
    previous: SectionCompletionMap,
    next: SectionCompletionMap,
) {
    return (Object.keys(previous) as SectionId[]).some((key) => previous[key] !== next[key]);
}

function normalizeComparableArray(values: string[] = []) {
    return values.map((value) => value.trim()).filter(Boolean);
}

function buildComparableCarSnapshot({
    formData,
    images,
    features,
    equipmentCodes,
    additionalFuelTypeCodes,
    makeCode,
    modelCode,
}: {
    formData: FormData;
    images: ImageItem[];
    features: string[];
    equipmentCodes: string[];
    additionalFuelTypeCodes: string[];
    makeCode: string;
    modelCode: string;
}): ComparableCarSnapshot {
    const currentImages = images.map((item) => (
        item.type === "existing" ? item.url : `new:${item.id}`
    ));

    return {
        title: normalizeComparableString(formData.get("title")),
        brand: normalizeComparableString(formData.get("brand")),
        model: normalizeComparableString(formData.get("model")),
        year: normalizeComparableInt(formData.get("year")),
        mileage: normalizeComparableInt(formData.get("mileage")),
        price: normalizeComparableNumber(formData.get("price")),
        description: normalizeComparableString(formData.get("description")),
        images: currentImages,
        features: normalizeComparableArray(features),
        equipmentCodes: normalizeComparableArray(equipmentCodes),
        makeCode: normalizeComparableOptionalString(makeCode),
        modelCode: normalizeComparableOptionalString(modelCode),
        offerTypeCode: normalizeComparableOptionalString(formData.get("offerTypeCode")),
        availabilityTypeCode: normalizeComparableOptionalString(formData.get("availabilityTypeCode")),
        vin: normalizeComparableOptionalString(formData.get("vin")),
        referenceNumber: normalizeComparableOptionalString(formData.get("referenceNumber")),
        crossReferenceId: normalizeComparableOptionalString(formData.get("crossReferenceId")),
        licencePlate: normalizeComparableOptionalString(formData.get("licencePlate")),
        version: normalizeComparableOptionalString(formData.get("version")),
        bodyTypeCode: normalizeComparableOptionalString(formData.get("bodyTypeCode")),
        vehicleTypeCode: normalizeComparableOptionalString(formData.get("vehicleTypeCode")),
        fuelTypeCode: normalizeComparableOptionalString(formData.get("fuelTypeCode")),
        fuelCategory: normalizeComparableOptionalString(formData.get("fuelCategory")),
        additionalFuelTypeCodes: normalizeComparableArray(additionalFuelTypeCodes).sort(),
        isPluginHybrid: formData.get("isPluginHybrid") === "on",
        transmissionCode: normalizeComparableOptionalString(formData.get("transmissionCode")),
        drivetrainCode: normalizeComparableOptionalString(formData.get("drivetrainCode")),
        powerKw: normalizeComparableInt(formData.get("powerKw")),
        engineSize: normalizeComparableInt(formData.get("engineSize")),
        cylinderCount: normalizeComparableInt(formData.get("cylinderCount")),
        firstRegistrationRaw: normalizeComparableOptionalString(formData.get("firstRegistrationRaw")),
        constructionYear: normalizeComparableInt(formData.get("constructionYear")),
        doors: normalizeComparableInt(formData.get("doors")),
        seats: normalizeComparableInt(formData.get("seats")),
        exteriorColorCode: normalizeComparableOptionalString(formData.get("exteriorColorCode")),
        manufacturerColorName: normalizeComparableOptionalString(formData.get("manufacturerColorName")),
        interiorColorCode: normalizeComparableOptionalString(formData.get("interiorColorCode")),
        upholsteryCode: normalizeComparableOptionalString(formData.get("upholsteryCode")),
        emissionClassCode: normalizeComparableOptionalString(formData.get("emissionClassCode")),
        co2Emissions: normalizeComparableInt(formData.get("co2Emissions")),
        consumptionCombined: normalizeComparableNumber(formData.get("consumptionCombined")),
        netPrice: normalizeComparableInt(formData.get("netPrice")),
        vatRate: normalizeComparableNumber(formData.get("vatRate")),
        vatDeductible: formData.get("vatDeductible") === "on",
        priceNegotiable: formData.get("priceNegotiable") === "on",
        warrantyMonths: normalizeComparableInt(formData.get("warrantyMonths")),
        hasWarranty: formData.get("hasWarranty") === "on",
        carpass_url: normalizeComparableOptionalString(formData.get("carpass_url")),
    };
}

function buildAutoScoutFormValidationValues({
    formData,
    makeCode,
    modelCode,
    equipmentCodes,
    additionalFuelTypeCodes,
    imageCount,
}: {
    formData: FormData;
    makeCode: string;
    modelCode: string;
    equipmentCodes: string[];
    additionalFuelTypeCodes: string[];
    imageCount: number;
}) {
    return {
        ...Object.fromEntries(formData.entries()),
        makeCode,
        modelCode,
        equipmentCodes,
        additionalFuelTypeCodes,
        imageCount,
        constructionYear: formData.get("constructionYear") || formData.get("year"),
        isPluginHybrid: formData.get("isPluginHybrid") === "on",
        hasWarranty: formData.get("hasWarranty") === "on",
    };
}

interface CarFormProps {
    initialData?: CarFormInitialData;
    autoscoutOptions?: AutoScoutFormOptions;
}

function findMakeCode(options: AutoScoutFormOptions, label: string) {
    const normalizedLabel = normalizeFeature(label);
    return options.makes.find((make) => normalizeFeature(make.label) === normalizedLabel)?.value ?? "";
}

function findModelCode(options: AutoScoutFormOptions, makeCode: string, label: string) {
    const normalizedLabel = normalizeFeature(label);
    return options.makes
        .find((make) => make.value === makeCode)
        ?.models.find((model) => normalizeFeature(model.label) === normalizedLabel)?.value ?? "";
}

function normalizeFeature(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function uniqueDropdownOptions(options: string[]) {
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const option of options) {
        const trimmed = option.trim();
        const key = normalizeFeature(trimmed);
        if (!trimmed || seen.has(key)) continue;
        seen.add(key);
        unique.push(trimmed);
    }

    return unique;
}

function uniqueSelectOptions(options: AutoScoutSelectOption[]) {
    const seen = new Set<string>();
    const unique: AutoScoutSelectOption[] = [];

    for (const option of options) {
        const label = option.label.trim();
        if (!label) continue;
        const key = `${option.value}::${normalizeFeature(label)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(option);
    }

    return unique;
}

function getMonthLabels(locale: "nl" | "fr") {
    const formatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-BE" : "nl-BE", { month: "short" });
    return Array.from({ length: 12 }, (_, index) => (
        formatter.format(new Date(2024, index, 1)).replace(".", "")
    ));
}

function formatMonthValue(value: string, locale: "nl" | "fr") {
    const [yearPart, monthPart] = value.split("-");
    const year = Number(yearPart);
    const month = Number(monthPart);

    if (!year || !month || month < 1 || month > 12) return value;

    const formatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-BE" : "nl-BE", {
        month: "long",
        year: "numeric",
    });

    return formatter.format(new Date(year, month - 1, 1));
}

export default function CarForm({ initialData, autoscoutOptions = EMPTY_AUTOSCOUT_OPTIONS }: CarFormProps) {
    const { dict, locale } = useAdminI18n();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const baselineSnapshotRef = useRef<string | null>(initialData?.id ? null : "");
    const dirtyCheckFrameRef = useRef<number | null>(null);
    const activeSectionFrameRef = useRef<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [hasChanges, setHasChanges] = useState(() => !initialData?.id);
    const [activeSectionId, setActiveSectionId] = useState<SectionId>("identity");
    const [sectionCompletion, setSectionCompletion] = useState<SectionCompletionMap>(emptySectionCompletion);
    const [autoscoutValidationIssues, setAutoscoutValidationIssues] = useState<AutoScoutValidationIssue[]>([]);
    const [touchedAutoscoutFields, setTouchedAutoscoutFields] = useState<Set<AutoScoutValidationField>>(new Set());
    const [showAllAutoscoutErrors, setShowAllAutoscoutErrors] = useState(false);
    const refs = autoscoutOptions.references;
    const autoscoutValidationIssuesByField = groupAutoScoutValidationIssues(autoscoutValidationIssues);
    const getFieldError = (field: AutoScoutValidationField) => {
        if (!showAllAutoscoutErrors && !touchedAutoscoutFields.has(field)) return undefined;
        const firstIssue = autoscoutValidationIssuesByField[field]?.[0];
        return firstIssue ? getAutoScoutValidationMessage(firstIssue, locale) : undefined;
    };

    // Brand/Model state
    const [brand, setBrand] = useState(initialData?.brand || "");
    const [model, setModel] = useState(initialData?.model || "");
    const [makeCode, setMakeCode] = useState(initialData?.makeCode || findMakeCode(autoscoutOptions, initialData?.brand || ""));
    const [modelCode, setModelCode] = useState(initialData?.modelCode || findModelCode(autoscoutOptions, initialData?.makeCode || findMakeCode(autoscoutOptions, initialData?.brand || ""), initialData?.model || ""));
    const [title, setTitle] = useState(initialData?.title || "");
    const availableMake = autoscoutOptions.makes.find((make) => (
        make.value === makeCode || normalizeFeature(make.label) === normalizeFeature(brand)
    ));
    const availableModels = availableMake?.models.map((entry) => entry.label) ?? getModelsForBrand(brand);
    const availableBrands = uniqueDropdownOptions([
        ...(initialData?.brand ? [initialData.brand] : []),
        ...autoscoutOptions.makes.map((make) => make.label),
        ...BRAND_NAMES,
    ]);

    // Features state
    const [features, setFeatures] = useState<string[]>(initialData?.features || []);
    const [equipmentCodes, setEquipmentCodes] = useState<string[]>(initialData?.equipmentCodes || []);
    const [additionalFuelTypeCodes, setAdditionalFuelTypeCodes] = useState<string[]>(initialData?.additionalFuelTypeCodes || []);
    const [featureInput, setFeatureInput] = useState("");
    const equipmentByCode = new Map(refs.equipment.map((option) => [option.value, option]));
    const equipmentCodeByLabel = new Map(refs.equipment.map((option) => [normalizeFeature(option.label), option.value]));
    const availableEquipmentOptions = refs.equipment.filter((option) => !equipmentCodes.includes(option.value));
    const normalizedFeatureSearch = normalizeFeature(featureInput);
    const equipmentSuggestions = normalizedFeatureSearch
        ? availableEquipmentOptions
            .filter((option) => normalizeFeature(option.label).includes(normalizedFeatureSearch))
            .slice(0, 8)
        : [];
    const quickEquipmentOptions = COMMON_EQUIPMENT_CODES
        .map((code) => equipmentByCode.get(code))
        .filter((option): option is AutoScoutSelectOption => Boolean(option))
        .filter((option) => !equipmentCodes.includes(option.value));

    const addEquipmentOption = (option: AutoScoutSelectOption) => {
        setEquipmentCodes((current) => (
            current.includes(option.value) ? current : [...current, option.value]
        ));
        setFeatures((current) => (
            current.some((feature) => normalizeFeature(feature) === normalizeFeature(option.label))
                ? current
                : [...current, option.label]
        ));
        setFeatureInput("");
    };

    const addFeature = () => {
        const val = featureInput.trim();
        if (!val) return;

        const exactEquipmentOption = availableEquipmentOptions.find((option) => (
            normalizeFeature(option.label) === normalizeFeature(val)
        ));
        const suggestedEquipmentOption = exactEquipmentOption ?? equipmentSuggestions[0];
        if (suggestedEquipmentOption) {
            addEquipmentOption(suggestedEquipmentOption);
            return;
        }

        if (!features.some((feature) => normalizeFeature(feature) === normalizeFeature(val))) {
            setFeatures([...features, val]);
        }
        const matchingEquipmentCode = equipmentCodeByLabel.get(normalizeFeature(val));
        if (matchingEquipmentCode && !equipmentCodes.includes(matchingEquipmentCode)) {
            setEquipmentCodes([...equipmentCodes, matchingEquipmentCode]);
        }
        setFeatureInput("");
    };

    const removeFeature = (tag: string) => {
        setFeatures(features.filter(f => f !== tag));
        const matchingEquipmentCode = equipmentCodeByLabel.get(normalizeFeature(tag));
        if (matchingEquipmentCode) {
            setEquipmentCodes(equipmentCodes.filter((code) => code !== matchingEquipmentCode));
        }
    };

    // Auto-prefill title when brand or model changes (only if title hasn't been manually edited)
    const [titleManuallyEdited, setTitleManuallyEdited] = useState(!!initialData?.title);

    const updateTitleFromBrandModel = (newBrand: string, newModel: string) => {
        if (!titleManuallyEdited) {
            const parts = [newBrand, newModel].filter(Boolean);
            setTitle(parts.join(" "));
        }
    };

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

    const focusAutoScoutValidationIssue = useCallback((issueValue?: AutoScoutValidationIssue) => {
        if (!issueValue) return;
        window.requestAnimationFrame(() => {
            const wrapper = document.querySelector<HTMLElement>(`[data-autoscout-field="${issueValue.field}"]`);
            wrapper?.scrollIntoView({ behavior: "smooth", block: "center" });
            wrapper?.querySelector<HTMLElement>("input:not([type=hidden]), button, textarea, select")?.focus();
        });
    }, []);

    const validateAutoScoutForm = useCallback((formData: FormData, focusFirst = false) => {
        if (formData.get("syncWithAutoscout") !== "on") {
            setAutoscoutValidationIssues([]);
            return [];
        }

        const issues = validateAutoScoutListingValues(buildAutoScoutFormValidationValues({
            formData,
            makeCode,
            modelCode,
            equipmentCodes,
            additionalFuelTypeCodes,
            imageCount: images.length,
        }));
        setAutoscoutValidationIssues(issues);
        if (focusFirst) focusAutoScoutValidationIssue(issues[0]);
        return issues;
    }, [additionalFuelTypeCodes, equipmentCodes, focusAutoScoutValidationIssue, images.length, makeCode, modelCode]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const formData = new FormData(e.currentTarget);
            setShowAllAutoscoutErrors(true);
            const validationIssues = validateAutoScoutForm(formData, true);
            if (validationIssues.length > 0) {
                toast.error(dict.carForm.autoscoutValidationFailed);
                setIsSubmitting(false);
                return;
            }
            const carData = Object.fromEntries(formData.entries());
            const comparableSnapshot = initialData?.id ? buildComparableCarSnapshot({
                formData,
                images,
                features,
                equipmentCodes,
                additionalFuelTypeCodes,
                makeCode,
                modelCode,
            }) : null;
            const comparableSnapshotKey = comparableSnapshot ? JSON.stringify(comparableSnapshot) : null;

            if (
                comparableSnapshotKey &&
                baselineSnapshotRef.current !== null &&
                comparableSnapshotKey === baselineSnapshotRef.current
            ) {
                toast.info(dict.carForm.noChangesToSave);
                setIsSubmitting(false);
                return;
            }

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
                equipmentCodes,
                additionalFuelTypeCodes,
                images: allImages,
                featured: initialData?.featured || false,
                sold: initialData?.sold || false,
                makeCode,
                modelCode,
                vatDeductible: formData.get("vatDeductible") === "on",
                priceNegotiable: formData.get("priceNegotiable") === "on",
                hasWarranty: formData.get("hasWarranty") === "on",
                isPluginHybrid: formData.get("isPluginHybrid") === "on",
                syncWithAutoscout: formData.get("syncWithAutoscout") === "on",
            });

            if (result.error) {
                if ("autoscoutValidationIssues" in result && result.autoscoutValidationIssues) {
                    setShowAllAutoscoutErrors(true);
                    setAutoscoutValidationIssues(result.autoscoutValidationIssues);
                    focusAutoScoutValidationIssue(result.autoscoutValidationIssues[0]);
                }
                toast.error(result.error);
                setIsSubmitting(false);
            } else if (result.noChanges) {
                toast.info(dict.carForm.noChangesToSave);
                setIsSubmitting(false);
                baselineSnapshotRef.current = comparableSnapshotKey;
                setHasChanges(false);
            } else {
                toast.success(initialData?.id ? dict.carForm.saveEdit : dict.carForm.saveNew);
                if (result.autoscoutQueued) toast.info(dict.carForm.autoscoutSyncQueued);
                router.push("/admin/cars");
                router.refresh();
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : dict.carForm.unexpectedError);
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    const sectionNavigation: Array<{
        id: SectionId;
        label: string;
        icon: LucideIcon;
        optional?: boolean;
    }> = [
        { id: "identity", label: dict.carForm.sectionIdentity, icon: CarFront },
        { id: "specifications", label: dict.carForm.sectionSpecs, icon: Gauge },
        { id: "publication", label: dict.carForm.sectionAutoscout, icon: Send },
        { id: "commercial", label: dict.carForm.sectionAutoscoutCommercial, icon: BadgeEuro, optional: true },
        { id: "description", label: dict.carForm.sectionDescription, icon: FileText },
        { id: "documents", label: dict.carForm.sectionDocuments, icon: Paperclip, optional: true },
        { id: "features", label: dict.carForm.sectionFeatures, icon: ListChecks, optional: true },
        { id: "gallery", label: dict.carForm.sectionGallery, icon: Images },
    ];
    const galleryDndContextId = initialData?.id ? `car-gallery-${initialData.id}` : "car-gallery-new";

    const updateSectionCompletion = useCallback((formData: FormData) => {
        const nextCompletion: SectionCompletionMap = {
            identity: Boolean(
                brand.trim() &&
                model.trim() &&
                title.trim() &&
                hasFilledValue(formData.get("year"))
            ),
            specifications: Boolean(
                hasFilledValue(formData.get("price")) &&
                hasFilledValue(formData.get("mileage")) &&
                hasFilledValue(formData.get("powerKw")) &&
                hasFilledValue(formData.get("exteriorColorCode")) &&
                hasFilledValue(formData.get("fuelCategory")) &&
                hasFilledValue(formData.get("transmissionCode"))
            ),
            publication: Boolean(
                hasFilledValue(formData.get("vehicleTypeCode")) &&
                hasFilledValue(formData.get("offerTypeCode")) &&
                hasFilledValue(formData.get("bodyTypeCode")) &&
                hasFilledValue(formData.get("availabilityTypeCode")) &&
                hasFilledValue(formData.get("firstRegistrationRaw")) &&
                hasFilledValue(formData.get("doors")) &&
                hasFilledValue(formData.get("seats"))
            ),
            commercial: Boolean(
                hasFilledValue(formData.get("referenceNumber")) ||
                hasFilledValue(formData.get("crossReferenceId")) ||
                hasFilledValue(formData.get("vin")) ||
                hasFilledValue(formData.get("licencePlate")) ||
                hasFilledValue(formData.get("version")) ||
                hasFilledValue(formData.get("netPrice")) ||
                hasFilledValue(formData.get("vatRate")) ||
                hasFilledValue(formData.get("warrantyMonths")) ||
                formData.get("vatDeductible") === "on" ||
                formData.get("priceNegotiable") === "on" ||
                formData.get("hasWarranty") === "on"
            ),
            description: Boolean(hasFilledValue(formData.get("description"))),
            documents: Boolean(hasFilledValue(formData.get("carpass_url"))),
            features: features.length > 0 || equipmentCodes.length > 0,
            gallery: images.length > 0,
        };

        setSectionCompletion((current) => (
            sectionCompletionChanged(current, nextCompletion) ? nextCompletion : current
        ));
    }, [brand, equipmentCodes.length, features.length, images.length, model, title]);

    const updateDirtyState = useCallback(() => {
        if (!formRef.current) return;
        if (dirtyCheckFrameRef.current !== null) {
            window.cancelAnimationFrame(dirtyCheckFrameRef.current);
        }
        dirtyCheckFrameRef.current = window.requestAnimationFrame(() => {
            if (!formRef.current) return;
            const formData = new FormData(formRef.current);
            updateSectionCompletion(formData);

            if (initialData?.id) {
                const currentSnapshot = buildComparableCarSnapshot({
                    formData,
                    images,
                    features,
                    equipmentCodes,
                    additionalFuelTypeCodes,
                    makeCode,
                    modelCode,
                });
                const baselineSnapshot = baselineSnapshotRef.current;
                if (baselineSnapshot !== null) {
                    setHasChanges(JSON.stringify(currentSnapshot) !== baselineSnapshot);
                }
            }
            dirtyCheckFrameRef.current = null;
        });
    }, [additionalFuelTypeCodes, equipmentCodes, features, images, initialData?.id, makeCode, modelCode, updateSectionCompletion]);

    useEffect(() => {
        updateDirtyState();
    }, [updateDirtyState]);

    useEffect(() => {
        if (!initialData?.id || !formRef.current || baselineSnapshotRef.current !== null) return;
        const frame = window.requestAnimationFrame(() => {
            if (!formRef.current || baselineSnapshotRef.current !== null) return;
            const initialSnapshot = buildComparableCarSnapshot({
                formData: new FormData(formRef.current),
                images,
                features,
                equipmentCodes,
                additionalFuelTypeCodes,
                makeCode,
                modelCode,
            });
            baselineSnapshotRef.current = JSON.stringify(initialSnapshot);
            setHasChanges(false);
        });
        return () => window.cancelAnimationFrame(frame);
    }, [additionalFuelTypeCodes, equipmentCodes, features, images, initialData?.id, makeCode, modelCode]);

    useEffect(() => (
        () => {
            if (dirtyCheckFrameRef.current !== null) {
                window.cancelAnimationFrame(dirtyCheckFrameRef.current);
            }
            if (activeSectionFrameRef.current !== null) {
                window.cancelAnimationFrame(activeSectionFrameRef.current);
            }
        }
    ), []);

    useEffect(() => {
        if (!formRef.current) return;

        const updateActiveSection = () => {
            if (activeSectionFrameRef.current !== null) return;
            activeSectionFrameRef.current = window.requestAnimationFrame(() => {
                const sectionElements = SECTION_IDS
                    .map((sectionId) => document.getElementById(sectionId))
                    .filter((section): section is HTMLElement => Boolean(section));

                if (sectionElements.length === 0) {
                    activeSectionFrameRef.current = null;
                    return;
                }

                const viewportHeight = window.innerHeight;
                const activationLine = Math.min(220, Math.max(120, viewportHeight * 0.18));
                let nextActive = sectionElements[0].id as SectionId;

                for (const section of sectionElements) {
                    const sectionTop = section.getBoundingClientRect().top;
                    if (sectionTop <= activationLine) {
                        nextActive = section.id as SectionId;
                        continue;
                    }
                    break;
                }

                const isAtBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
                if (isAtBottom) {
                    nextActive = sectionElements[sectionElements.length - 1].id as SectionId;
                }

                setActiveSectionId((current) => current === nextActive ? current : nextActive);
                activeSectionFrameRef.current = null;
            });
        };

        updateActiveSection();
        window.addEventListener("scroll", updateActiveSection, { passive: true });
        window.addEventListener("resize", updateActiveSection);

        const resizeObserver = new ResizeObserver(updateActiveSection);
        resizeObserver.observe(formRef.current);
        for (const sectionId of SECTION_IDS) {
            const section = document.getElementById(sectionId);
            if (section) resizeObserver.observe(section);
        }

        return () => {
            window.removeEventListener("scroll", updateActiveSection);
            window.removeEventListener("resize", updateActiveSection);
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <form
            ref={formRef}
            onSubmit={handleSubmit}
            onInput={updateDirtyState}
            onChange={() => {
                updateDirtyState();
                if (autoscoutValidationIssues.length === 0) return;
                window.setTimeout(() => {
                    if (formRef.current) validateAutoScoutForm(new FormData(formRef.current));
                }, 0);
            }}
            onBlurCapture={(event) => {
                const wrapper = (event.target as HTMLElement).closest<HTMLElement>("[data-autoscout-field]");
                const field = wrapper?.dataset.autoscoutField as AutoScoutValidationField | undefined;
                window.setTimeout(() => {
                    if (wrapper?.contains(document.activeElement)) return;
                    if (field) {
                        setTouchedAutoscoutFields((current) => new Set(current).add(field));
                    }
                    if (formRef.current) validateAutoScoutForm(new FormData(formRef.current));
                }, 75);
            }}
            onClick={updateDirtyState}
            className="space-y-6"
        >
            {error && (
                <div className="p-4 bg-red-50/50 border border-red-200 text-red-600 text-sm rounded-lg">
                    {error}
                </div>
            )}

            {autoscoutOptions.error && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">
                    {dict.carForm.autoscoutOptionsError}: {autoscoutOptions.error}
                </div>
            )}

            {initialData?.autoscoutSyncStatus === "failed" && initialData.autoscoutSyncError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    <span className="font-bold">{dict.carForm.autoscoutSyncFailed}</span> {initialData.autoscoutSyncError}
                </div>
            )}

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="space-y-5">

            {/* Vehicle Identity */}
            <FormSection
                id="identity"
                icon={CarFront}
                index="01"
                title={dict.carForm.sectionIdentity}
                subtitle={dict.carForm.sectionIdentityHint}
                active={activeSectionId === "identity"}
                completed={sectionCompletion.identity}
            >
                {/* Row 1: brand + model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SearchableDropdown
                        label={dict.carForm.brand}
                        name="brand"
                        options={availableBrands}
                        value={brand}
                        onChange={(val) => {
                            const selectedMakeCode = findMakeCode(autoscoutOptions, val);
                            setBrand(val);
                            setMakeCode(selectedMakeCode);
                            setModel(""); // Reset model when brand changes
                            setModelCode("");
                            updateTitleFromBrandModel(val, "");
                        }}
                        placeholder={dict.carForm.placeholderBrand}
                        required
                        error={getFieldError("makeCode")}
                    />

                    <SearchableDropdown
                        label={dict.carForm.model}
                        name="model"
                        options={availableModels}
                        value={model}
                        onChange={(val) => {
                            setModelCode(findModelCode(autoscoutOptions, makeCode, val));
                            setModel(val);
                            updateTitleFromBrandModel(brand, val);
                        }}
                        placeholder={brand ? dict.carForm.placeholderModel : dict.carForm.placeholderBrandFirst}
                        required
                        disabled={!brand}
                        error={getFieldError("modelCode")}
                    />
                    <input type="hidden" name="makeCode" value={makeCode} />
                    <input type="hidden" name="modelCode" value={modelCode} />
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
            </FormSection>

            <FormSection
                id="specifications"
                icon={Gauge}
                index="02"
                title={dict.carForm.sectionSpecs}
                subtitle={dict.carForm.sectionSpecsHint}
                active={activeSectionId === "specifications"}
                completed={sectionCompletion.specifications}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FormattedNumberField
                        label={dict.carForm.price}
                        name="price"
                        defaultValue={initialData?.price}
                        required
                        prefix="€"
                        min={1}
                        error={getFieldError("price")}
                    />
                    <FormattedNumberField
                        label={dict.carForm.mileage}
                        name="mileage"
                        defaultValue={initialData?.mileage}
                        required
                        suffix="km"
                        min={0}
                        error={getFieldError("mileage")}
                    />
                    <PowerKwField
                        label={dict.carForm.powerKw}
                        defaultKw={initialData?.powerKw}
                        defaultHp={initialData?.horsepower}
                        error={getFieldError("powerKw")}
                    />
                    <ReferenceSelectField
                        label={dict.carForm.color}
                        codeName="exteriorColorCode"
                        labelName="color"
                        options={refs.bodyColors}
                        defaultCode={initialData?.exteriorColorCode}
                        fallbackLabel={initialData?.color}
                        required
                        placeholder={dict.carForm.placeholderColor}
                    />
                    <ReferenceSelectField
                        label={dict.carForm.fuelCategory}
                        codeName="fuelCategory"
                        labelName="fuel_type"
                        options={refs.fuelCategories}
                        defaultCode={initialData?.fuelCategory}
                        fallbackLabel={initialData?.fuel_type}
                        required
                        placeholder={dict.carForm.placeholderSelect}
                        error={getFieldError("fuelCategory")}
                    />
                    <ReferenceSelectField
                        label={dict.carForm.transmission}
                        codeName="transmissionCode"
                        labelName="transmission"
                        options={refs.transmissions}
                        defaultCode={initialData?.transmissionCode}
                        fallbackLabel={initialData?.transmission}
                        required
                        placeholder={dict.carForm.placeholderSelect}
                        error={getFieldError("transmissionCode")}
                    />
                </div>
            </FormSection>

            <FormSection
                id="publication"
                icon={Send}
                index="03"
                title={dict.carForm.sectionAutoscout}
                subtitle={dict.carForm.sectionAutoscoutHint}
                active={activeSectionId === "publication"}
                completed={sectionCompletion.publication}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SelectField label={dict.carForm.vehicleType} name="vehicleTypeCode" options={refs.vehicleTypes} defaultValue={initialData?.vehicleTypeCode || "C"} required placeholder={dict.carForm.placeholderSelect} error={getFieldError("vehicleTypeCode")} />
                    <SelectField label={dict.carForm.offerType} name="offerTypeCode" options={refs.offerTypes} defaultValue={initialData?.offerTypeCode || "U"} required placeholder={dict.carForm.placeholderSelect} error={getFieldError("offerTypeCode")} />
                    <SelectField label={dict.carForm.bodyType} name="bodyTypeCode" options={refs.bodyTypes} defaultValue={initialData?.bodyTypeCode} required placeholder={dict.carForm.placeholderSelect} error={getFieldError("bodyTypeCode")} />
                    <SelectField label={dict.carForm.availability} name="availabilityTypeCode" options={refs.availabilityTypes} defaultValue={initialData?.availabilityTypeCode || "1"} required placeholder={dict.carForm.placeholderSelect} error={getFieldError("availabilityTypeCode")} />
                    <MonthYearField
                        label={dict.carForm.firstRegistration}
                        name="firstRegistrationRaw"
                        defaultValue={initialData?.firstRegistrationRaw || `${initialData?.year || new Date().getFullYear()}-01`}
                        required
                        error={getFieldError("firstRegistrationRaw")}
                    />
                    <FormattedNumberField label={dict.carForm.doors} name="doors" defaultValue={initialData?.doors ?? undefined} required min={1} max={9} error={getFieldError("doors")} />
                    <FormattedNumberField label={dict.carForm.seats} name="seats" defaultValue={initialData?.seats ?? undefined} required min={1} max={99} error={getFieldError("seats")} />
                </div>

                <details className="group border-t border-slate-100 pt-4">
                    <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Settings2 size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block">{dict.carForm.sectionTechnical}</span>
                            <span className="block text-xs font-medium text-slate-400">{dict.carForm.sectionTechnicalHint}</span>
                        </span>
                        <ChevronDown size={17} className="text-slate-400 transition-transform group-open:rotate-180" />
                    </summary>

                    <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div data-autoscout-field="manufacturerColorName">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.manufacturerColor}</label>
                            <input
                                type="text"
                                name="manufacturerColorName"
                                defaultValue={initialData?.manufacturerColorName || initialData?.color || ""}
                                maxLength={30}
                                aria-invalid={Boolean(getFieldError("manufacturerColorName"))}
                                className={`w-full bg-slate-50 border text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium ${getFieldError("manufacturerColorName") ? "border-red-500" : "border-slate-300"}`}
                            />
                            <FieldError message={getFieldError("manufacturerColorName")} />
                        </div>
                        <FormattedNumberField label={dict.carForm.engineSize} name="engineSize" defaultValue={initialData?.engineSize ?? undefined} suffix="cc" min={1} max={99999} error={getFieldError("engineSize")} />
                        <FormattedNumberField label={dict.carForm.cylinders} name="cylinderCount" defaultValue={initialData?.cylinderCount ?? undefined} min={1} max={99} error={getFieldError("cylinderCount")} />
                        <SelectField label={dict.carForm.drivetrain} name="drivetrainCode" options={refs.drivetrains} defaultValue={initialData?.drivetrainCode} placeholder={dict.carForm.placeholderOptionalSelect} />
                        <SelectField label={dict.carForm.primaryFuelType} name="fuelTypeCode" options={refs.fuelTypes} defaultValue={initialData?.fuelTypeCode} placeholder={dict.carForm.placeholderOptionalSelect} error={getFieldError("fuelTypeCode")} />
                        <SelectField label={dict.carForm.interiorColor} name="interiorColorCode" options={refs.upholsteryColors} defaultValue={initialData?.interiorColorCode} placeholder={dict.carForm.placeholderOptionalSelect} />
                        <SelectField label={dict.carForm.upholstery} name="upholsteryCode" options={refs.upholsteryTypes} defaultValue={initialData?.upholsteryCode} placeholder={dict.carForm.placeholderOptionalSelect} />
                        <SelectField label={dict.carForm.emissionClass} name="emissionClassCode" options={refs.emissionClasses} defaultValue={initialData?.emissionClassCode} placeholder={dict.carForm.placeholderOptionalSelect} />
                        <FormattedNumberField label={dict.carForm.co2} name="co2Emissions" defaultValue={initialData?.co2Emissions ?? undefined} suffix="g/km" />
                        <NumberInputField label={dict.carForm.consumption} name="consumptionCombined" defaultValue={initialData?.consumptionCombined} suffix="l/100km" step="0.1" />
                        <FormattedNumberField label={dict.carForm.constructionYear} name="constructionYear" defaultValue={initialData?.constructionYear ?? initialData?.year} min={1886} max={new Date().getFullYear() + 2} error={getFieldError("constructionYear")} />
                        <MultiReferenceDropdownField
                            label={dict.carForm.additionalFuelTypes}
                            hint={dict.carForm.additionalFuelTypesHint}
                            options={refs.fuelTypes}
                            values={additionalFuelTypeCodes}
                            onChange={setAdditionalFuelTypeCodes}
                        />
                        <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                            <input
                                type="checkbox"
                                name="isPluginHybrid"
                                defaultChecked={Boolean(initialData?.isPluginHybrid)}
                                className="h-4 w-4 rounded border-slate-300 text-[#d91c1c] focus:ring-[#d91c1c]"
                            />
                            {dict.carForm.isPluginHybrid}
                        </label>
                    </div>
                </details>
            </FormSection>

            <ExpandableFormSection
                id="commercial"
                icon={BadgeEuro}
                index="04"
                title={dict.carForm.sectionAutoscoutCommercial}
                subtitle={dict.carForm.sectionAutoscoutCommercialHint}
                optional={dict.carForm.optional}
                defaultOpen={Boolean(initialData?.id)}
                active={activeSectionId === "commercial"}
                completed={sectionCompletion.commercial}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div data-autoscout-field="referenceNumber">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.referenceNumber}</label>
                        <input name="referenceNumber" defaultValue={initialData?.referenceNumber || ""} maxLength={50} className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium" />
                        <FieldError message={getFieldError("referenceNumber")} />
                    </div>
                    <div data-autoscout-field="crossReferenceId">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.crossReferenceId}</label>
                        <input name="crossReferenceId" defaultValue={initialData?.crossReferenceId || ""} maxLength={50} className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium" />
                        <FieldError message={getFieldError("crossReferenceId")} />
                    </div>
                    <div data-autoscout-field="vin">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.vin}</label>
                        <input name="vin" defaultValue={initialData?.vin || ""} maxLength={17} className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium" />
                        <FieldError message={getFieldError("vin")} />
                    </div>
                    <div data-autoscout-field="licencePlate">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.licencePlate}</label>
                        <input name="licencePlate" defaultValue={initialData?.licencePlate || ""} maxLength={10} className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium" />
                        <FieldError message={getFieldError("licencePlate")} />
                    </div>
                    <div data-autoscout-field="version">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.version}</label>
                        <input name="version" defaultValue={initialData?.version || ""} maxLength={121} className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] font-medium" />
                        <FieldError message={getFieldError("version")} />
                    </div>
                    <FormattedNumberField label={dict.carForm.netPrice} name="netPrice" defaultValue={initialData?.netPrice ?? undefined} prefix="€" min={1} error={getFieldError("netPrice")} />
                    <NumberInputField label={dict.carForm.vatRate} name="vatRate" defaultValue={initialData?.vatRate} suffix="%" step="0.1" max="100" error={getFieldError("vatRate")} />
                    <FormattedNumberField label={dict.carForm.warrantyMonths} name="warrantyMonths" defaultValue={initialData?.warrantyMonths ?? undefined} suffix={dict.carForm.months} min={0} max={999} error={getFieldError("warrantyMonths")} />
                </div>

                <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700" data-autoscout-field="hasWarranty">
                        <input type="checkbox" name="vatDeductible" defaultChecked={Boolean(initialData?.vatDeductible)} className="h-4 w-4 rounded border-slate-300 text-[#d91c1c] focus:ring-[#d91c1c]" />
                        {dict.carForm.vatDeductible}
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                        <input type="checkbox" name="priceNegotiable" defaultChecked={Boolean(initialData?.priceNegotiable)} className="h-4 w-4 rounded border-slate-300 text-[#d91c1c] focus:ring-[#d91c1c]" />
                        {dict.carForm.priceNegotiable}
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                        <input type="checkbox" name="hasWarranty" defaultChecked={Boolean(initialData?.hasWarranty)} className="h-4 w-4 rounded border-slate-300 text-[#d91c1c] focus:ring-[#d91c1c]" />
                        {dict.carForm.hasWarranty}
                    </label>
                    <FieldError message={getFieldError("hasWarranty")} />
                </div>
            </ExpandableFormSection>

            <FormSection
                id="description"
                icon={FileText}
                index="05"
                title={dict.carForm.sectionDescription}
                subtitle={dict.carForm.sectionDescriptionHint}
                active={activeSectionId === "description"}
                completed={sectionCompletion.description}
            >
                <div data-autoscout-field="description">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.description}</label>
                    <textarea
                        name="description"
                        defaultValue={initialData?.description}
                        required
                        rows={6}
                        aria-invalid={Boolean(getFieldError("description"))}
                        className={`w-full bg-slate-50 border text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] resize-y font-medium ${getFieldError("description") ? "border-red-500" : "border-slate-300"}`}
                        placeholder={dict.carForm.placeholderDescription}
                    />
                    <FieldError message={getFieldError("description")} />
                </div>
            </FormSection>

            <ExpandableFormSection
                id="documents"
                icon={Paperclip}
                index="06"
                title={dict.carForm.sectionDocuments}
                subtitle={dict.carForm.sectionDocumentsHint}
                optional={dict.carForm.optional}
                defaultOpen
                active={activeSectionId === "documents"}
                completed={sectionCompletion.documents}
            >
                <div data-autoscout-field="equipmentCodes">
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
            </ExpandableFormSection>

            <FormSection
                id="features"
                icon={ListChecks}
                index="07"
                title={dict.carForm.sectionFeatures}
                subtitle={dict.carForm.sectionFeaturesHint}
                active={activeSectionId === "features"}
                completed={sectionCompletion.features}
            >
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{dict.carForm.addFeatureLabel}</label>
                    <div className="relative mb-4">
                        <div className="flex items-center gap-2">
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

                        {equipmentSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                {equipmentSuggestions.map((option, index) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            addEquipmentOption(option);
                                        }}
                                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                                            index === 0 ? "bg-red-50 text-[#d91c1c]" : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span>{option.label}</span>
                                        {index === 0 && (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#d91c1c]">
                                                Enter
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {quickEquipmentOptions.length > 0 && (
                        <div className="mb-4">
                            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                                {dict.carForm.autoscoutEquipment}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {quickEquipmentOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => addEquipmentOption(option)}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-colors hover:border-[#d91c1c] hover:bg-red-50 hover:text-[#d91c1c]"
                                    >
                                        <Plus size={12} />
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="mb-4 text-xs font-medium text-slate-500">
                        {dict.carForm.autoscoutEquipmentHint}
                    </p>
                    <FieldError message={getFieldError("equipmentCodes")} />

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
            </FormSection>

            <FormSection
                id="gallery"
                icon={Images}
                index="08"
                title={dict.carForm.sectionGallery}
                subtitle={dict.carForm.sectionGalleryHint}
                active={activeSectionId === "gallery"}
                completed={sectionCompletion.gallery}
            >
                <div data-autoscout-field="images">
                    <FieldError message={getFieldError("images")} />
                </div>
                <div className="flex items-center justify-end">
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
                        id={galleryDndContextId}
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
            </FormSection>

            </div>

            <aside className="hidden xl:block xl:self-start xl:sticky xl:top-8">
                <div
                    className="max-h-[calc(100vh-4rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                    <p className="px-2 pb-2 text-xs font-black uppercase text-slate-400">
                        {dict.carForm.sectionNavigation}
                    </p>
                    <nav className="space-y-0.5">
                        {sectionNavigation.map(({ id, label, icon: Icon, optional }, index) => {
                            const isActive = activeSectionId === id;
                            const isCompleted = sectionCompletion[id];

                            return (
                                <a
                                    key={id}
                                    href={`#${id}`}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        setActiveSectionId(id);
                                        document.getElementById(id)?.scrollIntoView({
                                            behavior: "smooth",
                                            block: "start",
                                        });
                                    }}
                                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-xs font-bold transition-all ${
                                        isActive
                                            ? "bg-red-50 text-[#d91c1c] shadow-sm shadow-red-100/70"
                                            : isCompleted
                                                ? "bg-emerald-50/70 text-emerald-700 hover:bg-emerald-50"
                                                : "text-slate-600 hover:bg-red-50 hover:text-[#d91c1c]"
                                    }`}
                                >
                                    <Icon size={14} className={`shrink-0 ${isActive ? "text-[#d91c1c]" : isCompleted ? "text-emerald-600" : ""}`} />
                                    <span className="min-w-0 flex-1 truncate">{label}</span>
                                    {isCompleted && (
                                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                                            <Check size={11} strokeWidth={3} />
                                        </span>
                                    )}
                                    {!isCompleted && optional && (
                                        <span className="text-[9px] font-black uppercase text-slate-300">
                                            {dict.carForm.optional}
                                        </span>
                                    )}
                                    <span className={`text-[10px] font-black ${
                                        isActive
                                            ? "text-[#d91c1c]"
                                            : isCompleted
                                                ? "text-emerald-600"
                                                : "text-slate-300"
                                    }`}>
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                </a>
                            );
                        })}
                    </nav>
                </div>
            </aside>
            </div>

            {showAllAutoscoutErrors && autoscoutValidationIssues.length > 0 && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-red-800 shadow-sm xl:mr-[16.5rem]">
                    <div className="flex items-start gap-3">
                        <CircleAlert size={19} className="mt-0.5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-bold">{dict.carForm.autoscoutValidationTitle}</p>
                            <p className="mt-1 text-xs font-medium text-red-700">{dict.carForm.autoscoutValidationHint}</p>
                            <ul className="mt-3 list-disc space-y-1 pl-4 text-xs font-semibold">
                                {autoscoutValidationIssues.map((issueValue) => (
                                    <li key={`${issueValue.field}-${issueValue.code}`}>
                                        {getAutoScoutValidationMessage(issueValue, locale)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm xl:mr-[16.5rem]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <label className="flex max-w-2xl items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        name="syncWithAutoscout"
                        defaultChecked
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#d91c1c] focus:ring-[#d91c1c]"
                    />
                    <span>
                        <span className="block font-bold text-slate-900">{dict.carForm.syncWithAutoscout}</span>
                        <span className="block text-xs font-medium text-slate-500">{dict.carForm.syncWithAutoscoutHint}</span>
                    </span>
                </label>

                <div className="flex justify-end gap-4">
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
                        disabled={isSubmitting || aiAnalyzing || isUploading || Boolean(initialData?.id && !hasChanges)}
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
                </div>
            </div>
        </form>
    );
}
