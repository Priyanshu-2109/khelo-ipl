import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";
import { requireSessionUser } from "@/lib/session-user";

const MAX_B64 = 2 * 1024 * 1024 * 1.4;

export async function PUT(req: Request) {
  const sessionUser = await requireSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profilePicture } = await req.json();
  const b64 = String(profilePicture ?? "");
  if (!b64.startsWith("data:image/")) {
    return NextResponse.json({ detail: "Invalid image data" }, { status: 400 });
  }
  if (b64.length > MAX_B64) {
    return NextResponse.json({ detail: "Image too large (max 2MB)" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(sessionUser.id) },
    { $set: { profilePicture: b64 } }
  );

  return NextResponse.json({ message: "Profile picture updated" });
}

export async function DELETE() {
  const sessionUser = await requireSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(sessionUser.id) },
    { $unset: { profilePicture: "" } }
  );

  return NextResponse.json({ message: "Profile picture removed" });
}
