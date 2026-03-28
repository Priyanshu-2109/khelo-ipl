import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";
import { requireSessionUser } from "@/lib/session-user";

export async function GET() {
  const sessionUser = await requireSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  let user;
  try {
    user = await db.collection("users").findOne({
      _id: new ObjectId(sessionUser.id),
      isActive: true,
    });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: (user._id as ObjectId).toString(),
      displayName: user.displayName,
      email: user.email,
      isAdmin: !!(user as { isAdmin?: boolean }).isAdmin,
      createdAt: user.createdAt ? new Date(user.createdAt as Date).toISOString() : null,
      lastLogin: user.lastLogin ? new Date(user.lastLogin as Date).toISOString() : null,
      profilePicture: user.profilePicture ?? null,
    },
  });
}
