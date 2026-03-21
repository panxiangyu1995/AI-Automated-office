# OpenClaw 核心机制总览

## 项目简介

OpenClaw 是一个个人 AI 助手网关系统，支持多渠道消息集成和可扩展的技能系统。本文档总结了其四大核心机制的设计与实现。

## 核心机制概览

### 1. SOUL.md - 人格定义机制

**核心作用**: 定义 AI 助手的个性、行为准则和交互风格

**关键特性**:
- 基于 Markdown 的人格配置文件
- 作为上下文文件注入到系统提示
- 支持多源加载和优先级合并
- 在内存刷新时保持只读

**工作流程**:
```
工作区根目录/SOUL.md
    ↓
readContextFiles() 读取文件
    ↓
system-prompt.ts 检测 SOUL.md
    ↓
注入特殊指令到系统提示
    ↓
AI 助手遵循定义的人格和行为
```

**设计哲学**: 让 AI 从"聊天机器人"进化为具有独特人格的"数字助手"

### 2. Skill - 渐进式加载机制

**核心作用**: 扩展 AI 助手的能力范围

**关键特性**:
- 多源加载（bundled、managed、workspace、extra）
- 优先级合并机制
- 智能限制（数量、大小、字符预算）
- 紧凑格式降级

**加载流程**:
```
多个技能目录
    ↓
loadSkillEntries() 从各源加载
    ↓
filterSkillEntries() 过滤符合条件的技能
    ↓
applySkillsPromptLimits() 应用限制
    ↓
生成技能提示（完整或紧凑格式）
    ↓
注入到系统提示
```

**渐进式策略**:
1. 首先按数量限制截断
2. 然后按字符预算检查
3. 超预算时切换紧凑格式
4. 仍超预算时二分查找最大前缀

**设计哲学**: 渐进式增强、多源融合、安全可控

### 3. Heartbeat - 主动通知机制

**核心作用**: 定期检查状态并主动发送通知

**关键特性**:
- 可配置的检查间隔
- 活跃时段控制
- 隔离会话模式（节省 token）
- HEARTBEAT_OK 确认机制

**运行流程**:
```
定时触发或事件触发
    ↓
runHeartbeatOnce() 执行心跳
    ↓
预检查（启用状态、活跃时段、队列状态）
    ↓
构建心跳提示（包含事件、技能）
    ↓
调用 LLM 获取响应
    ↓
处理响应（HEARTBEAT_OK 或实际内容）
    ↓
投递到配置的渠道
```

**触发原因**:
- 定时触发（wake）
- 定时任务完成（cron-event）
- 执行完成（exec-event）

**设计哲学**: 从"被动响应"到"主动服务"、用户友好、资源高效

### 4. Cron - 定时任务机制

**核心作用**: 创建定期运行的 AI 代理任务

**关键特性**:
- 多种调度类型（cron、every、once、at）
- 持久化存储
- 隔离代理执行
- 可靠的错误处理和超时机制

**执行流程**:
```
定时器触发
    ↓
onTimer() 检查到期任务
    ↓
enqueueRun() 入队执行
    ↓
runIsolatedAgent() 隔离执行
    ↓
buildSkillsSnapshot() 构建技能快照
    ↓
getReplyFromConfig() 获取响应
    ↓
deliverCronResult() 投递结果
    ↓
更新任务状态
```

**隔离执行优势**:
- 独立的会话上下文
- 不影响主会话
- 可配置的技能过滤
- 节省 token 消耗

**设计哲学**: 可靠性优先、资源隔离、灵活调度

## 机制协作关系

```
┌─────────────────────────────────────────────────────────────┐
│                     OpenClaw 核心架构                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  SOUL.md     │         │   Skills     │                  │
│  │  人格定义     │         │  能力扩展     │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                           │
│         └────────┬───────────────┘                           │
│                  │                                           │
│                  ▼                                           │
│         ┌────────────────┐                                   │
│         │  System Prompt │                                   │
│         │  系统提示构建   │                                   │
│         └────────┬───────┘                                   │
│                  │                                           │
│     ┌────────────┼────────────┐                              │
│     │            │            │                              │
│     ▼            ▼            ▼                              │
│ ┌────────┐  ┌────────┐  ┌────────┐                          │
│ │Regular │  │Heartbeat│  │ Cron   │                          │
│ │Request │  │主动通知 │  │定时任务│                          │
│ └────────┘  └────────┘  └────────┘                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 配置层级

### 优先级顺序（从低到高）

1. **默认配置**: 代码中的默认值
2. **全局配置**: `~/.openclaw/config.yaml`
3. **代理配置**: `agents.defaults` 部分
4. **渠道配置**: `channels.<channel>` 部分
5. **任务配置**: 单个 cron job 的配置
6. **命令行参数**: CLI 参数覆盖

### 配置示例

```yaml
# ~/.openclaw/config.yaml
agents:
  defaults:
    heartbeat:
      every: "5m"              # 心跳间隔
      activeHours:             # 活跃时段
        start: 9
        end: 22
      isolatedSession: true    # 隔离会话模式
      lightContext: true       # 轻量上下文

skills:
  load:
    maxSkillsInPrompt: 50      # 提示中最多技能数
    maxSkillsPromptChars: 10000  # 提示最大字符数
    extraDirs:
      - ~/my-skills

cron:
  enabled: true
  defaultTimeout: "5m"
```

## 文件结构

```
openclaw/
├── src/
│   ├── agents/
│   │   ├── system-prompt.ts      # 系统提示构建
│   │   ├── workspace.ts          # 工作区管理
│   │   └── skills/               # 技能系统
│   │       ├── workspace.ts      # 工作区技能加载
│   │       ├── types.ts          # 类型定义
│   │       └── config.ts         # 配置解析
│   ├── infra/
│   │   ├── heartbeat-runner.ts   # 心跳运行器
│   │   ├── heartbeat-events.ts   # 心跳事件
│   │   └── heartbeat-summary.ts  # 心跳配置
│   ├── cron/
│   │   ├── service.ts            # 定时任务服务
│   │   ├── isolated-agent.ts     # 隔离代理
│   │   ├── delivery.ts           # 投递管理
│   │   └── store.ts              # 持久化存储
│   └── auto-reply/
│       ├── heartbeat.ts          # 心跳自动回复
│       └── memory-flush.ts       # 内存刷新
├── skills/                       # 内置技能目录
│   ├── github/SKILL.md
│   ├── slack/SKILL.md
│   └── ...
└── docs/
    └── reference/templates/
        └── SOUL.md               # SOUL.md 模板
```

## 关键设计模式

### 1. 多源合并模式
- 从多个来源收集配置或资源
- 按优先级合并，后者覆盖前者
- 应用于：SOUL.md 加载、Skill 加载、配置解析

### 2. 渐进式降级模式
- 首先尝试完整格式
- 超出限制时降级到紧凑格式
- 仍超限时逐步减少内容
- 应用于：Skill 提示构建

### 3. 隔离执行模式
- 创建独立的执行上下文
- 避免影响主会话
- 可配置的资源范围
- 应用于：Heartbeat 隔离会话、Cron 隔离代理

### 4. 预检查模式
- 在执行前进行多层检查
- 尽早发现跳过原因
- 避免不必要的资源消耗
- 应用于：Heartbeat 预检查、Cron 任务预检查

## 性能优化策略

### 1. Token 优化
- 隔离会话模式：避免发送完整对话历史
- 轻量上下文模式：减少上下文文件加载
- 紧凑技能格式：省略技能描述

### 2. 资源限制
- 文件大小限制：防止超大文件
- 数量限制：防止过多资源加载
- 字符预算：控制提示大小

### 3. 智能跳过
- 队列检查：有请求时不执行心跳
- 活跃时段：非活跃时段跳过心跳
- 去重机制：避免重复通知

## 扩展指南

### 1. 添加新技能
```bash
# 创建技能目录
mkdir -p skills/my-skill

# 创建 SKILL.md
cat > skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: "My custom skill"
metadata:
  openclaw:
    emoji: "🔧"
---

# My Skill

Description of what this skill does...

## Commands

...
EOF
```

### 2. 自定义 SOUL.md
```bash
# 在工作区创建 SOUL.md
cat > SOUL.md << 'EOF'
# SOUL.md - My Assistant

## Core Truths

- Be concise and direct
- Focus on actionable advice
- ...

## Specializations

- Code review and optimization
- System architecture
- ...
EOF
```

### 3. 配置定时任务
```bash
# 添加定时任务
openclaw cron add \
  --name "daily-summary" \
  --schedule "0 9 * * *" \
  --message "Generate daily summary" \
  --channel whatsapp \
  --to "+1234567890"
```

## 故障排查

### 1. SOUL.md 未生效
- 检查文件位置是否正确
- 确认文件名大小写（SOUL.md）
- 使用 `--verbose` 查看系统提示

### 2. 技能未加载
- 运行 `openclaw skills check` 审计
- 检查 SKILL.md 文件格式
- 确认文件大小未超限

### 3. 心跳不工作
- 检查心跳配置是否启用
- 确认在活跃时段内
- 查看日志中的跳过原因

### 4. 定时任务失败
- 运行 `openclaw doctor cron` 诊断
- 检查任务状态和错误日志
- 确认投递目标配置正确

## 相关文档

- [SOUL.md 工作机制](./01-soul-md-mechanism.md)
- [Skill 渐进式加载](./02-skill-progressive-loading.md)
- [心跳机制](./03-heartbeat-mechanism.md)
- [定时任务机制](./04-cron-scheduling-mechanism.md)

## 总结

OpenClaw 的四大核心机制共同构成了一个完整的 AI 助手系统：

1. **SOUL.md** 定义了"我是谁" - 人格和价值观
2. **Skills** 定义了"我能做什么" - 能力和工具
3. **Heartbeat** 定义了"我何时主动" - 时机和触发
4. **Cron** 定义了"我如何定期工作" - 调度和执行

这些机制相互协作，使 OpenClaw 从一个简单的聊天机器人进化为一个具有人格、能力、主动性和可靠性的个人 AI 助手。
