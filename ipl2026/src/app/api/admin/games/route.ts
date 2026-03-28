import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";
import { requireAdminUser } from "@/lib/session-user";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  const db = await getDb();
  const games = await db
    .collection("games")
    .aggregate([
      {
        $lookup: {
          from: "scoring_profiles",
          localField: "scoring_profile_id",
          foreignField: "_id",
          as: "sp",
        },
      },
      { $unwind: { path: "$sp", preserveNullAndEmptyArrays: true } },
      { $sort: { match_date: -1, match_time: -1 } },
      {
        $project: {
          id: { $toString: "$_id" },
          match_name: 1,
          match_date: 1,
          match_time: 1,
          venue: 1,
          scoring_profile_id: { $toString: "$scoring_profile_id" },
          scoring_profile_name: "$sp.name",
          is_completed: { $ifNull: ["$is_completed", false] },
        },
      },
    ])
    .toArray();

  return NextResponse.json({
    games: games.map((g) => ({
      ...g,
      match_date:
        typeof g.match_date === "string"
          ? g.match_date
          : (g.match_date as Date)?.toISOString?.().slice(0, 10),
    })),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  let profileOid: ObjectId;
  try {
    profileOid = body.scoring_profile_id
      ? new ObjectId(String(body.scoring_profile_id))
      : await defaultProfileId(await getDb());
  } catch {
    return NextResponse.json({ detail: "Invalid scoring profile" }, { status: 400 });
  }

  const db = await getDb();
  const r = await db.collection("games").insertOne({
    match_name: body.match_name,
    match_date: body.match_date,
    match_time: body.match_time ?? null,
    venue: body.venue ?? null,
    scoring_profile_id: profileOid,
    is_completed: false,
    createdAt: new Date(),
  });

  return NextResponse.json({ message: "Game created", id: r.insertedId.toString() });
}

async function defaultProfileId(db: import("mongodb").Db) {
  const d = await db
    .collection("scoring_profiles")
    .findOne({ is_default: true });
  if (!d) throw new Error("No default profile");
  return d._id as ObjectId;
}
