import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/mongo-client";
import { ensureDbSetup } from "@/lib/mongo-indexes";

export async function POST(req: Request) {
  try {
    const { email: rawEmail } = await req.json();
    const email = String(rawEmail ?? "").toLowerCase().trim();

    const db = await getDb();
    await ensureDbSetup(db);
    const user = await db.collection("users").findOne({ email, isActive: true });

    let debug_token: string | undefined;

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.collection("password_reset_tokens").deleteMany({
        userId: user._id,
        used: false,
      });
      await db.collection("password_reset_tokens").insertOne({
        userId: user._id,
        token,
        expiresAt,
        used: false,
        createdAt: new Date(),
      });
      debug_token = token;
      const base = process.env.AUTH_URL ?? "http://localhost:3000";
      console.info(`[Khelo IPL] Password reset link: ${base}/reset-password?token=${token}`);
    }

    const body: { message: string; debug_token?: string } = {
      message: "If the email exists, a password reset link has been sent",
    };
    if (process.env.NODE_ENV !== "production" && debug_token) {
      body.debug_token = debug_token;
    }

    return NextResponse.json(body);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ detail: "An error occurred" }, { status: 500 });
  }
}
