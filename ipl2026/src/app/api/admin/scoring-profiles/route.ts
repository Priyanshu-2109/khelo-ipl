import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo-client";
import { requireAdminUser } from "@/lib/session-user";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  const db = await getDb();
  const docs = await db
    .collection("scoring_profiles")
    .find({})
    .sort({ is_default: -1, name: 1 })
    .toArray();

  const profiles = docs.map((row) => ({
    id: row._id.toString(),
    name: row.name,
    description: row.description ?? "",
    is_default: !!row.is_default,
    point_distribution: row.point_distribution as Record<string, number>,
    is_multiplier: !!row.is_multiplier,
    multiplier: Number(row.multiplier ?? 1),
    max_ranks: Number(row.max_ranks ?? 10),
  }));

  return NextResponse.json({ profiles });
}

export async function POST(req: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const db = await getDb();
  const r = await db.collection("scoring_profiles").insertOne({
    name: body.name,
    description: body.description ?? "",
    point_distribution: body.point_distribution ?? {},
    is_multiplier: !!body.is_multiplier,
    multiplier: Number(body.multiplier ?? 1),
    max_ranks: Number(body.max_ranks ?? 10),
    is_default: false,
    createdAt: new Date(),
  });

  return NextResponse.json({ message: "Scoring profile created", id: r.insertedId.toString() });
}
