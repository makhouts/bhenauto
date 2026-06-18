import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import WorkshopBoardClient from "@/components/admin/WorkshopBoardClient";
import { getWorkshopBoardData } from "@/lib/workshop-board";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.workshopBoard.title} | bhenauto`,
    };
}

export default async function WorkshopBoardPage() {
    await requireAdmin();
    const data = await getWorkshopBoardData();

    return <WorkshopBoardClient appointments={data.appointments} blocks={data.blocks} nowIso={data.nowIso} />;
}
