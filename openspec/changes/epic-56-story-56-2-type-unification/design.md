# Design: 类型定义统一

## 技术方案

### 实现类型
- **类型**: polish (优化完善)
- **优先级**: low
- **阶段**: 技术债务与优化
- **是否需要后端**: 否（纯前端重构）

### 类型审计结果

通过代码审计发现的重复类型定义：

#### 1. ToolCategory 重复定义

```typescript
// 发现位置1: src/features/session/tools/toolRegistry.ts
type ToolCategory = 'filesystem' | 'shell' | 'http' | 'custom';

// 发现位置2: src/features/agent/types/tool.types.ts
enum ToolCategory {
  FileSystem = 'fs',
  Shell = 'shell',
  Http = 'http',
  Custom = 'custom'
}

// 发现位置3: src/lib/tools.ts
const ToolCategory = {
  FILESYSTEM: 'filesystem',
  SHELL: 'shell',
  HTTP: 'http',
  CUSTOM: 'custom'
} as const;
```

**统一方案**: 使用联合类型 + const断言

```typescript
// src/types/shared/tool.types.ts

// 工具类别联合类型
export type ToolCategory = 'filesystem' | 'shell' | 'http' | 'database' | 'custom';

// 工具类别常量
export const ToolCategory = {
  FILESYSTEM: 'filesystem',
  SHELL: 'shell',
  HTTP: 'http',
  DATABASE: 'database',
  CUSTOM: 'custom'
} as const satisfies Record<ToolCategory, string>;

// 工具类别数组（用于下拉选择等场景）
export const TOOL_CATEGORY_LIST = Object.values(ToolCategory);
```

#### 2. Status 类型重复定义

```typescript
// 发现位置1: StepStatus in session
type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

// 发现位置2: TaskStatus in agent
type TaskStatus = 'idle' | 'running' | 'success' | 'failed';
```

**统一方案**: 合并为统一的Status枚举

```typescript
// src/types/shared/common.types.ts

// 执行状态枚举
export enum ExecutionStatus {
  Idle = 'idle',
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled'
}

// 任务状态（别名，方便语义化使用）
export type TaskStatus = ExecutionStatus;
export type StepStatus = ExecutionStatus;
```

#### 3. Message 类型重复定义

```typescript
// 发现多个位置的Message定义略有不同
// 需要统一为一个标准接口
```

**统一方案**: 创建标准化Message类型

```typescript
// src/types/shared/agent.types.ts

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface MessageContent {
  type: 'text' | 'tool_call' | 'tool_result' | 'error';
  text?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  error?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent | string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokens?: number;
    finishReason?: 'stop' | 'length' | 'error';
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  callId: string;
  result: unknown;
  error?: string;
}
```

### 目录结构

```
src/types/
├── index.ts                    # 类型导出入口
├── shared/
│   ├── index.ts                # shared目录导出
│   ├── common.types.ts         # 通用类型（Status、Result等）
│   ├── tool.types.ts           # 工具系统类型
│   ├── agent.types.ts          # Agent核心类型（Message、Session等）
│   └── session.types.ts        # 会话类型
├── api/
│   └── response.types.ts       # API响应类型
└── store/
    └── store.types.ts          # Zustand Store类型
```

### 迁移策略

#### Phase 1: 创建新类型文件
```typescript
// src/types/shared/tool.types.ts
// 创建统一的工具类型定义
```

#### Phase 2: 更新import引用
```typescript
// 从
import { ToolCategory } from '@/features/session/tools/toolRegistry';

// 改为
import { ToolCategory } from '@/types/shared/tool.types';
```

#### Phase 3: 添加类型导出入口
```typescript
// src/types/index.ts
export * from './shared';
export * from './api';
export * from './store';
```

#### Phase 4: 验证无遗漏
```bash
# 搜索是否还有遗漏的重复定义
grep -r "type ToolCategory" src/
grep -r "enum ToolCategory" src/
```

### 关键实现细节

#### 1. 使用satisfies确保类型安全
```typescript
// 使用satisfies验证常量对象类型
export const ToolCategory = {
  FILESYSTEM: 'filesystem',
  SHELL: 'shell',
  HTTP: 'http',
} as const satisfies Record<ToolCategory, string>;
```

#### 2. 类型别名保持向后兼容
```typescript
// 为旧名称创建别名，避免破坏性变更
export type { ToolCategory as ToolCategoryType };
export { ToolCategory };
```

#### 3. 导出辅助类型 guards
```typescript
// 类型 guards
export function isToolCategory(value: string): value is ToolCategory {
  return TOOL_CATEGORY_LIST.includes(value as ToolCategory);
}
```

### 安全考虑
- 无安全相关变更（本Story为纯类型重构）

### 性能考虑
- 无性能影响（仅影响编译时的类型检查）
