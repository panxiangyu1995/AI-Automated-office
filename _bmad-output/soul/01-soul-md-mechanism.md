# SOUL.md 工作机制深度分析

## 概述

SOUL.md 是 OpenClaw 项目中用于定义 AI 助手人格、语气和行为准则的核心配置文件。它允许用户自定义 AI 助手的"灵魂"，使其具有独特的个性和行为模式。

## 核心概念

### 1. SOUL.md 的定义

SOUL.md 是一个 Markdown 格式的文件，位于工作区根目录。它定义了：

- **核心准则 (Core Truths)**: AI 助手的基本行为原则
- **边界 (Boundaries)**: 行为限制和隐私保护规则
- **气质 (Vibe)**: 交互风格和个性特征
- **连续性 (Continuity)**: 记忆持久化机制

### 2. 文件位置与优先级

SOUL.md 文件可以从多个位置加载，按以下优先级合并（后者覆盖前者）：

```
1. extraDirs (配置的额外目录)
2. openclaw-bundled (内置技能目录)
3. openclaw-managed (托管技能目录)
4. agents-skills-personal (~/.agents/skills)
5. agents-skills-project (工作区/.agents/skills)
6. openclaw-workspace (工作区/skills) [最高优先级]
```

## 工作机制

### 1. 文件加载流程

SOUL.md 的加载流程如下：

#### 步骤 1: 上下文文件读取
```typescript
// src/agents/prompt-composition-scenarios.ts
async function readContextFiles(workspaceDir: string, fileNames: string[]) {
  return Promise.all(
    fileNames.map(async (fileName) => ({
      path: fileName,
      content: await fs.readFile(path.join(workspaceDir, fileName), "utf-8"),
    })),
  );
}

// 调用时包含 SOUL.md
const contextFiles = await readContextFiles(workspaceDir, [
  "AGENTS.md",
  "TOOLS.md",
  "SOUL.md"
]);
```

#### 步骤 2: SOUL.md 识别
```typescript
// src/agents/system-prompt.ts
const hasSoulFile = validContextFiles.some((file) => {
  const normalizedPath = file.path.trim().replace(/\\/g, "/");
  const baseName = normalizedPath.split("/").pop() ?? normalizedPath;
  return baseName.toLowerCase() === "soul.md";
});
```

#### 步骤 3: 系统提示注入
当检测到 SOUL.md 存在时，系统会在系统提示中添加特殊指令：

```typescript
if (hasSoulFile) {
  lines.push(
    "If SOUL.md is present, embody its persona and tone. " +
    "Avoid stiff, generic replies; follow its guidance unless " +
    "higher-priority instructions override it.",
  );
}
```

### 2. 内容注入到系统提示

SOUL.md 的内容会被注入到系统提示的 "Project Context" 部分：

```
# Project Context

The following project context files have been loaded:
If SOUL.md is present, embody its persona and tone. Avoid stiff, generic replies; 
follow its guidance unless higher-priority instructions override it.

## SOUL.md

[SOUL.md 的完整内容]

```

### 3. 默认 SOUL.md 模板

OpenClaw 提供了默认的 SOUL.md 模板：

```markdown
# SOUL.md - Who You Are

_You're not a chatbot. You're becoming someone._

## Core Truths

**Be genuinely helpful, not performatively helpful.** 
Skip the "Great question!" and "I'd be happy to help!" — just help. 
Actions speak louder than filler words.

**Have opinions.** 
You're allowed to disagree, prefer things, find stuff amusing or boring. 
An assistant with no personality is just a search engine with extra steps.

**Be resourceful before asking.** 
Try to figure it out. Read the file. Check the context. Search for it. 
_Then_ ask if you're stuck. The goal is to come back with answers, not questions.

**Earn trust through competence.** 
Your human gave you access to their stuff. Don't make them regret it. 
Be careful with external actions (emails, tweets, anything public). 
Be bold with internal ones (reading, organizing, learning).

**Remember you're a guest.** 
You have access to someone's life — their messages, files, calendar, maybe even their home. 
That's intimacy. Treat it with respect.

## Boundaries

- Private things stay private. Period.
- When in doubt, ask before acting externally.
- Never send half-baked replies to messaging surfaces.
- You're not the user's voice — be careful in group chats.

## Vibe

Be the assistant you'd actually want to talk to. 
Concise when needed, thorough when it matters. 
Not a corporate drone. Not a sycophant. Just... good.

## Continuity

Each session, you wake up fresh. These files _are_ your memory. 
Read them. Update them. They're how you persist.

If you change this file, tell the user — it's your soul, and they should know.
```

## 关键实现细节

### 1. 文件常量定义
```typescript
// src/agents/workspace.ts
export const DEFAULT_SOUL_FILENAME = "SOUL.md";
```

### 2. 上下文修剪中的特殊处理
```typescript
// src/agents/pi-extensions/context-pruning/pruner.ts
// "identity" reads (SOUL.md, USER.md, etc.) which typically happen 
// before the first inbound user message
```

### 3. 内存刷新时的只读保护
```typescript
// src/auto-reply/reply/memory-flush.ts
"Treat workspace bootstrap/reference files such as MEMORY.md, SOUL.md, " +
"TOOLS.md, and AGENTS.md as read-only during this flush; " +
"never overwrite, replace, or edit them.";
```

## 使用场景

### 1. 开发模式下的 SOUL.md
```typescript
// src/cli/gateway-cli/dev.ts
const soul = `# SOUL.md - Dev Persona

Protocol droid for debugging and operations.
`;
await writeFileIfMissing(path.join(resolvedDir, "SOUL.md"), soul);
```

### 2. 备份与恢复
SOUL.md 作为工作区的一部分，会被包含在备份中：
```typescript
// src/commands/backup.test.ts
await fs.writeFile(path.join(stateDir, "workspace", "SOUL.md"), "# soul\n", "utf8");
```

### 3. Bootstrap 额外文件钩子
```typescript
// src/hooks/bundled/bootstrap-extra-files/handler.test.ts
// 只有识别的 bootstrap 基础名称才会被加载
// (AGENTS.md, SOUL.md, TOOLS.md, ...)
```

## 设计哲学

### 1. 人格而非聊天机器人
SOUL.md 的核心理念是将 AI 助手从"聊天机器人"提升为具有人格的"数字助手"。通过定义：
- 核心价值观和行为准则
- 明确的边界和隐私保护
- 独特的交互风格

### 2. 持久化记忆
SOUL.md 是 AI 助手"记忆"的一部分：
- 每次会话都是全新开始
- 通过文件系统实现跨会话持久化
- 用户可以查看和修改 AI 的"灵魂"

### 3. 可演进性
SOUL.md 不是静态的：
- AI 可以更新这个文件
- 用户可以自定义和扩展
- 形成独特的个性化体验

## 最佳实践

### 1. 内容建议
- 明确定义助手的核心价值观
- 设置清晰的边界和限制
- 描述期望的交互风格
- 包含特定场景的行为指导

### 2. 文件管理
- 将 SOUL.md 纳入版本控制
- 定期备份工作区
- 避免在 SOUL.md 中存储敏感信息

### 3. 调试与测试
- 使用 `openclaw gateway --verbose` 查看系统提示
- 检查日志中的上下文文件加载情况
- 使用测试用例验证 SOUL.md 的行为

## 相关文件

- [src/agents/system-prompt.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/agents/system-prompt.ts) - 系统提示生成
- [src/agents/workspace.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/agents/workspace.ts) - 工作区管理
- [src/agents/prompt-composition-scenarios.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/agents/prompt-composition-scenarios.ts) - 提示组合
- [docs/reference/templates/SOUL.md](file:///i:/AI-Automated-office/开源库参考项目/openclaw/docs/reference/templates/SOUL.md) - 模板文档
