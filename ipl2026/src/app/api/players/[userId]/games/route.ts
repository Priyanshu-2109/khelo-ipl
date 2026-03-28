import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    let oid: ObjectId;
    try {
      oid = new ObjectId(userId);
    } catch {
      return NextResponse.json({ detail: "Invalid player id" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ _id: oid });
    if (!user) {
      return NextResponse.json({ detail: "Player not found" }, { status: 404 });
    }

    const matches = await db
      .collection("match_rankings")
      .aggregate([
        { $match: { userId: oid } },
        {
          $lookup: {
            from: "games",
            localField: "gameId",
            foreignField: "_id",
            as: "game",
          },
        },
        { $unwind: "$game" },
        {
          $project: {
            _id: 1,
            match_name: "$game.match_name",
            match_date: "$game.match_date",
            user_rank: "$userRank",
            points: "$pointsEarned",
          },
        },
        { $sort: { match_date: -1 } },
      ])
      .toArray();

    const out = matches.map((m) => ({
      id: (m._id as ObjectId).toString(),
      match_name: m.match_name,
      match_date: m.match_date,
      user_rank: m.user_rank,
      points: m.points,
    }));

    return NextResponse.json({ matches: out });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { detail: "Failed to fetch player games" },
      { status: 500 }
    );
  }
}
