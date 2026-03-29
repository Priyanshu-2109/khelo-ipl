#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const sendScriptPath = path.resolve(
  process.cwd(),
  "email-scripts/send-broadcast.cjs",
);

const templatePath = path.resolve(
  process.cwd(),
  process.argv[2] || "email-scripts/templates/broadcast.html",
);

if (!fs.existsSync(templatePath)) {
  console.error(`Template not found: ${templatePath}`);
  process.exit(1);
}

let timer = null;
let running = false;
let pending = false;

function runSendScript() {
  if (running) {
    pending = true;
    return;
  }
  running = true;

  console.log("\nDetected template update. Sending broadcast...");

  const child = spawn(
    process.execPath,
    [sendScriptPath, "--yes", "--template", templatePath],
    {
      stdio: "inherit",
      shell: false,
    },
  );

  child.on("close", () => {
    running = false;
    if (pending) {
      pending = false;
      runSendScript();
    }
  });
}

function scheduleSend() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(runSendScript, 900);
}

console.log(`Watching: ${templatePath}`);
console.log("On each save, mail will be sent to all active users.");
console.log("Press Ctrl+C to stop.\n");

fs.watch(templatePath, { persistent: true }, (eventType) => {
  if (eventType === "change") {
    scheduleSend();
  }
});
