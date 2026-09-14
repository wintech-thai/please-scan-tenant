import { COOKIE_NAMES, COOKIE_OPTIONS, TOKEN_EXPIRY } from "@/config/auth.config";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const AUTH = process.env.NEXT_PUBLIC_API_URL!;
// build นี้ (NEXT_PUBLIC_WEB_ROLE=ADMIN) ต้อง refresh ผ่าน AuthAdmin แทน Auth ปกติ
// เพราะ session ที่ login เข้ามาเป็น admin token คนละชนิดกับ org-user token
const REFRESH_PATH =
  process.env.NEXT_PUBLIC_WEB_ROLE === "ADMIN"
    ? "/admin-api/AuthAdmin/org/global/action/Refresh"
    : "/api/Auth/org/temp/action/Refresh";

export async function POST() {
  const cookiesStore = await cookies();
  const rt = cookiesStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  if (!rt) {
    return NextResponse.json(
      { error: "No refresh token" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${AUTH}${REFRESH_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
      cache: "no-store",
    });

    if (response.status === 401) {
      // RT หมดอายุ - ลบ cookies
      cookiesStore.delete(COOKIE_NAMES.ACCESS_TOKEN);
      cookiesStore.delete(COOKIE_NAMES.REFRESH_TOKEN);
      return NextResponse.json(
        { error: "Refresh token expired" },
        { status: 401 }
      );
    }

    if (!response.ok) {
      console.error(`Refresh failed with status ${response.status}`);
      return NextResponse.json(
        { error: "Refresh failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const at = data?.token?.access_token as string | undefined;
    const newRt = data?.token?.refresh_token as string | undefined;
    const expiresIn = data?.token?.expires_in as number | undefined; // in seconds

    if (!at) {
      return NextResponse.json(
        { error: "No access token in response" },
        { status: 500 }
      );
    }

    const now = Date.now();

    // Set access token cookie (use expires_in from API)
    cookiesStore.set({
      name: COOKIE_NAMES.ACCESS_TOKEN,
      value: at,
      ...COOKIE_OPTIONS,
      expires: new Date(
        now + (expiresIn || TOKEN_EXPIRY.DEFAULT_ACCESS_TOKEN_SECONDS) * 1000
      ),
    });

    // Update refresh token if provided
    if (newRt) {
      cookiesStore.set({
        name: COOKIE_NAMES.REFRESH_TOKEN,
        value: String(newRt),
        ...COOKIE_OPTIONS,
        maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_SECONDS,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
