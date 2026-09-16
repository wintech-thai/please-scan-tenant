/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Same PostgreSQL-backed approach as /api/scan-items-history: onix-api's GetScanTimeline
// endpoint reads from the "AuditLogs" Postgres table (ApiName == "Verify") and already
// returns the exact { data, interval, total } shape this route used to build from an
// Elasticsearch date-histogram aggregation, so no frontend changes are needed.

export const runtime = "nodejs";

const ACCESS_TOKEN = "access_token";
const API = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get("orgId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const searchValue = searchParams.get("searchValue") || "";

    if (!orgId || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const at = cookieStore.get(ACCESS_TOKEN)?.value;
    if (!at) {
      return new Response("Unauthorized", { status: 401 });
    }

    const envRun = process.env.ENV_RUN || process.env.NODE_ENV || "Development";

    const payload = {
      FullTextSearch: searchValue,
      Environment: envRun,
      FromDate: dateFrom,
      ToDate: dateTo,
    };

    const backendRes = await fetch(
      `${API}/api/AuditLog/org/${orgId}/action/GetScanTimeline`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Buffer.from(at, "utf-8").toString("base64")}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    if (!backendRes.ok) {
      const text = await backendRes.text();
      console.error("GetScanTimeline error:", backendRes.status, text);
      return NextResponse.json(
        { error: "Failed to fetch scan timeline" },
        { status: backendRes.status }
      );
    }

    const result = await backendRes.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching scan timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan timeline" },
      { status: 500 }
    );
  }
}
