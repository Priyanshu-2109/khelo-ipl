import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo-client";
import { requireAdminUser } from "@/lib/session-user";
import { ObjectId } from "mongodb";

type Params = { params: Promise<{ userId: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json(
        { detail: "Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { detail: "User ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Convert string userId to ObjectId if needed
    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch {
      return NextResponse.json(
        { detail: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Delete user from users collection
    const deleteResult = await db.collection("users").deleteOne({
      _id: userObjectId,
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { detail: "User not found" },
        { status: 404 }
      );
    }

    // Optional: Clean up related user data
    // You can uncomment and add more cleanup as needed
    // await db.collection("player_matches").deleteMany({ userId: userObjectId });
    // await db.collection("password_reset_tokens").deleteMany({ userId: userObjectId });

    return NextResponse.json(
      { message: "User deleted successfully", userId },
      { status: 200 }
    );
  } catch (error) {
    console.error("[admin/users/delete]", error);
    return NextResponse.json(
      { detail: "User deletion failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  // Support DELETE verb as well
  return POST(_, { params });
}
