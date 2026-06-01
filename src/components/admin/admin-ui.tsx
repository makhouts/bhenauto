import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

const TONE_STYLES = {
    neutral: "border-slate-200 bg-white text-slate-700",
    red: "border-[#d91c1c]/15 bg-[#fff4f4] text-[#d91c1c]",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
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
        <div className={cn("mx-auto flex w-full max-w-[1520px] flex-col gap-8", className)}>
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
        <section className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:px-8 sm:py-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    {eyebrow ? (
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                            {eyebrow}
                        </p>
                    ) : null}
                    <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-[2.25rem]">
                        {title}
                    </h1>
                    {description ? (
                        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-500 sm:text-[15px]">
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
                "overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
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
        <div className={cn("flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between", className)}>
            <div className="flex min-w-0 items-start gap-4">
                {icon ? (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[#d91c1c]">
                        {icon}
                    </div>
                ) : null}
                <div className="min-w-0">
                    <h2 className="text-lg font-black text-slate-900 sm:text-[1.15rem]">{title}</h2>
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
        <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
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
        <div className={cn("rounded-[24px] border px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]", TONE_STYLES[tone])}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    {icon ? (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-current shadow-sm ring-1 ring-black/5">
                            {icon}
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-current/70">
                            {label}
                        </p>
                        <p className="mt-2 text-3xl font-black leading-none text-slate-950">
                            {value}
                        </p>
                    </div>
                </div>
                {trend ? <div className="shrink-0">{trend}</div> : null}
            </div>
            {hint ? (
                <p className="mt-4 text-sm font-medium leading-5 text-slate-500">
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
        <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide", TONE_STYLES[tone], className)}>
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
        <div className={cn("flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm shadow-slate-950/[0.02] transition-colors focus-within:border-[#d91c1c] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#d91c1c]/8", className)}>
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
        <div className={cn("flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]", className)}>
            {icon ? (
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
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
                "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60",
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
                "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d91c1c] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(217,28,28,0.18)] transition-colors hover:bg-[#b91515] disabled:opacity-60",
                className,
            )}
        >
            {children}
        </button>
    );
}
