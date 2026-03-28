import { NextResponse } from "next/server";
import { createInitialAdmin, hasAdminAccount } from "@/lib/admin-bootstrap";

export async function GET() {
  const configured = await hasAdminAccount();
  return NextResponse.json({ configured });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createInitialAdmin({
      displayName: String(body.displayName ?? ""),
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
    });

    if (!result.ok) {
      return NextResponse.json({ detail: result.detail }, { status: result.status });
    }

    return NextResponse.json({ message: "Admin account created" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { detail: "Failed to setup admin account" },
      { status: 500 }
    );
  }
}
