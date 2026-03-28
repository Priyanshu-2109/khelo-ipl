import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";
import { requireAdminUser } from "@/lib/session-user";

type PointEntry = { user_id: number | string; fantasy_points: number };

export async function POST(req: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const game_id = body.game_id;
  const points = body.points as PointEntry[];
  if (!game_id || !Array.isArray(points)) {
    return NextResponse.json({ detail: "Invalid body" }, { status: 400 });
  }

  let gOid: ObjectId;
  try {
    gOid = new ObjectId(String(game_id));
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
  if (!sp) {
    return NextResponse.json({ detail: "Scoring profile missing" }, { status: 500 });
  }

  const pointDist = (sp.point_distribution ?? {}) as Record<string, number>;
  const isMultiplier = !!sp.is_multiplier;
  const multiplier = Number(sp.multiplier ?? 1);
  const maxRanks = Number(sp.max_ranks ?? 10);

  const sorted = [...points].sort((a, b) => b.fantasy_points - a.fantasy_points);

  await db.collection("match_rankings").deleteMany({ gameId: gOid });

  for (let idx = 0; idx < sorted.length; idx++) {
    const rank = idx + 1;
    const entry = sorted[idx];
    const fantasyPoints = Number(entry.fantasy_points);
    let userOid: ObjectId;
    try {
      userOid = new ObjectId(String(entry.user_id));
    } catch {
      continue;
    }

    let pointsEarned = 0;
    if (isMultiplier) {
      const base =
        rank <= maxRanks ? Number(pointDist[String(rank)] ?? 0) : 0;
      pointsEarned = Math.floor(base * multiplier);
    } else {
      pointsEarned = rank <= maxRanks ? Number(pointDist[String(rank)] ?? 0) : 0;
    }

    await db.collection("match_rankings").insertOne({
      gameId: gOid,
      userId: userOid,
      fantasyPoints,
      userRank: rank,
      pointsEarned,
      createdAt: new Date(),
    });
  }

  await db
    .collection("games")
    .updateOne({ _id: gOid }, { $set: { is_completed: true } });

  return NextResponse.json({ message: "Points submitted successfully" });
}
