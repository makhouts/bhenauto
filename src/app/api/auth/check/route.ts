import { NextRequest, NextResponse } from "next/server";
import { isValidSession } from "@/lib/session";

export async function GET(request: NextRequest) {
    const sessionCookie = request.cookies.get("admin_session")?.value;
    const valid = await isValidSession(sessionCookie);

    if (valid) {
        return NextResponse.json({ authenticated: true });
    }
    return NextResponse.json({ authenticated: false }, { status: 401 });
}
