"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  isValidPlatformSession,
  PLATFORM_ADMIN_SESSION_COOKIE,
} from "@/lib/session";

export async function requirePlatformAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get(PLATFORM_ADMIN_SESSION_COOKIE);

  if (!(await isValidPlatformSession(session?.value))) {
    redirect("/login");
  }
}
