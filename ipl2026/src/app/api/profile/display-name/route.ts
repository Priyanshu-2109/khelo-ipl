import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";
import { requireSessionUser } from "@/lib/session-user";

export async function PUT(req: Request) {
  const sessionUser = await requireSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { displayName: raw } = await req.json();
  const displayName = String(raw ?? "").trim();
  if (displayName.length < 2) {
    return NextResponse.json(
      { detail: "Display name must be at least 2 characters" },
      { status: 400 }
    );
  }
  if (displayName.length > 100) {
    return NextResponse.json(
      { detail: "Display name must be less than 100 characters" },
      { status: 400 }
    );
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(sessionUser.id) },
    { $set: { displayName } }
  );

  return NextResponse.json({ message: "Display name updated" });
}
