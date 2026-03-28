import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";
import { requireAdminUser } from "@/lib/session-user";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  const { profileId } = await params;
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return NextResponse.json({ detail: "Invalid profile" }, { status: 400 });
  }

  const body = await req.json();
  const $set: Record<string, unknown> = {};
  if (body.name != null) $set.name = body.name;
  if (body.description != null) $set.description = body.description;
  if (body.point_distribution != null) $set.point_distribution = body.point_distribution;
  if (body.is_multiplier != null) $set.is_multiplier = body.is_multiplier;
  if (body.multiplier != null) $set.multiplier = body.multiplier;
  if (body.max_ranks != null) $set.max_ranks = body.max_ranks;

  const db = await getDb();
  await db.collection("scoring_profiles").updateOne({ _id: oid }, { $set });
  return NextResponse.json({ message: "Profile updated" });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  const { profileId } = await params;
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return NextResponse.json({ detail: "Invalid profile" }, { status: 400 });
  }

  const db = await getDb();
  const prof = await db.collection("scoring_profiles").findOne({ _id: oid });
  if (prof?.is_default) {
    return NextResponse.json({ detail: "Cannot delete default profile" }, { status: 400 });
  }

  await db.collection("scoring_profiles").deleteOne({ _id: oid, is_default: { $ne: true } });
  return NextResponse.json({ message: "Profile deleted" });
}
