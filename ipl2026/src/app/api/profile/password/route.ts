import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";
import { requireSessionUser } from "@/lib/session-user";
import { validatePassword, BCRYPT_ROUNDS } from "@/lib/password-policy";

export async function PUT(req: Request) {
  const sessionUser = await requireSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  const cp = String(currentPassword ?? "");
  const np = String(newPassword ?? "");

  const pv = validatePassword(np);
  if (!pv.ok) {
    return NextResponse.json({ detail: pv.message }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({
    _id: new ObjectId(sessionUser.id),
  });
  if (!user?.passwordHash) {
    return NextResponse.json(
      { detail: "Password login is not set for this account" },
      { status: 400 }
    );
  }

  const ok = await bcrypt.compare(cp, user.passwordHash as string);
  if (!ok) {
    return NextResponse.json({ detail: "Current password is incorrect" }, { status: 400 });
  }

  const hash = await bcrypt.hash(np, BCRYPT_ROUNDS);
  await db.collection("users").updateOne(
    { _id: user._id },
    { $set: { passwordHash: hash } }
  );

  return NextResponse.json({ message: "Password updated" });
}
