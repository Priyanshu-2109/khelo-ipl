import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo-client";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const t = String(token ?? "").trim();
    if (!t) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const db = await getDb();
    const row = await db.collection("password_reset_tokens").findOne({
      token: t,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    return NextResponse.json({ valid: !!row });
  } catch {
    return NextResponse.json({ detail: "Validation failed" }, { status: 400 });
  }
}
