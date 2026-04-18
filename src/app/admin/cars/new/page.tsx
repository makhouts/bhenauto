import CarForm from "@/components/admin/CarForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Voertuig Toevoegen | bhenauto Admin",
};

export default function NewCarPage() {
    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/admin/cars"
                    className="inline-flex items-center text-slate-400 hover:text-[#d91c1c] transition-colors text-sm uppercase tracking-widest font-semibold mb-6"
                >
                    <ArrowLeft size={16} className="mr-2" /> terug naar voorraad
                </Link>

                <h1 className="text-[2rem] font-headings font-black text-slate-900 tracking-tight mb-2">Nieuw Voertuig Toevoegen</h1>
                <p className="text-slate-500 font-medium text-sm">Voer de exacte details in van de nieuwe toevoeging aan uw premium collectie.</p>
            </div>

            <CarForm />
        </div>
    );
}
