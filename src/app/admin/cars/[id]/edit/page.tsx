import CarForm from "@/components/admin/CarForm";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Voertuig Bewerken | bhenauto Admin",
};

export default async function EditCarPage(
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const car = await prisma.car.findUnique({
        where: { id: params.id },
        include: { images: true },
    });

    if (!car) {
        notFound();
    }

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/admin/cars"
                    className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-widest font-semibold mb-6"
                >
                    <ArrowLeft size={16} className="mr-2" /> terug naar voorraad
                </Link>

                <h1 className="text-3xl font-headings text-white mb-2">Voertuigdetails Bewerken</h1>
                <p className="text-gray-400 font-light text-sm">Werk de specifieke gegevens bij van {car.year} {car.brand} {car.model}</p>
            </div>

            <CarForm initialData={car} />
        </div>
    );
}
