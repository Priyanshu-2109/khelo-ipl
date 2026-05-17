import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo-client";
import { requireAdminUser } from "@/lib/session-user";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json(
        { detail: "Admin access required" },
        { status: 403 }
      );
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const actionType = searchParams.get("action"); // e.g., "user_deleted", "user_created", "points_submitted"

    const query: Record<string, unknown> = {};
    if (actionType) {
      query.action_type = actionType;
    }

    const logs = await db
      .collection("audit_logs")
      .find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await db.collection("audit_logs").countDocuments(query);

    return NextResponse.json(
      {
        logs: logs.map((log) => ({
          id: log._id?.toString(),
          action_type: log.action_type,
          action_name: log.action_name,
          target_user_id: log.target_user_id,
          target_user_name: log.target_user_name,
          admin_id: log.admin_id,
          admin_name: log.admin_name,
          details: log.details,
          timestamp: log.timestamp,
        })),
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[admin/logs]", error);
    return NextResponse.json(
      { detail: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
