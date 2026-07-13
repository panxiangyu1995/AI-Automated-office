# AI Office Desktop — 方案文档

## 1. 产品定位

AI Office Desktop 是基于 [OpenCode](https://github.com/anomalyco/opencode)（MIT 协议）的预封装桌面应用，解决非技术用户无法自行安装 CLI 和配置 Agent 环境的问题。

> **桌面端是 ao-cli 的图形化载体，不是独立产品。** 桌面端 = OpenCode + 预装业务 Skill + 预装 ao-cli 二进制。

**核心价值：** 下载安装 → 登录 → 对话即用，零技术门槛。

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI Office Desktop (Electron)                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Renderer (SolidJS UI)                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │
│  │  │ Agent 对话  │  │ Skill 列表  │  │ 消息通知面板       │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Main Process (Node.js)                     │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────────┐  │  │
│  │  │ OpenCode Sidecar│  │ 桌面端增强（Onboarding/通知）  │  │  │
│  │  └─────────────────┘  └──────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    预装资源 (extraResources)                  │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────────┐  │  │
│  │  │ ao-cli 二进制   │  │ 业务 Skill (SKILL.md)          │  │  │
│  │  │ (按平台编译)    │  │ (~/.agents/skills/)           │  │  │
│  │  └─────────────────┘  └──────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   ao-cli skill    │  ◄── Agent 通过 shell 执行
                    │    execute ...    │
                    └─────────┬─────────┘
                              │ HTTPS (X-Request-Source: ao-cli)
                              ▼
                    ┌─────────────────────┐
                    │   Cloud Backend API │
                    └─────────────────────┘
```

### 2.2 设计原则

| 原则 | 说明 |
|------|------|
| **最小 Fork** | 不修改 OpenCode 核心代码，仅通过预装配置和品牌定制实现封装 |
| **Skill 预装而非集成** | 业务 Skill 以 SKILL.md 格式预装到 OpenCode 扫描目录，OpenCode 原生机制自动发现 |
| **CLI 唯一入口不变** | 桌面端内 Agent 仍通过 `ao-cli skill execute` 调用 API |
| **CLI 随应用打包** | Go CLI 二进制作为 Electron extraResources 打包 |

## 3. Fork 策略

### 3.1 仓库配置

| 维度 | 说明 |
|------|------|
| **Fork 仓库** | `github.com/panxiangyu1995/opencode`（从 `anomalyco/opencode` fork） |
| **定制分支** | `ai-office-main` |
| **remote 配置** | `origin` → fork，`upstream` → 上游 |
| **同步策略** | 定期 `git fetch upstream && git merge upstream/dev`，冲突仅限品牌定制文件 |

### 3.2 品牌定制文件清单

| 文件 | 改动 |
|------|------|
| `packages/desktop/src/main/index.ts` | APP_NAMES → "AI Office"、APP_IDS → `com.ai-office.desktop.*`、协议 scheme → `ai-office://` |
| `packages/desktop/src/main/windows.ts` | 窗口标题 → "AI Office"、错误提示文案 |
| `packages/desktop/src/main/onboarding.ts` | 默认项目目录 → "New AI Office Project" |
| `packages/desktop/src/main/sidecar.ts` | 服务器 username → "ai-office" |
| `packages/desktop/src/main/server.ts` | 认证 username → "ai-office"、CLIENT → "ai-office-desktop"、服务名 → "ai-office server" |
| `packages/desktop/src/main/migrate.ts` | App ID 迁移映射 → `com.ai-office.desktop.*` |
| `packages/desktop/src/main/logging.ts` | 日志文件名 → `ai-office-debug-*.zip`、日志路径 → `ai-office/log` |
| `packages/desktop/electron-builder.config.ts` | appId → `com.ai-office.desktop.*`、productName → "AI Office"、scheme → `ai-office`、artifactName → `ai-office-desktop-*`、publish → fork 仓库 |
| `packages/desktop/electron-builder.config.test.ts` | 测试断言同步更新 |
| `packages/desktop/scripts/copy-metainfo.ts` | 应用名、描述、开发者、URL、截图 |
| `packages/desktop/scripts/finalize-latest-json.ts` | 构建产物名 → `ai-office-desktop-*` |
| `packages/desktop/package.json` | name → `@ai-office/desktop` |
| `packages/desktop/src/renderer/index.html` | `<title>` → "AI Office" |
| `packages/desktop/src/renderer/i18n/*.ts` | 16 个语言文件中 "OpenCode" → "AI Office" |
| `packages/desktop/resources/linux/` | desktop entry 重命名 + 更新 |
| `packages/desktop/icons/` | 全部替换为 AI Office 品牌图标 |
| `packages/ui/src/assets/favicon/` | favicon SVG/ICO/PNG 替换 |
| `packages/ui/src/assets/images/` | social-share 图片替换 |

### 3.3 不修改的范围

- OpenCode 核心代码（`packages/opencode/`、`packages/core/` 等）
- WSL 相关逻辑（WSL 中安装的是 OpenCode 本身）
- npm 包引用（`@opencode-ai/*`，改了会破坏依赖）
- Vite 虚拟模块（`virtual:opencode-server`）
- Store 文件名模式（renderer 和 main 进程的内部约定）

## 4. Skill 预装架构

### 4.1 OpenCode Skill 发现机制（原生，不修改）

1. `~/.claude/skills/**/SKILL.md`
2. `~/.agents/skills/**/SKILL.md`
3. opencode 配置目录下的 `{skill,skills}/**/SKILL.md`
4. `opencode.json` 中 `skills.paths` 指定的目录
5. `skills.urls` 远程 Skill 拉取

### 4.2 预装策略

安装时将 Skill 文件部署到 `~/.agents/skills/`：

```
~/.agents/skills/
├── contract/SKILL.md          # 合同管理
├── crm/SKILL.md               # 客户管理
├── hrm/SKILL.md               # 人事管理
├── ims/SKILL.md               # 进销存管理
├── finance/SKILL.md           # 财务管理
├── sales/SKILL.md             # 销售管理
├── service/SKILL.md           # 售后管理
├── workflow/SKILL.md          # 审批工作流
├── knowledge/SKILL.md         # 知识库
├── message/SKILL.md           # 消息系统
├── org/SKILL.md               # 组织架构
├── report/SKILL.md            # 业务统计
├── export/SKILL.md            # 数据导出
├── assist/SKILL.md            # 员工助手
└── operator/SKILL.md          # 运营商管理
```

### 4.3 SKILL.md 格式规范

所有 SKILL.md 中的操作指令必须使用 `ao-cli skill execute`，禁止 `curl`：

```markdown
---
name: contract
description: 合同管理。通过 ao-cli 管理销售合同，包括创建、查询、审批、修改、删除。
---

# 合同管理

通过 ao-cli 管理销售合同。所有操作必须通过 `ao-cli skill execute` 执行。

## 前置条件

确保已执行 `ao-cli auth login` 完成登录。

## 操作指令

### 创建合同

需要确认 — 创建前必须向用户确认参数。

\`\`\`bash
ao-cli skill execute contract_create --params '{"customer_id":"<UUID>","name":"合同名称","amount":100000}'
\`\`\`

### 查看合同列表

\`\`\`bash
ao-cli skill execute contract_list --params '{"page":1,"page_size":20}'
\`\`\`
```

## 5. CLI 打包架构

### 5.1 交叉编译矩阵

| 平台 | 架构 | 输出文件 | 打包位置 |
|------|------|---------|---------|
| macOS | arm64 | ao-cli-darwin-arm64 | `AI Office.app/Contents/Resources/` |
| macOS | x64 | ao-cli-darwin-amd64 | `AI Office.app/Contents/Resources/` |
| Linux | arm64 | ao-cli-linux-arm64 | `/opt/ai-office/resources/` |
| Linux | x64 | ao-cli-linux-amd64 | `/opt/ai-office/resources/` |
| Windows | arm64 | ao-cli-windows-arm64.exe | 安装目录 `\resources\` |
| Windows | x64 | ao-cli-windows-amd64.exe | 安装目录 `\resources\` |

### 5.2 electron-builder extraResources 配置

```json
{
  "extraResources": [
    {
      "from": "resources/ao-cli-${os}-${arch}",
      "to": "ao-cli"
    },
    {
      "from": "resources/skills",
      "to": "skills"
    }
  ]
}
```

### 5.3 安装时操作

1. 将 ao-cli 二进制复制到应用资源目录
2. 将 Skill 文件部署到 `~/.agents/skills/`
3. 将 ao-cli 所在目录添加到用户 PATH
4. 首次启动时执行 Onboarding 引导流程

## 6. Onboarding 流程

```
┌─────────────────────────────────────────────────────────────┐
│                    桌面端首次启动引导                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 欢迎页面                                           │
│     → 介绍产品：通过自然语言管理企业业务                      │
│     ↓                                                       │
│  Step 2: 输入 API 服务器地址                                 │
│     → 默认：https://api.ai-office.com                       │
│     → 支持自定义地址（私有化部署场景）                        │
│     ↓                                                       │
│  Step 3: 执行 ao-cli auth login                             │
│     → 弹出登录对话框（邮箱 + 密码）                          │
│     → CLI 完成认证，保存 Token                               │
│     ↓                                                       │
│  Step 4: 验证连接                                           │
│     → 执行 ao-cli auth status                               │
│     → 确认 Token 有效、企业 ID 正确                          │
│     ↓                                                       │
│  Step 5: 配置 LLM Provider                                  │
│     → 引导用户填入 LLM API Key（或选择本地模型）             │
│     → 写入 opencode.json                                    │
│     ↓                                                       │
│  Step 6: 进入对话界面                                       │
│     → Agent 自动加载预装 Skill                               │
│     → 用户开始对话                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 7. 安装包产物

### 7.1 构建命令

```bash
cd opencode/packages/desktop

# 安装依赖
bun install

# 构建
bun run build

# 打包（按平台）
bun run package          # 当前平台
OPENCODE_CHANNEL=prod bun run package  # 生产版本
```

### 7.2 产物清单

| 平台 | 文件名 | 格式 |
|------|--------|------|
| macOS (Apple Silicon) | `ai-office-desktop-mac-arm64.dmg` | DMG |
| macOS (Intel) | `ai-office-desktop-mac-x64.dmg` | DMG |
| Windows (x64) | `ai-office-desktop-win-x64.exe` | NSIS 安装包 |
| Windows (ARM) | `ai-office-desktop-win-arm64.exe` | NSIS 安装包 |
| Linux (x64) | `ai-office-desktop-linux-x64.AppImage` | AppImage |
| Linux (x64) | `ai-office-desktop-linux-x64.deb` | DEB |
| Linux (x64) | `ai-office-desktop-linux-x64.rpm` | RPM |
| Linux (ARM) | `ai-office-desktop-linux-arm64.AppImage` | AppImage |
| Linux (ARM) | `ai-office-desktop-linux-arm64.deb` | DEB |
| Linux (ARM) | `ai-office-desktop-linux-arm64.rpm` | RPM |

### 7.3 Release 发布

安装包通过 GitHub Actions 自动构建并发布到 [Releases](https://github.com/panxiangyu1995/opencode/releases)，自动更新通过 electron-updater 从同一 Release 获取。

## 8. NFR

| NFR-ID | 要求 |
|--------|------|
| NFR-DESKTOP-001 | 安装包大小 ≤ 300MB（含 CLI 二进制 + Skill 文件） |
| NFR-DESKTOP-002 | 启动时间 ≤ 5 秒（冷启动到可交互） |
| NFR-DESKTOP-003 | 支持 macOS 12+、Windows 10+、Ubuntu 20.04+ |
| NFR-DESKTOP-004 | 自动更新：跟随 OpenCode 上游更新 + CLI 版本更新检查 |
| NFR-DESKTOP-005 | 离线提示：无网络时明确提示用户，不静默失败 |

## 9. 许可证

AI Office Desktop 包含 [OpenCode](https://github.com/anomalyco/opencode) 的代码（MIT 协议）。详见项目根目录 [THIRD_PARTY_LICENSES](../THIRD_PARTY_LICENSES)。

AI Office 自身遵循 AGPL v3 协议。
