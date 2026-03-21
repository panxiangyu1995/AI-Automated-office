# Skill 渐进式加载机制深度分析

## 概述

OpenClaw 的 Skill 系统是一个渐进式、分层次的技能加载机制，允许 AI 助手通过技能扩展其能力。该系统支持从多个来源加载技能，并实现了智能的限制和过滤机制。

## 核心架构

### 1. Skill 的定义

Skill 是 OpenClaw 中扩展 AI 助手能力的基本单元，每个技能包含：

- **SKILL.md**: 技能描述文件（必需）
- **references/**: 参考文档目录（可选）
- **scripts/**: 脚本文件目录（可选）
- **metadata**: 元数据配置（在 SKILL.md 的 frontmatter 中）

### 2. Skill Entry 结构

```typescript
// src/agents/skills/types.ts
type SkillEntry = {
  skill: Skill;                    // 技能基本信息
  frontmatter: ParsedSkillFrontmatter;  // 解析的 frontmatter
  metadata: OpenClawSkillMetadata;      // OpenClaw 特定元数据
  invocation: SkillInvocationPolicy;    // 调用策略
};

type Skill = {
  name: string;           // 技能名称
  filePath: string;       // SKILL.md 文件路径
  source: string;         // 来源标识
};
```

## 加载流程

### 1. 多源加载机制

Skill 系统从多个来源加载技能，按优先级合并：

```typescript
// src/agents/skills/workspace.ts - loadSkillEntries 函数
function loadSkillEntries(workspaceDir, opts) {
  // 1. 确定所有技能目录
  const managedSkillsDir = path.join(CONFIG_DIR, "skills");
  const workspaceSkillsDir = path.join(workspaceDir, "skills");
  const bundledSkillsDir = resolveBundledSkillsDir();
  const extraDirs = opts?.config?.skills?.load?.extraDirs ?? [];
  const pluginSkillDirs = resolvePluginSkillDirs({ workspaceDir, config });
  
  // 2. 从各个来源加载技能
  const bundledSkills = loadSkills({ dir: bundledSkillsDir, source: "openclaw-bundled" });
  const extraSkills = mergedExtraDirs.flatMap(dir => loadSkills({ dir, source: "openclaw-extra" }));
  const managedSkills = loadSkills({ dir: managedSkillsDir, source: "openclaw-managed" });
  const personalAgentsSkills = loadSkills({ dir: "~/.agents/skills", source: "agents-skills-personal" });
  const projectAgentsSkills = loadSkills({ dir: "workspace/.agents/skills", source: "agents-skills-project" });
  const workspaceSkills = loadSkills({ dir: workspaceSkillsDir, source: "openclaw-workspace" });
  
  // 3. 按优先级合并（后者覆盖前者）
  const merged = new Map<string, Skill>();
  for (const skill of extraSkills) { merged.set(skill.name, skill); }
  for (const skill of bundledSkills) { merged.set(skill.name, skill); }
  for (const skill of managedSkills) { merged.set(skill.name, skill); }
  for (const skill of personalAgentsSkills) { merged.set(skill.name, skill); }
  for (const skill of projectAgentsSkills) { merged.set(skill.name, skill); }
  for (const skill of workspaceSkills) { merged.set(skill.name, skill); }  // 最高优先级
  
  return Array.from(merged.values());
}
```

### 2. 技能发现过程

每个技能目录的发现过程：

```typescript
function loadSkills({ dir, source }) {
  const rootDir = path.resolve(dir);
  
  // 情况 1: 目录本身就是技能（根目录有 SKILL.md）
  if (fs.existsSync(path.join(rootDir, "SKILL.md"))) {
    return loadSkillsFromDir({ dir: rootDir, source });
  }
  
  // 情况 2: 目录包含多个技能子目录
  const childDirs = listChildDirectories(rootDir);
  const skills = [];
  
  for (const name of childDirs) {
    const skillDir = path.join(rootDir, name);
    if (fs.existsSync(path.join(skillDir, "SKILL.md"))) {
      skills.push(...loadSkillsFromDir({ dir: skillDir, source }));
    }
  }
  
  return skills;
}
```

### 3. 安全限制

系统实现了多层安全限制：

```typescript
const limits = resolveSkillsLimits(config);

// 限制 1: 每个根目录最多扫描的候选数量
maxCandidatesPerRoot: number;

// 限制 2: 每个来源最多加载的技能数量
maxSkillsLoadedPerSource: number;

// 限制 3: 单个 SKILL.md 文件的最大字节数
maxSkillFileBytes: number;

// 限制 4: 提示中最多包含的技能数量
maxSkillsInPrompt: number;

// 限制 5: 技能提示的最大字符数
maxSkillsPromptChars: number;
```

## 渐进式加载机制

### 1. 提示构建流程

```typescript
// src/agents/skills/workspace.ts
function resolveWorkspaceSkillPromptState(workspaceDir, opts) {
  // 步骤 1: 加载所有技能条目
  const skillEntries = opts?.entries ?? loadSkillEntries(workspaceDir, opts);
  
  // 步骤 2: 过滤符合条件的技能
  const eligible = filterSkillEntries(skillEntries, opts?.config, opts?.skillFilter, opts?.eligibility);
  
  // 步骤 3: 排除禁用模型调用的技能
  const promptEntries = eligible.filter(
    entry => entry.invocation?.disableModelInvocation !== true
  );
  
  // 步骤 4: 应用提示限制
  const { skillsForPrompt, truncated, compact } = applySkillsPromptLimits({
    skills: promptSkills,
    config: opts?.config,
  });
  
  // 步骤 5: 生成提示文本
  const prompt = compact 
    ? formatSkillsCompact(skillsForPrompt) 
    : formatSkillsForPrompt(skillsForPrompt);
  
  return { eligible, prompt, resolvedSkills };
}
```

### 2. 智能限制应用

```typescript
function applySkillsPromptLimits({ skills, config }) {
  const limits = resolveSkillsLimits(config);
  
  // 第一层限制: 按数量截断
  const byCount = skills.slice(0, limits.maxSkillsInPrompt);
  
  // 第二层限制: 按字符预算调整
  const fitsFull = (skills) => 
    formatSkillsForPrompt(skills).length <= limits.maxSkillsPromptChars;
  
  const fitsCompact = (skills) => 
    formatSkillsCompact(skills).length <= (limits.maxSkillsPromptChars - COMPACT_WARNING_OVERHEAD);
  
  if (!fitsFull(skillsForPrompt)) {
    // 尝试紧凑格式（省略描述）
    if (fitsCompact(skillsForPrompt)) {
      compact = true;
    } else {
      // 二分查找最大可容纳的前缀
      let lo = 0, hi = skillsForPrompt.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (fitsCompact(skillsForPrompt.slice(0, mid))) {
          lo = mid;
        } else {
          hi = mid - 1;
        }
      }
      skillsForPrompt = skillsForPrompt.slice(0, lo);
      truncated = true;
    }
  }
  
  return { skillsForPrompt, truncated, compact };
}
```

### 3. 技能过滤机制

```typescript
function filterSkillEntries(entries, config, skillFilter, eligibility) {
  // 第一层过滤: 基于配置和资格
  let filtered = entries.filter(entry => 
    shouldIncludeSkill({ entry, config, eligibility })
  );
  
  // 第二层过滤: 基于技能过滤器
  if (skillFilter !== undefined) {
    const normalized = normalizeSkillFilter(skillFilter);
    filtered = normalized.length > 0
      ? filtered.filter(entry => normalized.includes(entry.skill.name))
      : [];
  }
  
  return filtered;
}
```

## 技能格式

### 1. 完整格式
```markdown
## Skills

You have access to the following skills:

### github
🐙 GitHub operations via `gh` CLI: issues, PRs, CI runs, code review, API queries.
Location: ~/skills/github/SKILL.md

### slack
💬 Slack operations via Slack CLI.
Location: ~/skills/slack/SKILL.md

...
```

### 2. 紧凑格式
```markdown
## Skills (compact)

- github: ~/skills/github/SKILL.md
- slack: ~/skills/slack/SKILL.md
- notion: ~/skills/notion/SKILL.md
...
```

## 技能元数据

### 1. Frontmatter 结构
```yaml
---
name: github
description: "GitHub operations via `gh` CLI"
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

### 2. 调用策略
```typescript
type SkillInvocationPolicy = {
  disableModelInvocation?: boolean;  // 禁止模型自动调用
  // 其他调用策略配置
};
```

## 内置技能示例

OpenClaw 包含丰富的内置技能：

| 技能名 | 描述 | 位置 |
|--------|------|------|
| github | GitHub 操作 | skills/github/SKILL.md |
| slack | Slack 集成 | skills/slack/SKILL.md |
| notion | Notion 集成 | skills/notion/SKILL.md |
| tmux | 终端多路复用 | skills/tmux/SKILL.md |
| trello | Trello 看板 | skills/trello/SKILL.md |
| weather | 天气查询 | skills/weather/SKILL.md |
| canvas | 画布控制 | skills/canvas/SKILL.md |
| oracle | Oracle 数据库 | skills/oracle/SKILL.md |

## 关键实现文件

### 核心文件
- [src/agents/skills/workspace.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/agents/skills/workspace.ts) - 工作区技能加载
- [src/agents/skills/types.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/agents/skills/types.ts) - 类型定义
- [src/agents/skills/config.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/agents/skills/config.ts) - 配置解析

### CLI 文件
- [src/cli/skills-cli.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cli/skills-cli.ts) - CLI 命令
- [src/cli/skills-cli.format.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cli/skills-cli.format.ts) - 格式化输出

### 安装文件
- [src/agents/skills-install.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/agents/skills-install.ts) - 技能安装
- [src/agents/skills-status.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/agents/skills-status.ts) - 状态管理

## 最佳实践

### 1. 技能开发
- 提供清晰的描述和使用场景
- 包含必要的参考文档
- 使用 frontmatter 声明依赖
- 遵循文件大小限制

### 2. 技能管理
- 定期运行 `openclaw skills check` 审计
- 使用技能过滤器控制加载范围
- 监控提示大小和截断情况

### 3. 性能优化
- 利用紧凑格式减少提示大小
- 合理配置技能加载限制
- 使用 `disableModelInvocation` 控制自动调用

## 设计哲学

### 1. 渐进式增强
- 从基础功能开始
- 按需加载扩展能力
- 避免一次性加载过多内容

### 2. 多源融合
- 支持多种技能来源
- 灵活的优先级机制
- 用户可自定义和覆盖

### 3. 安全可控
- 多层限制机制
- 文件大小检查
- 路径安全验证
