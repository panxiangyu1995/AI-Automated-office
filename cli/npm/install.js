#!/usr/bin/env node

const https = require("https");
const fs = require("fs");
const path = require("path");
const { chmod } = require("fs/promises");

const GITHUB_OWNER = "panxiangyu1995";
const GITHUB_REPO = "AI-Automated-office";

function getPlatformInfo() {
  const platform = process.platform;
  const arch = process.arch;

  let osName, archName;
  switch (platform) {
    case "darwin": osName = "Darwin"; break;
    case "linux": osName = "Linux"; break;
    case "win32": osName = "Windows"; break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  switch (arch) {
    case "x64": archName = "x86_64"; break;
    case "arm64": archName = "aarch64"; break;
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }

  const ext = platform === "win32" ? ".zip" : ".tar.gz";
  const archiveName = `ai-automated-office-cli_${osName}_${archName}${ext}`;

  return { osName, archName, archiveName, platform, ext };
}

function getLatestVersion() {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
    https.get(url, { headers: { "User-Agent": "ao-cli-npm" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const release = JSON.parse(data);
          resolve(release);
        } catch (e) {
          reject(new Error("Failed to parse GitHub release response"));
        }
      });
    }).on("error", reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (url) => {
      https.get(url, { headers: { "User-Agent": "ao-cli-npm" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }
        const stream = fs.createWriteStream(dest);
        res.pipe(stream);
        stream.on("finish", () => { stream.close(); resolve(); });
        stream.on("error", reject);
      }).on("error", reject);
    };
    follow(url);
  });
}

function extractArchive(archivePath, destDir, ext) {
  const { execSync } = require("child_process");
  fs.mkdirSync(destDir, { recursive: true });

  if (ext === ".zip") {
    execSync(`unzip -o "${archivePath}" -d "${destDir}"`, { stdio: "pipe" });
  } else {
    execSync(`tar xzf "${archivePath}" -C "${destDir}"`, { stdio: "pipe" });
  }
}

async function main() {
  try {
    const info = getPlatformInfo();
    const platformDir = path.join(__dirname, "platform", `${info.osName}_${info.archName}`);
    const binaryName = info.platform === "win32" ? "ao-cli.exe" : "ao-cli";
    const binaryPath = path.join(platformDir, binaryName);

    if (fs.existsSync(binaryPath)) {
      console.log("ao-cli binary already installed, skipping download.");
      return;
    }

    console.log("Fetching latest release...");
    const release = await getLatestVersion();
    const version = release.tag_name.replace(/^v/, "");
    console.log(`Latest version: ${version}`);

    const asset = release.assets.find((a) => a.name === info.archiveName);
    if (!asset) {
      console.log(`No prebuilt binary found for ${info.osName}_${info.archName}.`);
      console.log("Falling back to go install...");
      const { execSync } = require("child_process");
      try {
        execSync("go install github.com/panxiangyu1995/AI-Automated-office/cli@latest", {
          stdio: "inherit",
          env: { ...process.env, GOBIN: path.join(__dirname, "platform", `${info.osName}_${info.archName}`) },
        });
        console.log("Installed via go install.");
      } catch (e) {
        console.error("go install failed. Please install Go first: https://go.dev/dl/");
        process.exit(1);
      }
      return;
    }

    console.log(`Downloading ${asset.name}...`);
    const tmpDir = path.join(__dirname, ".tmp");
    fs.mkdirSync(tmpDir, { recursive: true });
    const archivePath = path.join(tmpDir, asset.name);

    await downloadFile(asset.browser_download_url, archivePath);
    console.log("Extracting...");
    extractArchive(archivePath, tmpDir, info.ext);

    fs.mkdirSync(platformDir, { recursive: true });
    const extractedBinary = path.join(tmpDir, binaryName);
    if (fs.existsSync(extractedBinary)) {
      fs.copyFileSync(extractedBinary, binaryPath);
      await chmod(binaryPath, 0o755);
    } else {
      const entries = fs.readdirSync(tmpDir, { recursive: true });
      const found = entries.find((e) => e.endsWith(binaryName));
      if (found) {
        fs.copyFileSync(path.join(tmpDir, found), binaryPath);
        await chmod(binaryPath, 0o755);
      } else {
        console.error("Could not find ao-cli binary in archive.");
        process.exit(1);
      }
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(`ao-cli v${version} installed successfully!`);
  } catch (e) {
    console.error(`Install error: ${e.message}`);
    console.error("You can manually install: go install github.com/panxiangyu1995/AI-Automated-office/cli@latest");
    process.exit(1);
  }
}

main();
