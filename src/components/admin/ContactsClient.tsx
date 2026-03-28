"use client";

import { useState, useTransition } from "react";
import { Mail, Phone, Calendar, CheckCheck, RotateCcw, Trash2, Car } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { markContactRead, deleteContact } from "@/app/actions/contacts";
import { toast } from "sonner";

type Tab = "nieuw" | "behandeld" | "alle";

export default function ContactsClient({ contacts }: { contacts: any[] }) {
    const [activeTab, setActiveTab] = useState<Tab>("nieuw");
    const [isPending, startTransition] = useTransition();

    const nieuw = contacts.filter((c) => !c.read);
    const behandeld = contacts.filter((c) => c.read);

    const visible =
        activeTab === "nieuw" ? nieuw :
        activeTab === "behandeld" ? behandeld :
        contacts;

    const tabs: { id: Tab; label: string; count: number; dot?: boolean }[] = [
        { id: "nieuw", label: "Nieuwe aanvragen", count: nieuw.length, dot: nieuw.length > 0 },
        { id: "behandeld", label: "Behandelde aanvragen", count: behandeld.length },
        { id: "alle", label: "Alle aanvragen", count: contacts.length },
    ];

    const handleMarkRead = (id: string, read: boolean) => {
        startTransition(async () => {
            const result = await markContactRead(id, read);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(read ? "Aanvraag gemarkeerd als behandeld." : "Aanvraag teruggezet naar nieuw.");
            }
        });
    };

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Aanvraag van ${name} verwijderen?`)) return;
        startTransition(async () => {
            const result = await deleteContact(id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Aanvraag verwijderd.");
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
                        {activeTab === "nieuw" ? "Geen nieuwe aanvragen" :
                         activeTab === "behandeld" ? "Geen behandelde aanvragen" :
                         "Geen aanvragen gevonden"}
                    </h3>
                    <p className="text-slate-500 font-medium">
                        {activeTab === "nieuw" ? "Alle aanvragen zijn afgehandeld." : ""}
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
                                        {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true, locale: nl })}
                                    </span>

                                    {/* Actions */}
                                    <button
                                        onClick={() => handleMarkRead(contact.id, !contact.read)}
                                        disabled={isPending}
                                        title={contact.read ? "Zet terug naar nieuw" : "Markeer als behandeld"}
                                        className={`p-2 rounded-lg transition-colors ${
                                            contact.read
                                                ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                                : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                                        }`}
                                    >
                                        {contact.read ? <RotateCcw size={16} /> : <CheckCheck size={16} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(contact.id, contact.name)}
                                        disabled={isPending}
                                        title="Verwijderen"
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
        </div>
    );
}
