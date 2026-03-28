import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo-client";

export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json({ status: "healthy", database: "connected" });
  } catch (e) {
    return NextResponse.json(
      { status: "unhealthy", error: String(e) },
      { status: 500 }
    );
  }
}
