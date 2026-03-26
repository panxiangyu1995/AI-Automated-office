# Tasks: 类型定义统一

## 任务列表

### Task 137: 类型定义统一

| 属性 | 值 |
|------|-----|
| **描述** | 统一代码库中重复的类型定义，如ToolCategory、StepStatus等在不同模块的定义 |
| **Epic** | Epic 56 - 技术债务与优化 |
| **Story** | Story 56.2 |
| **implementationType** | polish |
| **优先级** | low |
| **阶段** | 技术债务与优化 |
| **是否需要后端** | 否 |
| **依赖** | 无 |

### 验收标准

- [ ] 完成代码库类型审计，输出类型清单
- [ ] 创建统一的 `src/types/shared/` 共享类型目录
- [ ] ToolCategory 类型统一，无重复定义
- [ ] StepStatus/TaskStatus 类型统一，无重复定义
- [ ] 所有模块引用更新到统一类型
- [ ] TypeScript编译无错误
- [ ] 现有功能不受影响

---

## 详细任务步骤

### Step 1: 类型审计 - 搜索重复定义
**预估时间**: 2小时
- 搜索代码库中的重复类型定义
- 整理类型清单和现状分析

**验收标准**:
- [ ] 列出所有重复类型的文件位置
- [ ] 分析每个重复类型的使用场景
- [ ] 确定统一方案

**搜索关键词**:
```bash
grep -rn "type ToolCategory" src/
grep -rn "enum ToolCategory" src/
grep -rn "type StepStatus" src/
grep -rn "type TaskStatus" src/
grep -rn "interface Message" src/
```

### Step 2: 创建共享类型目录结构
**预估时间**: 1小时
- 创建 `src/types/shared/` 目录
- 创建类型索引文件

**验收标准**:
- [ ] 目录结构符合设计文档
- [ ] 类型文件可正常导入

**创建文件**:
```
src/types/
├── index.ts
├── shared/
│   ├── index.ts
│   ├── common.types.ts
│   ├── tool.types.ts
│   ├── agent.types.ts
│   └── session.types.ts
```

### Step 3: 统一ToolCategory定义
**预估时间**: 2小时
- 定义统一的ToolCategory类型
- 更新所有引用文件

**验收标准**:
- [ ] ToolCategory类型定义统一
- [ ] 所有import引用更新
- [ ] TypeScript编译通过

**需要更新的文件（预估）**:
- `src/features/session/tools/toolRegistry.ts`
- `src/features/agent/types/tool.types.ts`
- `src/lib/tools.ts`

### Step 4: 统一Status类型定义
**预估时间**: 2小时
- 定义统一的ExecutionStatus枚举
- 创建StepStatus/TaskStatus别名
- 更新所有引用

**验收标准**:
- [ ] Status类型定义统一
- [ ] 别名映射正确
- [ ] 所有import引用更新

**需要更新的文件（预估）**:
- `src/features/session/executor/stepExecutor.ts`
- `src/features/agent/runtime/taskScheduler.ts`

### Step 5: 统一Agent核心类型
**预估时间**: 3小时
- 定义统一的Message类型
- 定义统一的Session/ToolCall类型
- 更新所有引用

**验收标准**:
- [ ] Message类型定义统一
- [ ] Session类型定义统一
- [ ] ToolCall类型定义统一
- [ ] 所有import引用更新

**需要更新的文件（预估）**:
- `src/features/agent/components/MessageList.tsx`
- `src/features/session/runtime/sessionManager.ts`
- `src/stores/appStore.ts`

### Step 6: 清理冗余类型定义
**预估时间**: 1小时
- 删除重复的类型定义
- 确保无冗余代码

**验收标准**:
- [ ] 冗余类型文件已删除
- [ ] 保留的类型文件无重复定义

### Step 7: 全面测试验证
**预估时间**: 2小时
- TypeScript编译检查
- 功能回归测试

**验收标准**:
- [ ] `npm run build` 成功
- [ ] `npm run lint` 无新增错误
- [ ] 所有功能正常

---

## 测试要点

### TypeScript编译测试
- [x] `npx tsc --noEmit` 无错误
- [x] `npm run build` 成功

### 功能回归测试
- [ ] Agent对话功能正常
- [ ] 工具调用正常
- [ ] 会话保存/恢复正常
- [ ] 流式输出正常

### 代码质量检查
- [x] ESLint检查通过
- [x] 无新增重复类型定义

---

## 类型清单模板

```typescript
// 类型审计清单
const typeAudit = {
  ToolCategory: {
    locations: [
      'src/features/session/tools/toolRegistry.ts',
      'src/features/agent/types/tool.types.ts',
    ],
    status: 'pending', // pending, in-progress, completed
    solution: '使用联合类型 + const断言',
  },
  StepStatus: {
    locations: [
      'src/features/session/executor/stepExecutor.ts',
    ],
    status: 'pending',
    solution: '统一使用ExecutionStatus枚举',
  },
};
```
