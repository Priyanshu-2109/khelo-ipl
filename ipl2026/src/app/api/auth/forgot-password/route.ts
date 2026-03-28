import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { getDb } from "@/lib/mongo-client";
import { ensureDbSetup } from "@/lib/mongo-indexes";

function hashOtp(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeEnv(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

async function sendOtpEmail(input: { to: string; otp: string }) {
  const host = normalizeEnv(process.env.SMTP_HOST ?? process.env.EMAIL_HOST);
  const port = Number(
    normalizeEnv(process.env.SMTP_PORT ?? process.env.EMAIL_PORT) ?? 587
  );
  const user = normalizeEnv(process.env.SMTP_USER ?? process.env.EMAIL_USER);
  const pass = normalizeEnv(
    process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? process.env.EMAIL_PASSWORD
  );
  const from = normalizeEnv(process.env.SMTP_FROM ?? process.env.EMAIL_FROM) || user;

  if (!host || !port || !user || !pass || !from) {
    return { ok: false as const, reason: "missing-config" as const };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: "Khelo IPL password reset OTP",
    text: `Your Khelo IPL OTP is ${input.otp}. It expires in 10 minutes.`,
    html: `<p>Your Khelo IPL OTP is <b>${input.otp}</b>.</p><p>It expires in 10 minutes.</p>`,
  });

  return { ok: true as const };
}

export async function POST(req: Request) {
  try {
    const { email: rawEmail } = await req.json();
    const email = String(rawEmail ?? "").toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ detail: "Email is required" }, { status: 400 });
    }

    const db = await getDb();
    await ensureDbSetup(db);
    const user = await db.collection("users").findOne({ email, isActive: true });

    let debug_otp: string | undefined;
    let emailDeliveryError = false;

    if (user) {
      const token = crypto.randomBytes(24).toString("hex");
      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await db.collection("password_reset_tokens").deleteMany({
        userId: user._id,
        used: false,
        kind: "otp",
      });
      await db.collection("password_reset_tokens").insertOne({
        userId: user._id,
        token,
        otpHash,
        kind: "otp",
        expiresAt,
        used: false,
        createdAt: new Date(),
      });

      const sent = await sendOtpEmail({ to: email, otp });
      if (!sent.ok || process.env.NODE_ENV !== "production") {
        debug_otp = otp;
      }
      if (!sent.ok) {
        emailDeliveryError = process.env.NODE_ENV === "production";
        console.warn("[forgot-password] OTP email not sent", {
          reason: sent.reason,
        });
        console.info(`[Khelo IPL] Password reset OTP for ${email}: ${otp}`);
      }
    }

    if (emailDeliveryError) {
      return NextResponse.json(
        { detail: "OTP email service is not configured on server" },
        { status: 503 }
      );
    }

    const body: { message: string; debug_otp?: string } = {
      message: "If the email exists, an OTP has been sent",
    };
    if (process.env.NODE_ENV !== "production" && debug_otp) {
      body.debug_otp = debug_otp;
    }

    return NextResponse.json(body);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ detail: "An error occurred" }, { status: 500 });
  }
}
