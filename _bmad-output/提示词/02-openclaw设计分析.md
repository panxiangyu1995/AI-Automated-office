# OpenClaw 项目提示词设计分析

## 项目概述

OpenClaw 是一个 AI Agent 平台/框架，其提示词系统设计成熟，特别是 Skill 系统体现了渐进式加载和模块化设计的最佳实践。

## 目录结构

```
openclaw/
├── AGENTS.md                    # 项目级知识文件
├── CLAUDE.md                    # Claude 专用 (软链接到 AGENTS.md)
├── .pi/                         # Pi 配置目录
│   ├── prompts/                 # 提示词定义
│   │   ├── cl.md                # Changelog 审计
│   │   ├── is.md                # Issue 分析
│   │   ├── landpr.md            # PR 合并流程
│   │   └── reviewpr.md          # PR 审查流程
│   └── extensions/              # 扩展定义
└── skills/                      # Skill 定义目录
    ├── github/SKILL.md
    ├── notion/SKILL.md
    ├── slack/SKILL.md
    ├── skill-creator/SKILL.md
    └── ...                      # 50+ 技能
```

## 核心设计模式

### 1. AGENTS.md 设计

OpenClaw 的 AGENTS.md 是项目知识的集中存储，内容非常全面。

#### 内容结构

```markdown
# Repository Guidelines

## Project Structure & Module Organization
## Docs Linking (Mintlify)
## Docs i18n (zh-CN)
## exe.dev VM ops (general)
## Build, Test, and Development Commands
## Coding Style & Naming Conventions
## Release / Advisory Workflows
## Testing Guidelines
## Commit & Pull Request Guidelines
## Git Notes
## Security & Configuration Tips
## Local Runtime / Platform Notes
## Collaboration / Safety Notes
```

#### 关键设计特点

**1. 明确的文件引用规范**
```markdown
- In chat replies, file references must be repo-root relative only 
  (example: `extensions/bluebubbles/src/channel.ts:80`); 
  never absolute paths or `~/...`.
```

**2. 安全边界声明**
```markdown
- Do not edit files covered by security-focused `CODEOWNERS` rules 
  unless a listed owner explicitly asked for the change.
```

**3. 命令执行规范**
```markdown
- If deps are missing, run the repo's package-manager install command, 
  then rerun the exact requested command once.
```

**4. 禁止事项清单**
```markdown
- Agents MUST NOT modify baseline, inventory, ignore, snapshot, 
  or expected-failure files to silence failing checks.
- Never commit or publish real phone numbers, videos, or live configuration values.
- Never update the Carbon dependency.
```

### 2. Skill 系统设计

Skill 是 OpenClaw 最核心的设计，体现了渐进式加载原则。

#### Skill 目录结构

```
skill-name/
├── SKILL.md (必需)
│   ├── YAML frontmatter (必需)
│   │   ├── name: (必需)
│   │   └── description: (必需)
│   └── Markdown 指令 (必需)
└── 捆绑资源 (可选)
    ├── scripts/          # 可执行脚本
    ├── references/       # 参考文档
    └── assets/           # 输出资源
```

#### Skill Frontmatter 设计

```yaml
---
name: github
description: "GitHub operations via `gh` CLI: issues, PRs, CI runs..."
metadata:
  openclaw:
    emoji: "🐙"
    requires:
      bins: ["gh"]
    install:
      - id: brew
        kind: brew
        formula: gh
        bins: ["gh"]
        label: "Install GitHub CLI (brew)"
---
```

**元数据字段说明**：
| 字段 | 作用 |
|------|------|
| name | Skill 标识符 |
| description | 触发条件描述 |
| metadata.openclaw.emoji | UI 显示图标 |
| metadata.openclaw.requires | 依赖声明 |
| metadata.openclaw.install | 安装指引 |

#### Skill 内容结构

```markdown
# Skill Name

## When to Use
✅ **USE this skill when:**
- 条件1
- 条件2

❌ **DON'T use this skill when:**
- 排除条件1
- 排除条件2

## Setup
## Common Commands
## Templates
```

### 3. 渐进式加载机制

OpenClaw 的 Skill 系统实现了三级渐进式加载：

```
┌─────────────────────────────────────────────────────────┐
│ Level 1: 元数据 (name + description)                     │
│ - 始终加载到上下文                                        │
│ - 约 100 词                                              │
│ - 用于触发判断                                            │
└─────────────────────────────────────────────────────────┘
                          ↓ 触发后加载
┌─────────────────────────────────────────────────────────┐
│ Level 2: SKILL.md 主体                                   │
│ - 触发时加载                                              │
│ - 建议 < 5000 词                                         │
│ - 核心工作流和指令                                        │
└─────────────────────────────────────────────────────────┘
                          ↓ 按需加载
┌─────────────────────────────────────────────────────────┐
│ Level 3: 捆绑资源                                         │
│ - 按需加载                                                │
│ - 无大小限制                                              │
│ - 脚本可执行而不加载到上下文                               │
└─────────────────────────────────────────────────────────┘
```

### 4. Skill 类型与自由度

Skill 根据任务特性设置不同的自由度：

| 自由度 | 适用场景 | 实现方式 |
|--------|----------|----------|
| 高自由度 | 多种方法都有效，决策依赖上下文 | 文本指令 |
| 中自由度 | 存在首选模式，允许一定变化 | 伪代码或参数化脚本 |
| 低自由度 | 操作脆弱易错，一致性关键 | 具体脚本，少量参数 |

**设计原则**：
> 把 AI 想象成在探索路径：悬崖边的窄桥需要具体护栏（低自由度），
> 而开阔的田野允许多条路线（高自由度）。

### 5. Prompt 命令设计

`.pi/prompts/` 目录定义了可复用的提示词命令。

#### landpr.md - PR 合并流程

```yaml
---
description: Land a PR (merge with proper workflow)
---
```

**流程设计**：
```markdown
1. Assign PR to self
2. Repo clean: `git status`
3. Identify PR meta
4. Fast-forward base
5. Create temp base branch
6. Check out PR branch
7. Rebase PR branch
8. Fix + tests + changelog
9. Decide merge strategy
10. Full gate (lint, build, test)
11. Commit via committer
12. Push updated PR branch
13. Merge PR
14. Sync main
15. Comment on PR
16. Verify PR state == MERGED
17. Delete temp branch
```

**设计要点**：
1. **确定性流程**: 17 步明确流程
2. **验证检查点**: 每步都有验证
3. **状态确认**: 最终验证 PR 状态

#### reviewpr.md - PR 审查流程

**核心设计**：真实性验证门控

```markdown
0. Truthfulness + reality gate (required for bug-fix claims)
   - Do not trust the issue text or PR summary by default
   - Verify in code and evidence
   - Hallucination/BS red flags (treat as BLOCKER):
     - claimed behavior not present in repo
     - issue/PR says "fixes #..." but changed files do not touch implicated path
     - only docs/comments changed for a runtime bug claim
```

**验证矩阵**：
```markdown
| Field                                           | Evidence |
| ------------------------------------------------| -------- |
| Claimed problem                                 | ...      |
| Evidence observed (repro/log/test/code)         | ...      |
| Root cause location (`path:line`)               | ...      |
| Why this fix addresses that root cause          | ...      |
| Regression coverage (test name or manual proof) | ...      |
```

### 6. Skill-Creator 元设计

`skill-creator` 是一个特殊的 Skill，用于创建其他 Skill。

#### 核心原则

**1. 简洁优先**
```markdown
The context window is a public good. Skills share the context window with 
everything else Codex needs.

**Default assumption: Codex is already very smart.** 
Only add context Codex doesn't already have.
```

**2. 避免冗余**
```markdown
Information should live in either SKILL.md or references files, not both.
Prefer references files for detailed information unless it's truly core.
```

**3. 不创建额外文件**
```markdown
A skill should only contain essential files. Do NOT create:
- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md
```

### 7. Skill 示例分析

#### GitHub Skill

```yaml
---
name: github
description: "GitHub operations via `gh` CLI: issues, PRs, CI runs..."
---
```

**内容设计**：
```markdown
## When to Use
✅ **USE this skill when:**
- Checking PR status, reviews, or merge readiness
- Viewing CI/workflow run status and logs

❌ **DON'T use this skill when:**
- Local git operations → use `git` directly
- Non-GitHub repos → different CLIs

## Common Commands
### Pull Requests
### Issues
### CI/Workflow Runs
### API Queries

## Templates
### PR Review Summary
```

#### Slack Skill

```yaml
---
name: slack
description: Use when you need to control Slack from OpenClaw...
---
```

**动作分组设计**：
```markdown
| Action group | Default | Notes                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | React + list reactions |
| messages     | enabled | Read/send/edit/delete  |
| pins         | enabled | Pin/unpin/list         |
| memberInfo   | enabled | Member info            |
```

**JSON 工具调用格式**：
```json
{
  "action": "react",
  "channelId": "C123",
  "messageId": "1712023032.1234",
  "emoji": "✅"
}
```

## 设计原则提炼

### 原则 1: 上下文效率

```markdown
The context window is a public good.
Challenge each piece of information: "Does Codex really need this explanation?"
```

### 原则 2: 渐进式披露

三级加载机制确保只在需要时提供上下文。

### 原则 3: 明确边界

每个 Skill 都有明确的触发条件和排除条件：
```markdown
✅ **USE this skill when:**
❌ **DON'T use this skill when:**
```

### 原则 4: 工具调用标准化

使用 JSON 格式定义工具调用：
```json
{
  "action": "sendMessage",
  "to": "channel:C123",
  "content": "Hello"
}
```

### 原则 5: 安全护栏

在 AGENTS.md 中明确禁止事项：
```markdown
- Agents MUST NOT modify baseline, inventory, ignore, snapshot files
- Never commit or publish real phone numbers, videos
```

## 与 OpenCode 对比

| 特性 | OpenClaw | OpenCode |
|------|----------|----------|
| Skill 数量 | 50+ | 无独立 Skill 系统 |
| 渐进式加载 | 三级加载 | 两级加载 |
| 工具调用 | JSON 格式 | TypeScript 定义 |
| 知识文件 | AGENTS.md (全面) | AGENTS.md (简洁) |
| 翻译支持 | 无内置 | 内置术语表 |
| 安全机制 | CODEOWNERS + 禁止清单 | 权限配置 |

## 可借鉴点

1. **渐进式加载**: 三级加载机制优化上下文使用
2. **Skill 元设计**: `skill-creator` 提供创建 Skill 的 Skill
3. **明确边界**: USE/DON'T USE 清晰定义触发条件
4. **工具调用标准化**: JSON 格式统一工具调用
5. **安全护栏**: 禁止清单和 CODEOWNERS 机制
6. **真实性验证**: PR 审查中的幻觉检测机制
