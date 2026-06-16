"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getClientIp } from "@core/http/request-ip";
import { constantTimePasswordMatch } from "@core/auth/password";
import {
  createPlatformSessionToken,
  PLATFORM_ADMIN_SESSION_COOKIE,
  PLATFORM_ADMIN_SESSION_MAX_AGE,
} from "@/lib/session";

const loginAttempts = new Map<string, number[]>();
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_MAX_ATTEMPTS = 5;

export type LoginActionState = {
  error: string | null;
};

function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = loginAttempts.get(ip)?.filter((timestamp) => now - timestamp < LOGIN_WINDOW_MS) ?? [];
  if (timestamps.length >= LOGIN_MAX_ATTEMPTS) {
    return true;
  }

  timestamps.push(now);
  loginAttempts.set(ip, timestamps);
  return false;
}

export async function login(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const password = (formData.get("password") as string | null) ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    return {
      error: "ADMIN_PASSWORD or ADMIN_SESSION_SECRET is missing.",
    };
  }

  const headerStore = await headers();
  const ip = getClientIp(headerStore);

  if (isLoginRateLimited(ip)) {
    return {
      error: "Too many login attempts from this IP. Try again in 15 minutes.",
    };
  }

  if (!constantTimePasswordMatch(password, adminPassword)) {
    return {
      error: "Invalid password.",
    };
  }

  const sessionToken = await createPlatformSessionToken(sessionSecret);
  const cookieStore = await cookies();
  cookieStore.set(PLATFORM_ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: PLATFORM_ADMIN_SESSION_MAX_AGE,
    path: "/",
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(PLATFORM_ADMIN_SESSION_COOKIE);
  redirect("/login");
}
