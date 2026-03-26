# Specification: 类型定义统一

## 需求来源

### PRD 需求
- 无具体FR需求（本Story为代码质量优化）

### NFR约束
- NFR22: 可维护性要求

---

## 输入输出规格

### 输入规格

| 输入参数 | 类型 | 必填 | 校验规则 | 说明 |
|---------|------|------|----------|------|
| 无外部输入 | - | - | - | 本Story为代码重构 |

### 输出规格

| 输出产物 | 类型 | 描述 |
|---------|------|------|
| 类型定义文件 | .ts文件 | 统一后的类型定义 |
| 类型索引文件 | index.ts | 统一导出入口 |
| 编译产物 | .js文件 | 无变化 |

---

## 统一类型规格

### 1. ToolCategory 类型

| 属性 | 值 |
|------|-----|
| **类型名称** | ToolCategory |
| **定义方式** | 联合类型 + const对象 |
| **位置** | `src/types/shared/tool.types.ts` |

```typescript
// 联合类型定义
export type ToolCategory = 'filesystem' | 'shell' | 'http' | 'database' | 'custom';

// 常量对象
export const ToolCategory = {
  FILESYSTEM: 'filesystem',
  SHELL: 'shell',
  HTTP: 'http',
  DATABASE: 'database',
  CUSTOM: 'custom'
} as const satisfies Record<ToolCategory, string>;
```

### 2. ExecutionStatus (StepStatus/TaskStatus) 类型

| 属性 | 值 |
|------|-----|
| **类型名称** | ExecutionStatus |
| **定义方式** | 枚举 |
| **位置** | `src/types/shared/common.types.ts` |

```typescript
export enum ExecutionStatus {
  Idle = 'idle',
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled'
}

// 类型别名（向后兼容）
export type TaskStatus = ExecutionStatus;
export type StepStatus = ExecutionStatus;
```

### 3. Message 类型

| 属性 | 值 |
|------|-----|
| **类型名称** | Message |
| **定义方式** | 接口 |
| **位置** | `src/types/shared/agent.types.ts` |

```typescript
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
```

### 4. ToolCall 类型

| 属性 | 值 |
|------|-----|
| **类型名称** | ToolCall |
| **定义方式** | 接口 |
| **位置** | `src/types/shared/agent.types.ts` |

```typescript
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

### 5. Session 类型

| 属性 | 值 |
|------|-----|
| **类型名称** | Session |
| **定义方式** | 接口 |
| **位置** | `src/types/shared/session.types.ts` |

```typescript
export interface Session {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}
```

---

## 验收场景 (Given-When-Then格式)

### Scenario 1: 类型定义统一
**GIVEN** 开发者需要使用ToolCategory类型
**WHEN** 从 `@/types/shared/tool.types` 导入类型
**THEN** 类型定义与代码库其他地方使用的完全一致

### Scenario 2: 向后兼容
**GIVEN** 旧代码使用 `StepStatus` 类型别名
**WHEN** 代码编译时
**THEN** `StepStatus` 正确映射到 `ExecutionStatus`，无类型错误

### Scenario 3: 类型guards验证
**GIVEN** 需要验证某个字符串是否为有效的ToolCategory
**WHEN** 调用 `isToolCategory('filesystem')`
**THEN** 返回 `true`；调用 `isToolCategory('invalid')` 返回 `false`

### Scenario 4: 导入入口一致性
**GIVEN** 开发者从 `src/types/index.ts` 导入类型
**WHEN** 需要导入Message类型
**THEN** 可以使用 `import { Message } from '@/types'` 获取完整类型

---

## 边界条件

### 边界条件 1: 空字符串ToolCategory
- **输入**: `isToolCategory('')`
- **预期**: 返回 `false`

### 边界条件 2: 数字类型传入
- **输入**: `isToolCategory(123)`
- **预期**: TypeScript编译错误（类型保护）

### 边界条件 3: 大小写敏感
- **输入**: `isToolCategory('Filesystem')` (大写F)
- **预期**: 返回 `false`

### 边界条件 4: 未来新增类别
- **场景**: 未来需要新增工具类别
- **预期**: 只需在ToolCategory联合类型和常量对象中添加新值

---

## 错误处理

### 错误码定义

| 错误码 | 错误信息 | 错误类型 | 处理方式 |
|--------|----------|----------|----------|
| TYPE-001 | 重复的类型定义发现 | Warning | 记录并计划统一 |
| TYPE-002 | 导入路径未更新 | Error | 编译失败，需修复导入 |
| TYPE-003 | 类型不兼容 | Error | TypeScript编译错误提示 |

### 迁移错误处理

1. **编译错误**: 详细的错误信息指出具体文件和行号
2. **运行时错误**: 统一类型后应无运行时错误
3. **缺失导入**: 使用IDE自动修复或手动添加

---

## 目录结构规范

```
src/types/
├── index.ts                 # 主入口，导出所有类型
├── shared/                  # 共享类型目录
│   ├── index.ts            # shared入口
│   ├── common.types.ts     # 通用类型（Status、Result）
│   ├── tool.types.ts       # 工具类型（ToolCategory、Tool）
│   ├── agent.types.ts      # Agent类型（Message、Session、ToolCall）
│   └── session.types.ts    # 会话类型
├── api/                    # API相关类型
│   └── response.types.ts
└── store/                  # Store相关类型
    └── store.types.ts
```

---

## 迁移检查清单

- [ ] `src/features/session/tools/toolRegistry.ts` - import已更新
- [ ] `src/features/agent/types/tool.types.ts` - import已更新
- [ ] `src/lib/tools.ts` - import已更新
- [ ] `src/features/session/executor/stepExecutor.ts` - 使用统一Status
- [ ] `src/features/agent/runtime/taskScheduler.ts` - 使用统一Status
- [ ] `src/features/agent/components/MessageList.tsx` - 使用统一Message
- [ ] `src/stores/appStore.ts` - 使用统一Session类型
- [ ] 无新增重复类型定义
