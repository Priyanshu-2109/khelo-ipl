import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongo-client";
import { validatePassword, BCRYPT_ROUNDS } from "@/lib/password-policy";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    const t = String(token ?? "").trim();
    const pw = String(password ?? "");

    const pv = validatePassword(pw);
    if (!pv.ok) {
      return NextResponse.json({ detail: pv.message }, { status: 400 });
    }

    const db = await getDb();
    const row = await db.collection("password_reset_tokens").findOne({
      token: t,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!row) {
      return NextResponse.json({ detail: "Invalid or expired token" }, { status: 400 });
    }

    const hash = await bcrypt.hash(pw, BCRYPT_ROUNDS);
    await db.collection("users").updateOne(
      { _id: row.userId },
      { $set: { passwordHash: hash } }
    );
    await db.collection("password_reset_tokens").updateOne(
      { _id: row._id },
      { $set: { used: true } }
    );

    return NextResponse.json({ message: "Password reset successful" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ detail: "An error occurred" }, { status: 500 });
  }
}
