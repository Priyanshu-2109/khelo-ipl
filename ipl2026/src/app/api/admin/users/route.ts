import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo-client";
import { requireAdminUser } from "@/lib/session-user";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json(
        { detail: "Admin access required" },
        { status: 403 }
      );
    }

    const db = await getDb();
    const users = await db
      .collection("users")
      .aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "match_rankings",
            let: { uid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },
              {
                $group: {
                  _id: null,
                  total_points: { $sum: "$pointsEarned" },
                },
              },
            ],
            as: "stats",
          },
        },
        {
          $set: {
            stat: { $arrayElemAt: ["$stats", 0] },
          },
        },
        {
          $project: {
            _id: 0,
            id: { $toString: "$_id" },
            display_name: { $ifNull: ["$displayName", "User"] },
            profilePicture: { $ifNull: ["$profilePicture", null] },
            total_points: { $ifNull: ["$stat.total_points", 0] },
            is_admin: { $ifNull: ["$isAdmin", false] },
          },
        },
        {
          $sort: {
            total_points: -1,
            display_name: 1,
          },
        },
      ])
      .toArray();

    return NextResponse.json(
      {
        users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[admin/users]", error);
    return NextResponse.json(
      { detail: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
