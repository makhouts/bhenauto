import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

const TONE_STYLES = {
    neutral: "border-[#d7d5cf] bg-[#f8f7f3] text-slate-600",
    red: "border-[#d91c1c]/25 bg-[#fff7f6] text-[#b91515]",
    blue: "border-sky-700/20 bg-sky-50/60 text-sky-800",
    green: "border-emerald-700/20 bg-emerald-50/60 text-emerald-800",
    amber: "border-amber-700/20 bg-amber-50/60 text-amber-800",
    violet: "border-violet-700/20 bg-violet-50/60 text-violet-800",
} as const;

const METRIC_ACCENTS = {
    neutral: "text-slate-500",
    red: "text-[#d91c1c]",
    blue: "text-sky-700",
    green: "text-emerald-700",
    amber: "text-amber-700",
    violet: "text-violet-700",
} as const;

type Tone = keyof typeof TONE_STYLES;

export function AdminPage({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("mx-auto flex w-full max-w-[1520px] flex-col gap-7", className)}>
            {children}
        </div>
    );
}

export function AdminPageHeader({
    eyebrow,
    title,
    description,
    actions,
    badges,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: ReactNode;
    badges?: ReactNode;
}) {
    return (
        <section className="border-b border-[#c9c7c0] pb-7 pt-1 sm:pb-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    {eyebrow ? (
                        <div className="mb-4 flex items-center gap-3">
                            <span className="h-px w-8 bg-[#d91c1c]" aria-hidden="true" />
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
                        </div>
                    ) : null}
                    <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-[#111116] sm:text-5xl">
                        {title}
                    </h1>
                    {description ? (
                        <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-slate-600 sm:text-[15px]">
                            {description}
                        </p>
                    ) : null}
                    {badges ? (
                        <div className="mt-5 flex flex-wrap items-center gap-2.5">
                            {badges}
                        </div>
                    ) : null}
                </div>
                {actions ? (
                    <div className="flex flex-wrap items-center gap-3">
                        {actions}
                    </div>
                ) : null}
            </div>
        </section>
    );
}

export function AdminSurface({
    children,
    className,
    padded = true,
}: {
    children: ReactNode;
    className?: string;
    padded?: boolean;
}) {
    return (
        <section
            className={cn(
                "overflow-hidden rounded-[3px] border border-[#d7d5cf] bg-white shadow-[0_12px_30px_rgba(17,17,22,0.045)]",
                padded && "px-5 py-5 sm:px-6 sm:py-6",
                className,
            )}
        >
            {children}
        </section>
    );
}

export function AdminSurfaceHeader({
    icon,
    title,
    description,
    action,
    className,
}: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col gap-4 border-b border-[#e4e2dc] pb-5 sm:flex-row sm:items-start sm:justify-between", className)}>
            <div className="flex min-w-0 items-start gap-4">
                {icon ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#d7d5cf] bg-[#f5f4ef] text-[#d91c1c]">
                        {icon}
                    </div>
                ) : null}
                <div className="min-w-0">
                    <h2 className="text-base font-black uppercase tracking-[-0.01em] text-[#17171b] sm:text-lg">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
                    ) : null}
                </div>
            </div>
            {action ? (
                <div className="flex shrink-0 items-center gap-3">
                    {action}
                </div>
            ) : null}
        </div>
    );
}

export function AdminMetricGrid({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("grid gap-px overflow-hidden border border-[#d7d5cf] bg-[#d7d5cf] sm:grid-cols-2 xl:grid-cols-4", className)}>
            {children}
        </div>
    );
}

export function AdminMetricCard({
    label,
    value,
    hint,
    icon,
    tone = "neutral",
    trend,
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon?: ReactNode;
    tone?: Tone;
    trend?: ReactNode;
}) {
    return (
        <div className="relative bg-white px-5 py-6 sm:px-6">
            <span className={cn("absolute left-0 top-0 h-0.5 w-12 bg-current", METRIC_ACCENTS[tone])} aria-hidden="true" />
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    {icon ? (
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center border border-[#dedcd6] bg-[#f7f6f2]", METRIC_ACCENTS[tone])}>
                            {icon}
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                            {label}
                        </p>
                        <p className="mt-2 text-3xl font-black leading-none tabular-nums text-[#111116]">
                            {value}
                        </p>
                    </div>
                </div>
                {trend ? <div className="shrink-0">{trend}</div> : null}
            </div>
            {hint ? (
                <p className="mt-5 border-t border-[#eceae5] pt-4 text-xs font-medium leading-5 text-slate-500">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

export function AdminBadge({
    children,
    tone = "neutral",
    className,
}: {
    children: ReactNode;
    tone?: Tone;
    className?: string;
}) {
    return (
        <span className={cn("inline-flex items-center gap-2 rounded-[2px] border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em]", TONE_STYLES[tone], className)}>
            {children}
        </span>
    );
}

export function AdminToolbar({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between", className)}>
            {children}
        </div>
    );
}

export function AdminInputWrap({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-3 rounded-[2px] border border-[#d7d5cf] bg-[#f7f6f2] px-4 py-3 transition-colors focus-within:border-[#d91c1c] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#d91c1c]/10", className)}>
            {children}
        </div>
    );
}

export function AdminEmptyState({
    icon,
    title,
    description,
    action,
    className,
}: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col items-center justify-center rounded-[3px] border border-dashed border-[#c9c7c0] bg-white px-6 py-16 text-center", className)}>
            {icon ? (
                <div className="mb-5 flex h-14 w-14 items-center justify-center border border-[#d7d5cf] bg-[#f7f6f2] text-slate-500">
                    {icon}
                </div>
            ) : null}
            <h3 className="text-xl font-black text-slate-900">{title}</h3>
            {description ? (
                <p className="mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">{description}</p>
            ) : null}
            {action ? <div className="mt-6">{action}</div> : null}
        </div>
    );
}

export function AdminGhostButton({
    children,
    className,
    style,
    ...props
}: HTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    style?: CSSProperties;
}) {
    return (
        <button
            {...props}
            style={style}
            className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] border border-[#c9c7c0] bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-slate-700 transition-colors hover:border-[#111116] hover:text-[#111116] disabled:opacity-60",
                className,
            )}
        >
            {children}
        </button>
    );
}

export function AdminPrimaryButton({
    children,
    className,
    style,
    ...props
}: HTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    style?: CSSProperties;
}) {
    return (
        <button
            {...props}
            style={style}
            className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] bg-[#d91c1c] px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#b91515] disabled:opacity-60",
                className,
            )}
        >
            {children}
        </button>
    );
}
