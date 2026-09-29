import type { Prisma } from "@/generated/prisma/client";

export const ADMIN_PAGE_SIZE = 25;
export type SearchParams = Record<string, string | string[] | undefined>;
export function singleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}
export function pageNumber(value: string | string[] | undefined) {
  const number = Number(singleParam(value));
  return Number.isSafeInteger(number) && number > 0 ? Math.min(number, 1_000_000) : 1;
}
export function pageWindow(requested: number, total: number, pageSize = ADMIN_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requested), pages);
  return { page, pages, skip: (page - 1) * pageSize, take: pageSize };
}
export function contactQuery(params: SearchParams) {
  const tab = singleParam(params.tab);
  const activeTab: "alle" | "behandeld" | "nieuw" = tab === "alle" || tab === "behandeld" ? tab : "nieuw";
  const query = singleParam(params.q).trim().slice(0, 120);
  const where: Prisma.ContactWhereInput = {
    ...(activeTab === "alle" ? {} : { read: activeTab === "behandeld" }),
    ...(query ? { OR: ["name", "email", "phone", "message", "car_reference"].map((field) => ({
      [field]: { contains: query, mode: "insensitive" },
    })) } : {}),
  };
  return { activeTab, query, where, requestedPage: pageNumber(params.page) };
}
