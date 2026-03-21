# OpenCode 项目系统性研究报告

**研究日期:** 2026-03-21  
**研究目的:** 为 AI-Automated-office 项目的 Agent 功能实现提供参考  
**项目地址:** i:\AI-Automated-office\开源库参考项目\opencode

---

## 一、项目概述

### 1.1 项目定位

OpenCode 是一个**开源的 AI 编程助手（AI Coding Agent）**，类似于 Claude Code。其核心特点：

- **100% 开源** - 完全透明的代码实现
- **提供商无关** - 支持多种 AI 模型（Claude、OpenAI、Google、本地模型等）
- **客户端/服务器架构** - 支持远程控制和多客户端
- **多界面支持** - TUI（终端）、Web、桌面应用

### 1.2 核心特性

| 特性 | 描述 |
|-----|------|
| **双 Agent 模式** | build（完整访问）+ plan（只读分析） |
| **工具系统** | bash、read、write、edit、grep、glob 等 20+ 工具 |
| **MCP 集成** | 支持 Model Context Protocol 外部工具 |
| **插件系统** | Hook 机制扩展核心功能 |
| **会话管理** | 完整的消息历史、快照、回滚机制 |
| **权限控制** | 细粒度的操作权限管理 |

### 1.3 项目结构

```
packages/
├── opencode/              # 核心业务逻辑和服务器
│   └── src/
│       ├── agent/         # Agent 定义和管理
│       ├── tool/          # 工具系统（20+ 工具）
│       ├── session/       # 会话管理和消息处理
│       ├── mcp/           # MCP 协议集成
│       ├── provider/      # AI 提供商抽象层
│       ├── plugin/        # 插件/Hook 系统
│       ├── permission/    # 权限控制
│       ├── server/        # HTTP API 服务器
│       ├── storage/       # 数据持久化（SQLite）
│       ├── cli/           # CLI 命令
│       └── ...
├── app/                   # 共享 Web UI 组件（SolidJS）
├── desktop/               # Tauri 桌面应用
├── sdk/                   # SDK（JS/Python）
├── plugin/                # 插件开发包
└── ...
```

---

## 二、研究报告目录

本报告分为以下子报告，详细分析各核心模块：

1. [01-architecture.md](./01-architecture.md) - 整体架构设计
2. [02-agent-system.md](./02-agent-system.md) - Agent 系统实现
3. [03-tool-system.md](./03-tool-system.md) - 工具系统设计
4. [04-session-management.md](./04-session-management.md) - 会话管理机制
5. [05-mcp-integration.md](./05-mcp-integration.md) - MCP 集成方案
6. [06-frontend-architecture.md](./06-frontend-architecture.md) - 前端架构
7. [07-backend-api.md](./07-backend-api.md) - 后端 API 设计
8. [08-tech-stack.md](./08-tech-stack.md) - 技术栈总结
9. [09-reference-recommendations.md](./09-reference-recommendations.md) - 对 AI-Automated-office 的参考建议
10. [10-skill-progressive-loading.md](./10-skill-progressive-loading.md) - Skill 渐进式加载机制

---

## 三、关键发现摘要

### 3.1 Agent 架构亮点

1. **双 Agent 模式** - build 和 plan 分离，提供不同权限级别
2. **流式处理** - 使用 Vercel AI SDK 的 streamText 实现实时响应
3. **工具调用循环** - 自动处理多轮工具调用直到任务完成

### 3.2 工具系统亮点

1. **统一接口** - 所有工具通过 `Tool.define()` 定义，参数使用 Zod 验证
2. **权限集成** - 工具执行前自动请求权限
3. **输出截断** - 自动处理大输出，避免上下文溢出

### 3.3 会话管理亮点

1. **消息分片** - 消息由多个 Part 组成（text、tool、file 等）
2. **快照机制** - 每步操作前创建文件系统快照，支持回滚
3. **压缩机制** - 自动压缩历史消息避免上下文溢出

### 3.4 MCP 集成亮点

1. **工具转换** - 自动将 MCP 工具转换为内部工具格式
2. **OAuth 支持** - 完整的 OAuth 认证流程
3. **状态管理** - 连接状态、认证状态独立管理

### 3.5 Skill 渐进式加载亮点

1. **元数据优先** - 初始化时只加载 Skill 元数据（名称、描述），不加载完整内容
2. **按需加载** - Agent 根据任务需要通过 `skill` 工具动态加载完整 Skill 内容
3. **多位置发现** - 支持项目级、全局级、远程仓库等多种 Skill 来源
4. **权限控制** - 细粒度控制 Agent 对特定 Skill 的访问权限

---

## 四、对 AI-Automated-office 的核心参考价值

| 需求模块 | OpenCode 参考点 | 参考文件 |
|---------|----------------|---------|
| **部门 AI 助手** | Agent 系统的多 Agent 架构 | agent/agent.ts |
| **工具调用** | Tool 系统的统一接口设计 | tool/tool.ts, tool/registry.ts |
| **跨部门数据联动** | Session 的消息和状态管理 | session/processor.ts |
| **权限控制** | Permission 系统的设计 | permission/*.ts |
| **外部工具接入** | MCP 集成方案 | mcp/index.ts |
| **桌面端 UI** | Tauri + SolidJS 架构 | packages/desktop, packages/app |

---

## 五、后续建议

1. **深入研究 Agent 系统** - 理解双 Agent 模式的实现细节
2. **参考工具系统** - 设计部门工具的统一接口
3. **学习会话管理** - 实现跨部门数据流转
4. **借鉴 MCP 集成** - 支持外部工具和第三方服务
5. **参考权限系统** - 设计部门级权限模型

---

*本报告由系统性研究生成，详细分析请参阅各子报告。*
