GOPATH ?= $(shell go env GOPATH)
CLI_BIN = ao-cli
CLI_INSTALL_PATH = $(GOPATH)/bin/$(CLI_BIN)
VERSION ?= dev
BUILD_TIME = $(shell date -u +%Y%m%d%H%M%S)

.PHONY: cli api dev test lint clean release release-snapshot help package-skills installer installer-build ao-pack
help:
	@echo "AI-Automated-office 开发命令"
	@echo ""
	@echo "  make cli       编译并安装 ao-cli 到 $(CLI_INSTALL_PATH)"
	@echo "  make api       编译 API 服务到 api/bin/api"
	@echo "  make dev       启动开发环境（Docker + API）"
	@echo "  make test      运行所有测试"
	@echo "  make lint      代码检查（vet + build）"
	@echo "  make clean     清理编译产物"
	@echo "  make package-skills    打包 Skills 为 .skill 文件"
	@echo "  make installer         构建 ao-setup 安装程序"
	@echo "  make release-snapshot  发布预演（不推送）"
	@echo "  make release   正式发布（Homebrew/Scoop/npm）"

cli:
	cd cli && go build -ldflags "-X main.version=$(VERSION) -X main.buildTime=$(BUILD_TIME)" -o $(CLI_INSTALL_PATH) .

api:
	cd api && go build -o bin/api cmd/server/main.go

dev:
	docker compose -f deploy/docker-compose/docker-compose.yml up -d postgres redis
	cd api && go run cmd/server/main.go

test:
	cd api && go test ./...
	cd cli && go test ./...

lint:
	cd api && go vet ./... && go build ./...
	cd cli && go vet ./... && go build ./...

clean:
	rm -f api/bin/api
	rm -f cli/bin/$(CLI_BIN)
	rm -f $(CLI_INSTALL_PATH)
	rm -rf dist/skills
	rm -rf dist/installer

package-skills:
	@mkdir -p dist/skills
	@SKILL_CREATOR=.opencode/skills/skill-creator && \
	PYTHONPATH=$$SKILL_CREATOR python3 $$SKILL_CREATOR/scripts/package_skill.py \
		.opencode/skills/ai-office-api dist/skills/ && \
	echo "Packaged: ai-office-api.skill"

installer-build:
	cd cli/installer && go build -ldflags "-X main.version=$(VERSION)" -o ../../dist/installer/ao-setup .

installer: package-skills
	@mkdir -p dist/installer
	@echo "Building installer for $(VERSION)..."
	cd cli/installer && go build -ldflags "-X main.version=$(VERSION) -X main.buildTime=$(BUILD_TIME)" -o ../../dist/installer/ao-setup .
	@echo "提示: 完整安装包请使用 goreleaser（zip 内含 ao-setup + ao-cli + skills）"

ao-pack:
	@echo "ao-pack tool: 企业定制安装包生成（Phase 4）"

release-snapshot: package-skills
	@echo "本地验证（跳过 Docker，需 buildx 才出镜像）"
	goreleaser release --snapshot --clean --skip docker

release: package-skills
	@echo "正式发布（需 buildx 组件，建议在 CI 执行）"
	bash scripts/release.sh && goreleaser release --clean
