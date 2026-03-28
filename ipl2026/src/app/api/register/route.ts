import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongo-client";
import { ensureDbSetup } from "@/lib/mongo-indexes";
import { validatePassword } from "@/lib/password-policy";
import { BCRYPT_ROUNDS } from "@/lib/password-policy";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const displayName = String(body.displayName ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const email = String(body.email ?? "")
      .toLowerCase()
      .trim();
    const password = String(body.password ?? "");

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

    const pw = validatePassword(password);
    if (!pw.ok) {
      return NextResponse.json({ detail: pw.message }, { status: 400 });
    }

    const db = await getDb();
    await ensureDbSetup(db);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
      await db.collection("users").insertOne({
        email,
        displayName,
        passwordHash,
        profilePicture: null,
        isAdmin: false,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        lastLogin: null,
        provider: "credentials",
      });
    } catch (e: unknown) {
      const code = (e as { code?: number }).code;
      if (code === 11000) {
        return NextResponse.json(
          { detail: "Email already exists. Please login instead" },
          { status: 409 }
        );
      }
      throw e;
    }

    return NextResponse.json(
      { message: "User registered successfully", email },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { detail: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
