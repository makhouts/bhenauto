import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { Mail, Phone, Calendar } from "lucide-react";

export const metadata = {
    title: "Inquiries | bhenauto Admin",
};

export default async function ContactsAdminPage() {
    const contacts = await prisma.contact.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div>
            <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-headings text-slate-900 mb-2 font-black">Customer Inquiries</h1>
                    <p className="text-slate-500 font-medium text-sm">Review and manage incoming requests from the public site.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-[#d91c1c] font-bold text-sm shadow-sm">
                    Total: {contacts.length}
                </div>
            </div>

            {contacts.length === 0 ? (
                <div className="text-center py-24 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <Mail size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-headings text-slate-900 mb-2 font-bold">No Inquiries Found</h3>
                    <p className="text-slate-500 font-medium">You don't have any customer messages yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {contacts.map((contact: any) => (
                        <div key={contact.id} className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-[#d91c1c]/30 hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row justify-between mb-4 pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-headings text-slate-900 font-bold">{contact.name}</h3>
                                    {contact.car_reference && (
                                        <div className="mt-2 inline-flex items-center px-3 py-1 bg-[#d91c1c]/10 text-[#d91c1c] text-xs font-bold uppercase tracking-wider rounded-full border border-[#d91c1c]/20">
                                            Inquiry for: {contact.car_reference}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center text-sm text-slate-500 font-medium">
                                    <Calendar size={14} className="mr-2" />
                                    {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="flex items-center text-slate-700 font-medium">
                                    <Mail size={16} className="mr-3 text-[#d91c1c]" />
                                    <a href={`mailto:${contact.email}`} className="hover:text-[#d91c1c] transition-colors">{contact.email}</a>
                                </div>
                                <div className="flex items-center text-slate-700 font-medium">
                                    <Phone size={16} className="mr-3 text-[#d91c1c]" />
                                    {contact.phone ? (
                                        <a href={`tel:${contact.phone}`} className="hover:text-[#d91c1c] transition-colors">{contact.phone}</a>
                                    ) : (
                                        <span className="text-slate-400 italic">Not provided</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{contact.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
