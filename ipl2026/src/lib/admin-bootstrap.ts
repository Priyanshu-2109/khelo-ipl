import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongo-client";
import { ensureDbSetup } from "@/lib/mongo-indexes";
import { BCRYPT_ROUNDS, validatePassword } from "@/lib/password-policy";

export async function hasAdminAccount() {
  const db = await getDb();
  await ensureDbSetup(db);
  const count = await db
    .collection("users")
    .countDocuments({ isAdmin: true, isActive: true });
  return count > 0;
}

export async function createInitialAdmin(input: {
  displayName: string;
  email: string;
  password: string;
}) {
  const displayName = input.displayName.trim().replace(/\s+/g, " ");
  const email = input.email.toLowerCase().trim();
  const password = input.password;

  if (displayName.length < 2 || displayName.length > 100) {
    return { ok: false as const, status: 400, detail: "Display name must be 2-100 characters" };
  }

  const pw = validatePassword(password);
  if (!pw.ok) {
    return { ok: false as const, status: 400, detail: pw.message };
  }

  const db = await getDb();
  await ensureDbSetup(db);

  const adminExists = await hasAdminAccount();
  if (adminExists) {
    return {
      ok: false as const,
      status: 409,
      detail: "Admin account already configured",
    };
  }

  const existing = await db.collection("users").findOne({ email });
  if (existing) {
    return {
      ok: false as const,
      status: 409,
      detail: "Email already exists. Use another email for admin setup",
    };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await db.collection("users").insertOne({
    email,
    displayName,
    passwordHash,
    profilePicture: null,
    isAdmin: true,
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    lastLogin: null,
    provider: "credentials",
  });

  return { ok: true as const };
}
