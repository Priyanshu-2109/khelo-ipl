import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";
import { requireAdminUser } from "@/lib/session-user";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  const { gameId } = await params;
  let gOid: ObjectId;
  try {
    gOid = new ObjectId(gameId);
  } catch {
    return NextResponse.json({ detail: "Invalid game" }, { status: 400 });
  }

  const db = await getDb();
  const game = await db.collection("games").findOne({ _id: gOid });
  if (!game) {
    return NextResponse.json({ detail: "Game not found" }, { status: 404 });
  }

  const sp = await db.collection("scoring_profiles").findOne({
    _id: game.scoring_profile_id as ObjectId,
  });

  const rankings = await db
    .collection("match_rankings")
    .aggregate([
      { $match: { gameId: gOid } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "u",
        },
      },
      { $unwind: "$u" },
      {
        $project: {
          user_id: { $toString: "$userId" },
          display_name: "$u.displayName",
          fantasy_points: "$fantasyPoints",
          user_rank: "$userRank",
          points_earned: "$pointsEarned",
        },
      },
      { $sort: { fantasy_points: -1, display_name: 1 } },
    ])
    .toArray();

  const users = await db
    .collection("users")
    .find({ isActive: true })
    .project({ displayName: 1 })
    .sort({ displayName: 1 })
    .toArray();

  return NextResponse.json({
    game: {
      id: game._id.toString(),
      match_name: game.match_name,
      point_distribution: sp?.point_distribution ?? {},
      is_multiplier: !!sp?.is_multiplier,
      multiplier: Number(sp?.multiplier ?? 1),
      max_ranks: Number(sp?.max_ranks ?? 10),
    },
    rankings,
    users: users.map((u) => ({
      id: u._id.toString(),
      display_name: u.displayName,
    })),
  });
}
