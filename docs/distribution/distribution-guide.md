# Distribution Guide

This document describes how Docker images and CLI binaries are distributed to users.

---

## Docker Images

### Registry

Images are published to **GitHub Container Registry (ghcr.io)**:

| Image | Pull Command |
|-------|-------------|
| API Server | `docker pull ghcr.io/panxiangyu1995/ao-api:latest` |
| CLI | `docker pull ghcr.io/panxiangyu1995/ao-cli:latest` |

### No Docker Account Required

- **Pull**: Anonymous — no login needed for public images
- **Push**: Requires GitHub token with `write:packages` scope (CI only)

### Multi-Architecture

Both `amd64` and `arm64` manifests are built via Docker buildx. Users on any architecture can simply `docker pull ghcr.io/panxiangyu1995/ao-api:latest` — Docker automatically selects the right variant.

### Tag Strategy

| Tag | Purpose |
|-----|---------|
| `latest` | Latest stable release |
| `vX.Y.Z` | Pinned version |
| `vX.Y` | Latest patch for minor version |
| `sha-<commit>` | Exact commit (for debugging) |

### How Images Are Built

GoReleaser builds images during the release workflow (`.github/workflows/release.yml`):

1. Triggered by pushing a `v*` tag (e.g., `git tag v0.1.0 && git push --tags`)
2. GoReleaser compiles Go binaries for linux/amd64 and linux/arm64
3. Builds Docker images with multi-stage Dockerfiles
4. Pushes to ghcr.io
5. Creates multi-arch manifest

---

## CLI Distribution

### 1. Homebrew (macOS / Linux)

**Repository**: [panxiangyu1995/homebrew-tap](https://github.com/panxiangyu1995/homebrew-tap)

GoReleaser automatically pushes the formula on each release.

```bash
brew tap panxiangyu1995/tap
brew install ao-cli
```

**Setup (one-time)**:
1. Create `panxiangyu1995/homebrew-tap` repo on GitHub
2. Generate a PAT with `repo` scope → save as `HOMEBREW_TAP_TOKEN` secret
3. GoReleaser handles the rest

### 2. go install

```bash
go install github.com/panxiangyu1995/cli/cmd/ao-cli@latest
```

Works on any platform with Go installed. No additional setup needed.

### 3. Scoop (Windows)

**Repository**: [panxiangyu1995/scoop-bucket](https://github.com/panxiangyu1995/scoop-bucket)

GoReleaser automatically pushes the manifest on each release.

```bash
scoop bucket add panxiangyu1995 https://github.com/panxiangyu1995/scoop-bucket
scoop install ao-cli
```

**Setup (one-time)**:
1. Create `panxiangyu1995/scoop-bucket` repo on GitHub
2. GoReleaser handles the rest (uses default `GITHUB_TOKEN`)

### 4. GitHub Releases (Binary Download)

GoReleaser uploads binaries for all platforms to GitHub Releases:

| Platform | Format |
|----------|--------|
| macOS (amd64/arm64) | `.tar.gz` |
| Linux (amd64/arm64) | `.tar.gz` |
| Windows (amd64/arm64) | `.zip` |
| Debian/Ubuntu | `.deb` |
| RHEL/Fedora | `.rpm` |
| Alpine | `.apk` |

### 5. npm / npx (Future Consideration)

Not implemented yet. Could be added later by wrapping the Go binary in an npm package for `npx ao-cli` usage.

---

## Release Process

### Automated (Recommended)

```bash
# 1. Update version in code (if needed)
# 2. Commit all changes
git add . && git commit -m "chore+release+prepare v0.1.0"

# 3. Tag the release
git tag -a v0.1.0 -m "Release v0.1.0"

# 4. Push tag (triggers release workflow)
git push origin v0.1.0
```

The release workflow will:
1. Run CI checks (lint, test, build)
2. Build binaries for all platforms
3. Build Docker images (multi-arch)
4. Push images to ghcr.io
5. Push Homebrew formula to tap repo
6. Push Scoop manifest to bucket repo
7. Create GitHub Release with binaries and checksums

### Manual (Emergency)

```bash
# Build locally with GoReleaser
goreleaser release --clean --skip=validate

# Or build Docker image manually
docker build -f deploy/docker-compose/Dockerfile.api -t ghcr.io/panxiangyu1995/ao-api:latest .
docker push ghcr.io/panxiangyu1995/ao-api:latest
```

---

## Required GitHub Secrets

| Secret | Purpose | Scope |
|--------|---------|-------|
| `GITHUB_TOKEN` | Automatic (GitHub Actions) | Push images to ghcr.io, create releases |
| `HOMEBREW_TAP_TOKEN` | PAT for homebrew-tap repo | Push formula to panxiangyu1995/homebrew-tap |

No Docker Hub credentials needed — ghcr.io uses `GITHUB_TOKEN`.
