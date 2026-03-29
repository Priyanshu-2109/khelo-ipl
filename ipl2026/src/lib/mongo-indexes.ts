import type { Db } from "mongodb";

const DEFAULT_DIST = {
  "1": 35,
  "2": 30,
  "3": 25,
  "4": 20,
  "5": 15,
  "6": 10,
  "7": 5,
  "8": 0,
  "9": 0,
  "10": 0,
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

  // Keep the default profile aligned with product scoring rules.
  await db.collection("scoring_profiles").updateOne(
    { is_default: true, name: "Standard IPL" },
    {
      $set: {
        description: "Default top-10 distribution",
        point_distribution: DEFAULT_DIST,
        max_ranks: 10,
        is_multiplier: false,
        multiplier: 1,
      },
    }
  );
}
