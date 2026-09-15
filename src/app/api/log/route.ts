/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dayjs from "dayjs";

// Same PostgreSQL-backed audit log approach used in Please ERP / Please Payment:
// onix-api's QueryAuditLogs endpoint reads from the "AuditLogs" Postgres table
// and maps each row into the same shape an Elasticsearch document would have
// (see AuditLogController.MapToEsFormat in onix-v2-api), so the response here
// is reshaped into the exact { total, limit, offset, items: [{id, index, source}] }
// contract the existing frontend already expects — no UI changes needed.

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
        {
          error: "ORG_ID_REQUIRED",
          message: "Organization ID is required",
        },
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

    // Only ever query this deployment's own environment — dev/prod audit
    // logs (including the ones please-scan-verify now writes via Redis)
    // share one Postgres table, so this is the key that keeps them apart.
    const envRun = process.env.ENV_RUN || process.env.NODE_ENV || "Development";

    const payload = {
      FullTextSearch: fullTextSearch,
      Environment: envRun,
      FromDate: dateFrom,
      ToDate: dateTo,
      Offset: Math.floor(from / size) + 1,
      Limit: size,
      ReturnDocs: true,
    };

    const backendRes = await fetch(
      `${API}/api/AuditLog/org/${orgId}/action/QueryAuditLogs`,
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
      console.error("QueryAuditLogs error:", backendRes.status, text);
      return NextResponse.json(
        { error: "AUDIT_LOG_QUERY_FAILED", message: text },
        { status: backendRes.status }
      );
    }

    const result = await backendRes.json();

    const items = (result.data || []).map((doc: any) => ({
      id: doc.id || doc._id,
      index: "audit-logs",
      source: doc,
    }));

    return NextResponse.json(
      {
        total: result.total ?? 0,
        limit: size,
        offset: from,
        items,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Audit log query error:", err);
    return NextResponse.json(
      {
        error: "AUDIT_LOG_QUERY_FAILED",
        message: err.message,
      },
      { status: 500 }
    );
  }
}
