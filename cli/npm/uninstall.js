#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const platformDir = path.join(__dirname, "platform");
if (fs.existsSync(platformDir)) {
  fs.rmSync(platformDir, { recursive: true, force: true });
  console.log("ao-cli binary removed.");
}
