import type { Db } from "mongodb";

const DEFAULT_DIST = {
  "1": 25,
  "2": 18,
  "3": 15,
  "4": 12,
  "5": 10,
  "6": 8,
  "7": 6,
  "8": 4,
  "9": 2,
  "10": 1,
};

export async function ensureDbSetup(db: Db) {
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("password_reset_tokens").createIndex({ token: 1 }, { unique: true });

  const count = await db.collection("scoring_profiles").countDocuments();
  if (count === 0) {
    await db.collection("scoring_profiles").insertOne({
      name: "Standard IPL",
      description: "Default top-10 distribution",
      is_default: true,
      point_distribution: DEFAULT_DIST,
      is_multiplier: false,
      multiplier: 1,
      max_ranks: 10,
      createdAt: new Date(),
    });
  }
}
