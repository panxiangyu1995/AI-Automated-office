#!/usr/bin/env node

const { execFileSync } = require("child_process");
const path = require("path");

function getBinary() {
  const platform = process.platform;
  const arch = process.arch;

  let osName, archName;
  switch (platform) {
    case "darwin": osName = "Darwin"; break;
    case "linux": osName = "Linux"; break;
    case "win32": osName = "Windows"; break;
    default:
      console.error(`Unsupported platform: ${platform}`);
      process.exit(1);
  }

  switch (arch) {
    case "x64": archName = "x86_64"; break;
    case "arm64": archName = "aarch64"; break;
    default:
      console.error(`Unsupported architecture: ${arch}`);
      process.exit(1);
  }

  const ext = platform === "win32" ? ".exe" : "";
  const filename = `ao-cli${ext}`;

  const bundledPath = path.join(__dirname, "platform", `${osName}_${archName}`, filename);
  const fs = require("fs");
  if (fs.existsSync(bundledPath)) {
    return bundledPath;
  }

  const gopath = process.env.GOPATH || path.join(require("os").homedir(), "go");
  const globalPath = path.join(gopath, "bin", filename);
  if (fs.existsSync(globalPath)) {
    return globalPath;
  }

  console.error(`ao-cli binary not found.`);
  console.error(`Searched: ${bundledPath}, ${globalPath}`);
  console.error(`Install with: go install or brew install ao-cli`);
  process.exit(1);
}

const binary = getBinary();
const args = process.argv.slice(2);

try {
  execFileSync(binary, args, { stdio: "inherit" });
} catch (e) {
  process.exit(e.status || 1);
}
