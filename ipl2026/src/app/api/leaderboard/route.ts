import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo-client";
import { ensureDbSetup } from "@/lib/mongo-indexes";

export async function GET() {
  try {
    const db = await getDb();
    await ensureDbSetup(db);

    const rows = await db
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
                  matches_played: { $sum: 1 },
                  average_points: { $avg: "$pointsEarned" },
                  best_rank: { $min: "$userRank" },
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
            user_id: { $toString: "$_id" },
            display_name: "$displayName",
            profilePicture: { $ifNull: ["$profilePicture", null] },
            total_points: { $ifNull: ["$stat.total_points", 0] },
            matches_played: { $ifNull: ["$stat.matches_played", 0] },
            average_points: {
              $round: [{ $ifNull: ["$stat.average_points", 0] }, 1],
            },
            best_rank: {
              $let: {
                vars: { br: "$stat.best_rank" },
                in: {
                  $cond: [
                    {
                      $or: [{ $eq: ["$$br", null] }, { $eq: ["$$br", 999] }],
                    },
                    null,
                    "$$br",
                  ],
                },
              },
            },
          },
        },
        {
          $sort: {
            total_points: -1,
            best_rank: 1,
            display_name: 1,
          },
        },
      ])
      .toArray();

    const leaderboard = rows.map((r) => ({
      user_id: r.user_id,
      display_name: r.display_name,
      profilePicture: r.profilePicture,
      total_points: r.total_points,
      matches_played: r.matches_played,
      average_points: r.average_points,
      best_rank: r.best_rank,
    }));

    return NextResponse.json({ leaderboard });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { detail: "An error occurred while fetching leaderboard" },
      { status: 500 }
    );
  }
}
