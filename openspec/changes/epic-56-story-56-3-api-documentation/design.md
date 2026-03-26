# Design: API文档生成

## 技术方案

### 实现类型
- **类型**: polish (优化完善)
- **优先级**: low
- **阶段**: 技术债务与优化
- **是否需要后端**: 否（纯前端文档生成）

### 技术选型

| 工具 | 说明 | 选择 |
|------|------|------|
| TypeDoc | 最流行的TypeScript文档生成工具 | 首选 |
| ESDoc | TypeScript/JavaScript文档工具 | 备选 |
| Storybook | 组件文档+演示 | 不适用 |

**选择理由**: TypeDoc对TypeScript原生支持最好，生态丰富，配置灵活。

### TypeDoc配置

```json
// typedoc.json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": [
    "src/features/agent/index.ts",
    "src/features/session/index.ts",
    "src/features/tools/index.ts",
    "src/types/index.ts"
  ],
  "entryPointStrategy": "expand",
  "out": "docs/api",
  "name": "AI-Automated-Office API",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": false,
  "navigationLinks": {
    "GitHub": "https://github.com/your-org/ai-automated-office"
  },
  "plugin": [
    "typedoc-plugin-versions"
  ],
  "sidebarLinks": {
    "API Reference": "https://api.example.com"
  }
}
```

### JSDoc注释规范

#### 1. 类/接口注释

```typescript
/**
 * Agent协调器核心类，负责管理Agent运行时生命周期
 *
 * @remarks
 * 该类是Agent系统的中央协调器，整合了会话管理、状态机、
 * 规划器和执行器，提供从用户输入到执行计划的完整流程编排。
 *
 * @example
 * ```typescript
 * const orchestrator = new AgentOrchestrator(config);
 * await orchestrator.start();
 * const result = await orchestrator.processMessage('用户输入');
 * ```
 *
 * @see {@link SessionManager} - 会话管理器
 * @see {@link RuntimeStateMachine} - 运行时状态机
 */
export class AgentOrchestrator {
  // ...
}
```

#### 2. 方法注释

```typescript
/**
 * 处理用户消息并生成响应
 *
 * @param message - 用户输入的消息
 * @param context - 可选的执行上下文
 *
 * @returns 处理结果，包含生成的响应和执行状态
 *
 * @throws {AgentError} 当处理失败时抛出
 *
 * @remarks
 * 该方法会执行以下流程：
 * 1. 解析用户意图
 * 2. 生成执行计划
 * 3. 调用工具执行
 * 4. 汇总结果返回
 */
async processMessage(
  message: Message,
  context?: ExecutionContext
): Promise<ProcessResult> {
  // ...
}
```

#### 3. 类型注释

```typescript
/**
 * 消息角色枚举
 *
 * @remarks
 * 定义了对话中所有可能的角色类型
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Agent处理结果
 *
 * @property response - 生成的响应内容
 * @property status - 处理状态
 * @property toolCalls - 触发的工具调用列表
 * @property metrics - 执行指标数据
 */
export interface ProcessResult {
  response: string;
  status: ExecutionStatus;
  toolCalls: ToolCall[];
  metrics: ExecutionMetrics;
}
```

#### 4. 参数注释

```typescript
/**
 * 创建Agent会话
 *
 * @param options - 会话配置选项
 * @param options.userId - 用户ID (必填)
 * @param options.model - 使用的模型名称 (可选，默认'gpt-4')
 * @param options.systemPrompt - 系统提示词 (可选)
 *
 * @returns 新创建的会话实例
 */
function createSession(options: {
  userId: string;
  model?: string;
  systemPrompt?: string;
}): Session {
  // ...
}
```

### 目录结构

```
docs/
├── api/                    # TypeDoc生成目录
│   ├── index.html         # 文档首页
│   ├── modules/           # 模块文档
│   └── assets/            # 静态资源
└── README.md              # 文档索引

scripts/
└── generate-docs.sh       # 文档生成脚本
```

### npm scripts

```json
// package.json
{
  "scripts": {
    "docs": "typedoc",
    "docs:watch": "typedoc --watch",
    "docs:clean": "rm -rf docs/api"
  }
}
```

### 文档输出

生成文档结构：
```
docs/api/
├── index.html           # 文档首页
├── modules/             # 按模块组织
│   ├── features_agent/  # Agent模块
│   ├── features_session/
│   └── types/
├── assets/
│   ├── main.js
│   └── styles.css
└── search.json          # 搜索索引
```

### 关键实现细节

#### 1. 入口点策略
```json
{
  "entryPointStrategy": "expand",
  "entryPoints": [
    "src/features/agent/index.ts",  // 通过index.ts聚合模块导出
    "src/features/session/index.ts",
    "src/types/index.ts"
  ]
}
```

#### 2. 模块index.ts聚合导出
```typescript
// src/features/agent/index.ts
/**
 * Agent模块
 *
 * @module Agent
 * @description 包含Agent核心协调器、状态机、规划器等
 */

// 导出所有公开API
export { AgentOrchestrator } from './orchestrator/AgentOrchestrator';
export { RuntimeStateMachine } from './runtime/RuntimeStateMachine';
export { StructuredPlanner } from './planner/StructuredPlanner';
export * from './types/agent.types';
```

#### 3. 条件文档排除
```typescript
// 使用 @hidden 标记不公开的内部实现
/**
 * @internal
 */
class InternalHelper {
  // 这个不会出现在文档中
}
```

### 安全考虑
- 无安全相关变更（本Story为文档生成）

### 性能考虑
- 文档生成为一次性操作，无运行时性能影响
