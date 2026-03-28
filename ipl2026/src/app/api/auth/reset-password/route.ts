import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "@/lib/mongo-client";
import { validatePassword, BCRYPT_ROUNDS } from "@/lib/password-policy";

function hashOtp(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { token, email: rawEmail, otp: rawOtp, password } = await req.json();
    const t = String(token ?? "").trim();
    const email = String(rawEmail ?? "").toLowerCase().trim();
    const otp = String(rawOtp ?? "").trim();
    const pw = String(password ?? "");

    const pv = validatePassword(pw);
    if (!pv.ok) {
      return NextResponse.json({ detail: pv.message }, { status: 400 });
    }

    const db = await getDb();

    let row: {
      _id: any;
      userId: any;
      otpHash?: string;
    } | null = null;

    if (t) {
      row = (await db.collection("password_reset_tokens").findOne({
        token: t,
        used: false,
        expiresAt: { $gt: new Date() },
      })) as typeof row;
    } else {
      if (!email || !otp) {
        return NextResponse.json(
          { detail: "Email and OTP are required" },
          { status: 400 }
        );
      }

      const user = await db.collection("users").findOne({ email, isActive: true });
      if (!user) {
        return NextResponse.json({ detail: "Invalid OTP" }, { status: 400 });
      }

      const otpRow = (await db.collection("password_reset_tokens").findOne(
        {
          userId: user._id,
          kind: "otp",
          used: false,
          expiresAt: { $gt: new Date() },
        },
        { sort: { createdAt: -1 } }
      )) as {
        _id: any;
        userId: any;
        otpHash?: string;
      } | null;

      if (!otpRow?.otpHash || otpRow.otpHash !== hashOtp(otp)) {
        return NextResponse.json({ detail: "Invalid OTP" }, { status: 400 });
      }

      row = otpRow;
    }

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
