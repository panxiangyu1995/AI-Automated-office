# OpenCode Desktop 集成方案：ao-cli + Skills 打包进桌面端

**创建日期**: 2026-08-13
**状态**: ✅ 决策已定（2026-08-13），实施中
**关联铁律**: FR-DESKTOP-001~010、docs/desktop.md、architecture.md §1503「OpenCode 桌面端架构」
**关键冲突发现**: 架构文档假设的 Skill 部署目录（`~/.agents/skills/`）与 opencode 实际扫描机制不符，方案已按实际机制修正

---

## 0. 决策记录（2026-08-13 定稿）

| 决策点 | 结论 | 理由（长远 + 合理角度） |
|--------|------|------------------------|
| D1 实施范围 | **Phase 1+2+3**（打包注入 + CI + 登录引导 UI）；Phase 4（消息轮询/版本检查）列为后续迭代 | 核心闭环是"非技术用户安装→登录→使用"，Phase 1-3 恰好构成该闭环；Phase 4 属增强（CLI poll 已有，desktop 通知框架已有，但非主线） |
| D2 Skill 源 | **完整目录** `.opencode/skills/ai-office-api/`（含 references/16 文件 + html-templates.md） | opencode 原生扫描 SKILL.md 目录格式（事实 7）；references 相对路径可原样引用；无需解包步骤 |
| D3 部署目录 | **`~/.config/opencode/skills/`**（+ opencode.json `skills.paths` 双保险）；同步修正 architecture.md + docs/desktop.md 的 `~/.agents/skills/` 错误假设 | 以 opencode core 实际扫描机制为准（事实 6）；`~/.agents/skills/` 不被 opencode 读取，沿用会直接导致 Skill 不被发现 |
| D4 submodule 分支 | **直接在 opencode fork `dev` 分支实施**（当前 submodule HEAD 54464df）；发布合并 ai-office-main 为后续发布操作 | release-desktop.yml 由 `ref: dev` 触发（事实 14）；opencode AGENTS.md 明确默认分支 dev；避免无谓分支切换冲突 |
| D5 跨仓库构建 | **CI 中 checkout AI-Automated-office 固定 tag**（inputs.version），从源码编译 ao-cli + 复制 skills | 可复现、可控；从 Release 下载依赖已发布产物有滞后且无 tag 对应关系 |
| D6 部署实现 | **TS 移植部署模块**（`desktop/src/main/ai-office.ts`），语义对齐 installer pkg | 单一语言栈、与 onboarding/IPC 天然集成；部署逻辑简单（mkdir/copy/chmod/writeJson） |
| D7 ao-cli 位置 | `~/.ai-office/bin/ao-cli` + SKILL.md fallback 增加该路径 | 用户级可写免管理员权限；SKILL.md 已有 CLI 定位机制（事实 11）；不做 PATH 修改（非交互 shell 不可靠） |
| D8 登录引导 UI | Renderer 新建引导组件（SolidJS），IPC 透传主进程执行 ao-cli init/login/status | 符合 desktop 架构约束（renderer 只调 window.api，main 注册 handler） |

---

## 1. 目的与效果

### 1.1 核心目标

将 **ao-cli 二进制 + 业务 Skills** 集成进 OpenCode Desktop 打包产物（exe/dmg/AppImage/deb/rpm），使**非技术用户**下载安装后即可通过自然语言对话使用全部企业业务功能，无需手动安装 CLI、配置 Agent 环境。

### 1.2 预期效果

```
非技术用户下载安装 AI Office Desktop (exe/dmg)
    ↓
首次启动引导：输入 API 地址 → 登录 → 验证 → 进入对话
    ↓
Agent 自动发现预装业务 Skills（HRM/CRM/IMS/合同/财务等 17 模块）
    ↓
用户对话："帮我看看这个月销售额" / "生成员工花名册报告"
    ↓
Agent 通过 ao-cli skill execute 调用云端 API（CLI 唯一入口铁律）
    ↓
返回 JSON / Markdown / 生成 HTML 交互报告
```

### 1.3 验收效果（可量化）

| # | 验收项 | 判定标准 |
|---|--------|---------|
| E1 | 安装包含 ao-cli | 解包后 `resources/ao-cli` 存在且可执行（`--version` 输出正常） |
| E2 | 安装包含 Skills | 解包后 `resources/skills/ai-office-api/SKILL.md` 存在 |
| E3 | 首次启动部署 | `~/.config/opencode/skills/ai-office-api/SKILL.md` 存在且为最新内容（含本地化章节） |
| E4 | Skill 被发现 | opencode 会话中 ai-office-api 技能可触发（skill list 可见） |
| E5 | CLI 可用 | `ao-cli auth login` 后 `skill execute` 调用云端 API 成功 |
| E6 | 升级覆盖 | 新版本安装后 Skills 覆盖旧版，无残留 |
| E7 | 离线提示 | 无网络时登录引导明确提示，不静默失败（NFR-DESKTOP-005） |
| E8 | 包大小 | ≤300MB（NFR-DESKTOP-001，预计增量 <20MB，无压力） |

---

## 2. 问题点

### 2.1 当前实际状态（验证时间 2026-08-13）

**README 承诺 vs 代码现实存在巨大差距：**

| 承诺（README/docs/desktop.md） | 实际代码 |
|------------------------------|---------|
| "Pre-installed Skills: 15 business modules auto-discovered" | ❌ 未实现：安装包内无任何 Skills |
| "Pre-bundled CLI: ao-cli binary included" | ❌ 未实现：安装包内无 ao-cli 二进制 |
| "CLI-only rule enforced" | ⚠️ 部分：SKILL.md 文档有约束，但无预置 System Prompt 机制 |
| "First Launch: enter API server → login → configure LLM" | ❌ 未实现：onboarding 仅创建空项目目录 |

### 2.2 问题根因

```
设计文档（docs/desktop.md §5-6）定义了完整集成方案
    ↓
但代码实现零落地：
  1. electron-builder extraResources 仅打包 native/（无 ao-cli、无 skills）
  2. release-desktop.yml（opencode fork 仓库）仅标准构建，产物仅改名为 ai-office-desktop-*
  3. onboarding.ts 仅创建默认项目目录
  4. desktop 源码全目录搜索 ai-office/ao-cli 零引用
    ↓
结果：打包出的 exe 是"改名版 OpenCode"，不含任何 AI Office 能力
```

### 2.3 设计-实现冲突（关键）

**架构文档（architecture.md §Skill 预装架构）** 声明 Skill 部署到：
1. `~/.claude/skills/**/SKILL.md`
2. `~/.agents/skills/**/SKILL.md`
3. opencode 配置目录 `{skill,skills}`
4. opencode.json `skills.paths`
5. skills.urls

**但 opencode core 实际扫描机制**（`opencode/packages/core/src/config/plugin/skill.ts:25-29` 已验证）：
- 全局配置目录 `~/.config/opencode/` 下的 `skill/` 与 `skills/` 子目录
- `opencode.json` 中 `skills.paths` 配置的目录
- 项目目录 `.opencode/skills/`
- **`~/.agents/skills/` 不被 opencode 扫描**（是 Claude Code 兼容目录，opencode 不读取）

→ **部署目录必须以 opencode 实际扫描机制为准**（`~/.config/opencode/skills/` + opencode.json `skills.paths`）。

---

## 3. 研究结果（代码实际情况）

### 3.1 已验证事实清单

| # | 事实 | 证据位置 |
|---|------|---------|
| 1 | opencode desktop 是 Electron 壳，通过 sidecar fork utilityProcess 加载 opencode server（`virtual:opencode-server` → `../opencode/dist/node`） | `desktop/src/main/sidecar.ts:57-64`、`electron.vite.config.ts:68` |
| 2 | desktop 构建仅打包 `out/**/*` + `resources/**/*`，extraResources 仅 native/ | `desktop/electron-builder.config.ts:55-62` |
| 3 | resources/ 目录只有图标/entitlements/linux desktop 文件，**无 skills、无 ao-cli** | `desktop/resources/` 目录清单 |
| 4 | release-desktop.yml（opencode fork）只做 build node bundle → electron-builder → 发布，无 ai-office 注入 | `opencode/.github/workflows/release-desktop.yml` |
| 5 | onboarding.ts 仅创建默认项目目录 | `desktop/src/main/onboarding.ts:16-32` |
| 6 | opencode core 扫描 `~/.config/opencode/{skill,skills}` + opencode.json `skills.paths` + 项目 `.opencode/skills`；**不扫 `~/.agents/skills`** | `opencode/packages/core/src/config/plugin/skill.ts:20-40` |
| 7 | skill 加载：目录下 `{*.md, **/SKILL.md}` glob，解析 frontmatter（name/description） | `opencode/packages/core/src/skill.ts:74-105` |
| 8 | **ao-setup 安装器（cli/installer/）已实现完整部署逻辑（可直接复用）**：目录结构 `~/.ao-cli/{bin,config,skills}`、复制二进制、写 `~/.ai-office-cli/config.yaml`、复制技能包、注册 opencode.json skills.paths、AddToPATH、VerifyInstall | `cli/installer/pkg/install.go`、`pkg/config.go`、`pkg/agent.go` |
| 9 | installer 已知 Agent 目录：OpenCode = `~/.config/opencode/skills`（与事实 6 一致） | `cli/installer/pkg/agent.go:24` |
| 10 | goreleaser 已支持 ao-cli 6 平台交叉编译（darwin/linux/windows × amd64/arm64，CGO_ENABLED=0） | `.goreleaser.yaml builds.cli` |
| 11 | SKILL.md 已有 CLI 定位逻辑：`grep cli_path ~/.ai-office-cli/config.yaml` → fallback `/opt/homebrew/bin/ao-cli`、`/usr/local/bin/ao-cli`、`$HOME/go/bin/ao-cli` 等 | `.opencode/skills/ai-office-api/SKILL.md §0` |
| 12 | CLI 配置 `~/.ai-office-cli/config.yaml` 有 `cli_path` 字段（登录/保存时保留） | `cli/internal/config/config.go:21` |
| 13 | desktop 有系统通知框架（updater 通知 + WSL 通知）可复用做消息轮询通知（FR-DESKTOP-008） | `desktop/src/main/` 通知相关模块 |
| 14 | 品牌定制点已部分实现：产物名 `ai-office-desktop-*`、scheme 等 | `release-desktop.yml`、`electron-builder.config.ts` |
| 15 | `.opencode/skills/ai-office-api/` 为 Skill 权威源（含 SKILL.md + 16 个 references + html-templates.md），plugins/ 为 git 跟踪副本 | 本次会话验证 |

### 3.2 可直接复用的现有资产

| 资产 | 用途 | 复用方式 |
|------|------|---------|
| `cli/installer/pkg/*.go` | 部署逻辑（目录/二进制/配置/技能/opencode.json 注册） | **首选**：编译为 desktop 调用的部署 helper 二进制；或移植为 TS |
| `.goreleaser.yaml builds.cli` | ao-cli 6 平台交叉编译矩阵 | release workflow 直接调用 |
| `package_skill.py` | 打包 skill 为 `.skill` 单文件（installer 使用 ai-office-api.skill） | 备选方案 B |
| SKILL.md §0 CLI 定位逻辑 | 让 Agent 找到 ao-cli | 增加 `~/.ai-office/bin/ao-cli` 到 fallback |
| desktop sidecar/server 框架 | opencode server 加载 | 不改 |

---

## 4. 设计方案

### 4.1 总体架构

```
opencode desktop 打包产物 (exe/dmg/AppImage/deb/rpm)
├── resources/ao-cli-{os}-{arch}        ← Go 交叉编译（复用 goreleaser 矩阵）
├── resources/skills/ai-office-api/     ← 权威源 .opencode/skills/ai-office-api/（含 references/ + html-templates.md）
└── 首次启动（onboarding 扩展 → 部署模块）
    ├── ao-cli → ~/.ai-office/bin/ao-cli（chmod +x，macOS codesign 已在构建时完成）
    ├── skills → ~/.config/opencode/skills/ai-office-api/（opencode 原生扫描目录，覆盖更新）
    ├── opencode.json → ~/.config/opencode/opencode.json（合并写入 skills.paths + 保留既有字段）
    ├── opencode.json → LLM Provider 预置（占位，用户填 Key）+ System Prompt（CLI 铁律）
    └── 引导流程：输入 API 地址 → ao-cli init → auth login → auth status 验证 → 完成
```

**调用链不变**：Agent(desktop 内置) → `ao-cli skill execute` → 云端 API。

### 4.2 技术要点

**A. Skills 打包与部署**
- 源：`.opencode/skills/ai-office-api/`（SKILL.md 目录格式，opencode 原生兼容，含 references 相对路径引用——html-templates.md 等）
- 构建时复制到 `desktop/resources/skills/`（electron-builder extraResources 打包进安装包）
- 首次启动复制到 `~/.config/opencode/skills/`（opencode core 扫描目录，事实 6）
- **升级覆盖**：复制前清空目标目录（避免旧版残留）——幂等
- 同时调用 opencode.json `skills.paths` 注册（复用 `cli/installer/pkg/config.go WriteOpenCodeConfig`，保留既有字段）

**B. ao-cli 打包与部署**
- 构建时交叉编译 6 平台（goreleaser 矩阵），命名 `ao-cli-{os}-{arch}`（win 加 .exe）
- electron-builder extraResources 打包进安装包（`to: "ao-cli"`）
- 首次启动复制到 `~/.ai-office/bin/ao-cli`（用户级，免管理员权限；PATH 修改在非交互 shell 不可靠，改用 SKILL.md fallback 定位）
- SKILL.md §0 fallback 列表增加 `$HOME/.ai-office/bin/ao-cli`
- `ao-cli init` 写 `~/.ai-office-cli/config.yaml`（含 cli_path）——复用现有 CLI init 能力

**C. 预置 opencode.json（FR-DESKTOP-005/006）**
- 合并写入（map 方式保留既有字段，复用 `WriteOpenCodeConfig` 模式）：
  - `skills.paths` → 指向 `~/.config/opencode/skills`（或部署目录）
  - LLM Provider 占位（如 deepseek，用户填 API Key）
  - 可选：project 级 AGENTS.md/System Prompt 写 CLI 铁律（"禁止 curl，必须 ao-cli skill execute"）

**D. Onboarding 扩展（FR-DESKTOP-004）**
- 复用现有 onboarding 入口（`isFirstLaunchOnboardingPending`/`finishFirstLaunchOnboarding`）
- 新增引导序列（Renderer 对话框或主进程驱动）：
  1. 欢迎页 → 2. API 服务器地址 → 3. ao-cli init（写配置）→ 4. ao-cli auth login（邮箱+密码）→ 5. auth status 验证 → 6. LLM Provider 配置 → 7. 完成进入对话
- 失败处理：连接失败/登录失败明确提示可重试（NFR-DESKTOP-005）

**E. CI 集成（release-desktop.yml 扩展）**
- 新增 job 或扩展 build-cli：checkout AI-Automated-office → Go 交叉编译 ao-cli × 6 → 复制 skills → 上传 artifact
- build-electron：下载上述 artifact → 放入 `desktop/resources/` → electron-builder 打包
- macOS：ao-cli codesign（ad-hoc 或继承签名脚本模式）；Windows：signtool（复用 sign-windows.ps1 模式）

### 4.3 部署方式决策（关键）

| 决策点 | 选择 | 理由 |
|--------|------|------|
| Skill 部署目录 | `~/.config/opencode/skills/`（+ opencode.json skills.paths 双保险） | opencode 实际扫描机制（事实 6）；与 installer 已有行为一致（事实 9） |
| ao-cli 位置 | `~/.ai-office/bin/ao-cli` | 用户级可写；SKILL.md fallback 定位（事实 11）；免 PATH 修改 |
| Skills 打包格式 | SKILL.md 目录（非 .skill 单文件） | opencode 原生扫描目录格式；references 相对路径可直接引用 |
| 部署时机 | 首次启动（onboarding），非安装时 | 支持升级覆盖；安装器复杂度低 |
| 实现语言 | TypeScript（desktop 主进程），复用 installer pkg 逻辑移植 | 不引入 Go 子进程依赖；部署逻辑简单（copy/mkdir/writeJson） |

---

## 5. 备选方案对比

### 方案 A：opencode.json skills.paths 指向应用资源目录（不复制）
```
opencode.json: "skills": { "paths": ["<app>/resources/skills"] }
```
- ✅ 无复制逻辑，安装包内直接读取
- ❌ **致命缺陷**：macOS 应用资源路径含随机签名（`/Applications/AI Office.app/Contents/Resources/`），且 .app 更新后路径变化；Windows 安装目录用户可改——路径不稳定；升级时应用被替换，配置失效
- ❌ 已弃用（openCode 桌面端设计规范不考虑）

### 方案 B：.skill 单文件打包（复用 package_skill.py + installer 模式）
- ✅ installer（ao-setup）已用此模式（`ai-office-api.skill`）
- ❌ opencode core 对 `.skill` 单文件**无原生解包机制**（事实 7 只扫目录下 md）；需额外解包步骤
- ⚠️ 适用：CLI 安装器场景；**不适用** desktop 直接扫描

### 方案 C：部署 helper 二进制（编译 installer pkg 为独立可执行）
- ✅ 直接复用 Go 代码，零移植
- ❌ 多一个二进制（跨平台编译成本）；部署逻辑与 desktop 状态交互（进度显示）需 IPC 桥接
- ⚠️ 备选：若 TS 移植成本超出预期时启用

### 方案 D（推荐）：TS 移植部署模块 + 首次启动执行
- ✅ 单一语言栈；与 onboarding 天然集成（进度/错误 UI）；依赖 electron-builder extraResources 标准机制
- ✅ 部署逻辑简单（mkdir/copy/chmod/writeJson 各 ~20 行），移植 installer pkg 语义
- ❌ 需维护两份部署语义（installer Go 版 + desktop TS 版）——通过注释互相引用降低漂移

### 结论
**主方案 = D**；若 TS 移植遇到环境差异（如权限/编码），**fallback = C**（编译 installer pkg）。

---

## 6. 实施清单

### Phase 1：资源打包注入（核心，无 UI 改动）⭐ 先做
| # | 任务 | 产出/修改 | 验证 |
|---|------|----------|------|
| 1.1 | 新建 skill 同步脚本：`desktop/scripts/copy-ai-office-assets.ts`——从 AI-Automated-office checkout 目录复制 `.opencode/skills/ai-office-api/` → `desktop/resources/skills/` | 新文件 | 目录结构完整（SKILL.md + references/16 个 + html-templates.md） |
| 1.2 | electron-builder extraResources 增加 ao-cli 与 skills | `desktop/electron-builder.config.ts` | `bun run build` + `electron-builder --dir` 通过 |
| 1.3 | 新建部署模块 `desktop/src/main/ai-office.ts`：`ensureAOCLI()`（复制 ao-cli → `~/.ai-office/bin/` + chmod）、`ensureSkills()`（清空+复制 → `~/.config/opencode/skills/`）、`ensureOpenCodeConfig()`（合并写 opencode.json skills.paths + LLM 占位 + System Prompt） | 新文件 | 单元测试：幂等/覆盖更新/既有字段保留/权限 |
| 1.4 | onboarding.ts 挂载部署模块（`finishFirstLaunchOnboarding` 中调用） | `desktop/src/main/onboarding.ts` | 首次启动后目录断言 |
| 1.5 | SKILL.md §0 CLI fallback 增加 `$HOME/.ai-office/bin/ao-cli` | `.opencode/skills/ai-office-api/SKILL.md` + plugins 同步 | diff 零差异 |

### Phase 2：CI 跨仓库构建
| # | 任务 | 产出/修改 | 验证 |
|---|------|----------|------|
| 2.1 | release-desktop.yml 新增 job：checkout AI-Automated-office → `go build` ao-cli × 6 平台（复用 goreleaser builds.cli 矩阵）→ 复制 skills → upload artifact | `opencode/.github/workflows/release-desktop.yml` | workflow 产出 6 个 `ao-cli-{os}-{arch}` + skills artifact |
| 2.2 | build-electron job：download artifact → 放入 `desktop/resources/` → 打包 | 同上 | 产物解包验证 E1/E2 |
| 2.3 | macOS ao-cli codesign（参考 native codesign 模式）+ Windows signtool | `desktop/scripts/` 或 workflow | codesign 验证通过 |

### Phase 3：Onboarding 登录引导（FR-DESKTOP-004）
| # | 任务 | 产出/修改 | 验证 |
|---|------|----------|------|
| 3.1 | Renderer 引导 UI：欢迎 → API 地址 → 登录（邮箱/密码）→ 验证 → LLM 配置 → 完成 | `desktop/src/renderer/`（新组件）+ IPC | E2E 全新用户路径 |
| 3.2 | 主进程引导逻辑：`ao-cli init` → `ao-cli auth login` → `ao-cli auth status` 验证 | `desktop/src/main/ai-office.ts` 扩展 | 登录成功/失败分支 |
| 3.3 | 失败/离线提示（NFR-DESKTOP-005） | 同上 | E7 |

### Phase 4：增强（FR-DESKTOP-008/009）
| # | 任务 | 产出/修改 | 验证 |
|---|------|----------|------|
| 4.1 | 消息轮询：后台 `ao-cli poll` + 系统通知（复用现有通知框架） | `desktop/src/main/` | 新消息触发通知 |
| 4.2 | CLI/Skill 版本更新检查 → 提示 `ao-cli init --update` | `desktop/src/main/` | 模拟旧版触发提示 |

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 跨仓库构建依赖（desktop 在 opencode fork 构建，skills/CLI 在 AI-Automated-office） | CI 失败 | 显式 checkout AI-Automated-office（固定 tag）；或从 GitHub Release 下载最新产物 |
| macOS notarization：extraResources 中 ao-cli 需签名 | 安装被 Gatekeeper 拦截 | 构建时 codesign（ad-hoc + hardenedRuntime 兼容），参照 native/ 现有签名流程 |
| Windows NSIS：extraResources 路径与执行权限 | ao-cli 不可执行 | 部署时显式 chmod（win 不需要）+ 验证 `--version` |
| TS 部署模块与 installer Go 逻辑漂移 | 行为不一致 | 注释互引；验收 E3/E5 双端覆盖 |
| opencode 上游升级导致扫描机制变化 | skill 不被发现 | 双保险：`~/.config/opencode/skills/` + opencode.json `skills.paths`；验收 E4 常驻 |
| 用户已有 opencode.json（LLM 配置） | 被覆盖丢失 | 合并写入（map 保留既有字段），拒绝覆盖语义（复用 WriteOpenCodeConfig 模式） |

---

## 8. 关联文档

| 文档 | 位置 |
|------|------|
| 本方案 | `.plan/2026-08-13/opencode-desktop集成方案-ao-cli与skills打包.md` |
| 桌面端设计 | `docs/desktop.md`（§5 CLI 打包架构、§6 Onboarding） |
| PRD 桌面端需求 | `_bmad-output/planning-artifacts/prd.md` §28 FR-DESKTOP-001~010 |
| 架构文档桌面端 | `_bmad-output/planning-artifacts/architecture.md` §1503-1730 |
| Skill 权威源 | `.opencode/skills/ai-office-api/`（git 跟踪副本 `plugins/ai-office-api/`） |
| 部署逻辑参考 | `cli/installer/pkg/{install,config,agent,cli}.go` |
| 构建配置 | `.goreleaser.yaml`、`opencode/.github/workflows/release-desktop.yml`、`opencode/packages/desktop/electron-builder.config.ts` |

---

## 9. 待确认决策点

~~以下决策点已由总架构师授权，基于长远与合理角度定稿（见 §0 决策记录）~~ ✅ 已定稿

- ~~1. 实施范围~~ → D1：Phase 1+2+3
- ~~2. Skill 源~~ → D2：完整目录
- ~~3. 架构文档修正~~ → D3：同步修正
- ~~4. submodule 分支~~ → D4：dev 分支
- ~~5. 跨仓库构建~~ → D5：checkout 固定 tag
