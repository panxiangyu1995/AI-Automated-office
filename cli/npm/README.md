# ao-cli npm wrapper

This npm package wraps the `ao-cli` Go binary for users who prefer npm-based installation.

## Install

```bash
npm install -g ao-cli
```

The postinstall script automatically downloads the correct prebuilt binary from GitHub Releases for your platform (macOS/Linux/Windows, x64/arm64).

If no prebuilt binary is available, it falls back to `go install`.

## Usage

```bash
ao-cli --help
ao-cli auth login
ao-cli skill execute hrm_employee_list
```

## Supported Platforms

| OS | Architecture |
|----|-------------|
| macOS (Darwin) | x86_64, aarch64 |
| Linux | x86_64, aarch64 |
| Windows | x86_64, aarch64 |

## Alternative Install Methods

- **Homebrew (macOS/Linux)**: `brew install panxiangyu1995/tap/ao-cli`
- **Scoop (Windows)**: `scoop bucket add panxiangyu1995/scoop-bucket && scoop install ao-cli`
- **Go install**: `go install github.com/panxiangyu1995/AI-Automated-office/cli@latest`
- **DEB/RPM/APK**: Download from [GitHub Releases](https://github.com/panxiangyu1995/AI-Automated-office/releases)
