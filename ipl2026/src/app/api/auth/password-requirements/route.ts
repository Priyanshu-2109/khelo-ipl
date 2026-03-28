import { NextResponse } from "next/server";
import { passwordRequirementsResponse } from "@/lib/password-policy";

export async function GET() {
  return NextResponse.json(passwordRequirementsResponse());
}
