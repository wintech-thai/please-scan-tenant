/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dayjs from "dayjs";

// Same PostgreSQL-backed approach as /api/log (see that route's comment): onix-api's
// GetScanItemsHistory endpoint reads from the "AuditLogs" Postgres table (filtered to
// ApiName == "Verify" - the hit when someone scans the QR sticker) and already returns
// the exact { total, limit, offset, items: [{id, index, source}] } shape this route used
// to build from an Elasticsearch response, so no frontend changes are needed. geoip
// (country/city) isn't available from Postgres and comes back empty - the table already
// falls back to "-" for those columns.

export const runtime = "nodejs";

const ACCESS_TOKEN = "access_token";
const API = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? "50");
    const offset = Number(searchParams.get("offset") ?? "0");
    const fullTextSearch = searchParams.get("searchValue") || "";
    const dateFrom =
      searchParams.get("dateFrom") || dayjs().startOf("day").toISOString();
    const dateTo =
      searchParams.get("dateTo") || dayjs().endOf("day").toISOString();
    const orgId = searchParams.get("orgId") || "";

    if (!orgId) {
      return NextResponse.json(
        { error: "ORG_ID_REQUIRED", message: "Organization ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const at = cookieStore.get(ACCESS_TOKEN)?.value;
    if (!at) {
      return new Response("Unauthorized", { status: 401 });
    }

    const size = Number.isNaN(limit) || limit <= 0 ? 50 : limit;
    const from = Number.isNaN(offset) || offset < 0 ? 0 : offset;
    const envRun = process.env.ENV_RUN || process.env.NODE_ENV || "Development";

    const payload = {
      FullTextSearch: fullTextSearch,
      Environment: envRun,
      FromDate: dateFrom,
      ToDate: dateTo,
      Offset: from,
      Limit: size,
    };

    const backendRes = await fetch(
      `${API}/api/AuditLog/org/${orgId}/action/GetScanItemsHistory`,
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
      console.error("GetScanItemsHistory error:", backendRes.status, text);
      return NextResponse.json(
        { error: "SCAN_HISTORY_QUERY_FAILED", message: text },
        { status: backendRes.status }
      );
    }

    const result = await backendRes.json();
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Scan history query error:", err);
    return NextResponse.json(
      { error: "SCAN_HISTORY_QUERY_FAILED", message: err.message },
      { status: 500 }
    );
  }
}
