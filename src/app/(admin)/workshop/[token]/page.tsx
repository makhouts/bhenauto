import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WorkshopBoardClient from "@/components/admin/WorkshopBoardClient";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { isValidWorkshopAccessToken } from "@/lib/workshop-access";
import { getWorkshopBoardData } from "@/lib/workshop-board";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.workshopBoard.title} | bhenauto`,
    };
}

export default async function WorkshopSecretBoardPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    if (!isValidWorkshopAccessToken(token)) {
        notFound();
    }

    const data = await getWorkshopBoardData();

    return (
        <WorkshopBoardClient
            appointments={data.appointments}
            blocks={data.blocks}
            nowIso={data.nowIso}
            showAdminLink={false}
        />
    );
}
