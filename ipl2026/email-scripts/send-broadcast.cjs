#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const process = require("process");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

function normalizeEnv(value) {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function argValue(flag, fallback) {
  const idx = process.argv.findIndex((x) => x === flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function parseRecipientsLimit() {
  const raw = argValue("--limit", "0");
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getActiveUserEmails(db, limit) {
  const cursor = db
    .collection("users")
    .find(
      { isActive: true, email: { $type: "string", $ne: "" } },
      { projection: { email: 1, _id: 0 } },
    )
    .sort({ email: 1 });

  if (limit > 0) {
    cursor.limit(limit);
  }

  const rows = await cursor.toArray();
  const deduped = new Set(
    rows
      .map((r) =>
        String(r.email || "")
          .trim()
          .toLowerCase(),
      )
      .filter((email) => email.length > 3 && email.includes("@")),
  );
  return Array.from(deduped);
}

function getMailerConfig() {
  const host = normalizeEnv(process.env.SMTP_HOST ?? process.env.EMAIL_HOST);
  const port = Number(
    normalizeEnv(process.env.SMTP_PORT ?? process.env.EMAIL_PORT) ?? 587,
  );
  const user = normalizeEnv(process.env.SMTP_USER ?? process.env.EMAIL_USER);
  const pass = normalizeEnv(
    process.env.SMTP_PASS ??
      process.env.SMTP_PASSWORD ??
      process.env.EMAIL_PASSWORD,
  );
  const from =
    normalizeEnv(process.env.SMTP_FROM ?? process.env.EMAIL_FROM) || user;

  if (!host || !port || !user || !pass || !from) {
    throw new Error(
      "SMTP config missing. Set SMTP_HOST/PORT/USER/PASS/FROM (or EMAIL_* fallbacks).",
    );
  }

  return { host, port, user, pass, from };
}

async function main() {
  const dryRun = hasFlag("--dry-run") || !hasFlag("--yes");
  const templatePath = path.resolve(
    process.cwd(),
    argValue("--template", "email-scripts/templates/broadcast.html"),
  );
  const subject = argValue("--subject", "Khelo IPL Update");
  const batchSize = Number(argValue("--batch-size", "50")) || 50;
  const pauseMs = Number(argValue("--pause-ms", "1200")) || 1200;
  const limit = parseRecipientsLimit();
  const logoPath = path.resolve(
    process.cwd(),
    argValue("--logo", "public/kheloipl-logo.png"),
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const html = fs.readFileSync(templatePath, "utf8");
  if (!html.trim()) {
    throw new Error("Template is empty. Add HTML content first.");
  }

  const attachments = [];
  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: path.basename(logoPath),
      path: logoPath,
      cid: "kheloipl-logo",
    });
  }

  const mongoUri = normalizeEnv(process.env.MONGODB_URI);
  const dbName = normalizeEnv(process.env.MONGODB_DB_NAME) || "khelo_ipl";

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment.");
  }

  const mongo = new MongoClient(mongoUri, {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  const mailConfig = getMailerConfig();
  const transporter = nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.port === 465,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass,
    },
  });

  try {
    await mongo.connect();
    const db = mongo.db(dbName);
    const recipients = await getActiveUserEmails(db, limit);

    if (recipients.length === 0) {
      console.log("No active users found with valid email.");
      return;
    }

    console.log(`Recipients: ${recipients.length}`);
    console.log(`Subject: ${subject}`);
    console.log(`Template: ${templatePath}`);
    console.log(`Logo: ${attachments.length ? logoPath : "not attached"}`);
    console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE SEND"}`);

    if (dryRun) {
      console.log("Dry run complete. Add --yes to send mail.");
      return;
    }

    await transporter.verify();

    let sent = 0;
    let failed = 0;

    const batches = chunk(recipients, Math.max(1, batchSize));
    for (let i = 0; i < batches.length; i += 1) {
      const batch = batches[i];
      const jobs = batch.map(async (to) => {
        try {
          await transporter.sendMail({
            from: mailConfig.from,
            to,
            subject,
            html,
            text: "Please view this message in HTML format.",
            attachments,
          });
          sent += 1;
          return;
        } catch (error) {
          failed += 1;
          console.error(
            `Failed: ${to}`,
            error instanceof Error ? error.message : error,
          );
        }
      });

      await Promise.all(jobs);
      console.log(
        `Batch ${i + 1}/${batches.length} done. Sent=${sent}, Failed=${failed}`,
      );

      if (i < batches.length - 1 && pauseMs > 0) {
        await sleep(pauseMs);
      }
    }

    console.log(
      `Completed. Sent=${sent}, Failed=${failed}, Total=${recipients.length}`,
    );
    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await mongo.close();
  }
}

main().catch((error) => {
  console.error(
    "Broadcast failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
