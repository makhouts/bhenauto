"use client";

import { useEffect, useState, useTransition } from "react";
import { Mail, Phone, Calendar, CheckCheck, RotateCcw, Trash2, Car, Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { markContactRead, deleteContact } from "@/app/actions/contacts";
import { toast } from "sonner";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { getAdminDateFnsLocale, tpl } from "@/lib/admin-i18n";

type Tab = "nieuw" | "behandeld" | "alle";

type AdminContact = {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    car_reference: string | null;
    read: boolean;
    createdAt: Date | string;
};

type DeleteTarget = {
    id: string;
    name: string;
} | null;

export default function ContactsClient({ contacts }: { contacts: AdminContact[] }) {
    const { locale, dict } = useAdminI18n();
    const dateLocale = getAdminDateFnsLocale(locale);
    const [activeTab, setActiveTab] = useState<Tab>("nieuw");
    const [isPending, startTransition] = useTransition();
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

    const nieuw = contacts.filter((c) => !c.read);
    const behandeld = contacts.filter((c) => c.read);

    const visible =
        activeTab === "nieuw" ? nieuw :
        activeTab === "behandeld" ? behandeld :
        contacts;

    const tabs: { id: Tab; label: string; count: number; dot?: boolean }[] = [
        { id: "nieuw", label: dict.contacts.tabs.new, count: nieuw.length, dot: nieuw.length > 0 },
        { id: "behandeld", label: dict.contacts.tabs.handled, count: behandeld.length },
        { id: "alle", label: dict.contacts.tabs.all, count: contacts.length },
    ];

    const handleMarkRead = (id: string, read: boolean) => {
        startTransition(async () => {
            const result = await markContactRead(id, read);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(read ? dict.contacts.handledToast : dict.contacts.resetToast);
            }
        });
    };

    useEffect(() => {
        if (!deleteTarget) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isPending) {
                setDeleteTarget(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [deleteTarget, isPending]);

    const openDeleteModal = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        startTransition(async () => {
            const result = await deleteContact(deleteTarget.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(dict.contacts.deleteToast);
                setDeleteTarget(null);
            }
        });
    };

    return (
        <div>
            {/* Tab bar */}
            <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab.id
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {tab.dot && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d91c1c] rounded-full animate-pulse" />
                        )}
                        {tab.label}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            activeTab === tab.id
                                ? tab.id === "nieuw" && nieuw.length > 0
                                    ? "bg-[#d91c1c] text-white"
                                    : "bg-slate-100 text-slate-600"
                                : "bg-slate-200 text-slate-500"
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {visible.length === 0 ? (
                <div className="text-center py-24 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <Mail size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-headings text-slate-900 mb-2 font-bold">
                        {activeTab === "nieuw" ? dict.contacts.empty.new :
                         activeTab === "behandeld" ? dict.contacts.empty.handled :
                         dict.contacts.empty.all}
                    </h3>
                    <p className="text-slate-500 font-medium">
                        {activeTab === "nieuw" ? dict.contacts.empty.newSub : ""}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {visible.map((contact) => (
                        <div
                            key={contact.id}
                            className={`bg-white border rounded-2xl p-6 transition-all ${
                                !contact.read
                                    ? "border-[#d91c1c]/30 shadow-sm shadow-[#d91c1c]/5 ring-1 ring-[#d91c1c]/10"
                                    : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                            {/* Header */}
                            <div className="flex flex-col md:flex-row justify-between mb-4 pb-4 border-b border-slate-100 gap-3">
                                <div className="flex items-start gap-3">
                                    {/* Unread indicator */}
                                    {!contact.read && (
                                        <span className="mt-1.5 w-2.5 h-2.5 bg-[#d91c1c] rounded-full shrink-0" />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-headings text-slate-900 font-bold">{contact.name}</h3>
                                        {contact.car_reference && (
                                            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-[#d91c1c]/10 text-[#d91c1c] text-xs font-bold uppercase tracking-wider rounded-full border border-[#d91c1c]/20">
                                                <Car size={11} />
                                                {contact.car_reference}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="flex items-center text-xs text-slate-400 font-medium mr-2">
                                        <Calendar size={12} className="mr-1.5" />
                                        {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true, locale: dateLocale })}
                                    </span>

                                    {/* Actions */}
                                    <button
                                        onClick={() => handleMarkRead(contact.id, !contact.read)}
                                        disabled={isPending}
                                        title={contact.read ? dict.contacts.markNew : dict.contacts.markHandled}
                                        className={`p-2 rounded-lg transition-colors ${
                                            contact.read
                                                ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                                : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                                        }`}
                                    >
                                        {contact.read ? <RotateCcw size={16} /> : <CheckCheck size={16} />}
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(contact.id, contact.name)}
                                        disabled={isPending}
                                        title={dict.contacts.delete}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Contact details */}
                            <div className="flex flex-wrap gap-x-8 gap-y-2 mb-4">
                                <a
                                    href={`mailto:${contact.email}`}
                                    className="flex items-center text-sm text-slate-600 font-medium hover:text-[#d91c1c] transition-colors"
                                >
                                    <Mail size={14} className="mr-2 text-[#d91c1c]" />
                                    {contact.email}
                                </a>
                                {contact.phone && (
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="flex items-center text-sm text-slate-600 font-medium hover:text-[#d91c1c] transition-colors"
                                    >
                                        <Phone size={14} className="mr-2 text-[#d91c1c]" />
                                        {contact.phone}
                                    </a>
                                )}
                            </div>

                            {/* Message */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed text-sm">{contact.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(2,2,20,0.58)", backdropFilter: "blur(6px)" }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget && !isPending) {
                            setDeleteTarget(null);
                        }
                    }}
                >
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#020214] shadow-2xl shadow-black/30">
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d91c1c]/12 text-[#d91c1c]">
                                    <Trash2 size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d91c1c]">
                                        {dict.contacts.delete}
                                    </p>
                                    <h3 className="text-lg font-black text-white">
                                        {tpl(dict.contacts.deleteConfirm, { name: deleteTarget.name })}
                                    </h3>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isPending}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
                                aria-label={dict.common.close}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300">
                                {locale === "fr"
                                    ? "Cette demande sera supprimée définitivement de l'administration."
                                    : "Deze aanvraag wordt definitief verwijderd uit de administratie."}
                            </div>

                            <div className="mt-5 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={isPending}
                                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-60"
                                >
                                    {dict.common.cancel}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d91c1c] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#b91515] disabled:opacity-60"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            {dict.common.loading}
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={15} />
                                            {dict.contacts.delete}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
