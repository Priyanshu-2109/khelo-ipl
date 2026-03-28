import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";
import { requireAdminUser } from "@/lib/session-user";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  const { gameId } = await params;
  let oid: ObjectId;
  try {
    oid = new ObjectId(gameId);
  } catch {
    return NextResponse.json({ detail: "Invalid game" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("match_rankings").deleteMany({ gameId: oid });
  await db.collection("games").deleteOne({ _id: oid });
  return NextResponse.json({ message: "Game deleted" });
}
