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
                    className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-widest font-semibold mb-6"
                >
                    <ArrowLeft size={16} className="mr-2" /> terug naar voorraad
                </Link>

                <h1 className="text-3xl font-headings text-white mb-2">Nieuw Voertuig Toevoegen</h1>
                <p className="text-gray-400 font-light text-sm">Voer de exacte details in van de nieuwe toevoeging aan uw premium collectie.</p>
            </div>

            <CarForm />
        </div>
    );
}
