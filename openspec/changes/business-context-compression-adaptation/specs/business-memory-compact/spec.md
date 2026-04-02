# business-memory-compact

## ADDED Requirements

### Requirement: 业务记忆压缩触发条件

业务记忆压缩层 SHALL 在以下条件满足时触发：

- 会话存在已提取的会话记忆
- 当前 Token 数小于业务记忆压缩阈值（20,000）
- 最近摘要消息之后存在可压缩内容

#### Scenario: 优先使用会话记忆压缩

- **WHEN** 对话累积超过 5 轮且存在会话记忆
- **THEN** 系统 SHALL 使用已存储的会话记忆作为上下文基础
- **AND** SHALL 保留最近摘要消息之后的所有新消息

#### Scenario: Token 超过阈值时跳过

- **WHEN** 当前 Token 数 >= 20,000
- **THEN** 系统 SHALL 跳过业务记忆压缩
- **AND** SHALL 尝试更高层级的压缩策略

### Requirement: 业务记忆保留规则

业务记忆压缩 SHALL 保留以下业务实体：

- 当前部门上下文（current_department）
- 用户权限上下文（user_permissions）
- 最近访问的文档引用（recent_documents，最多 5 个）
- 待处理任务列表（pending_tasks）

#### Scenario: 保留部门上下文

- **WHEN** 执行业务记忆压缩
- **THEN** 系统 SHALL 保留当前部门 ID、名称和模块类型
- **AND** SHALL 保留关联部门列表

#### Scenario: 保留用户权限

- **WHEN** 执行业务记忆压缩
- **THEN** 系统 SHALL 保留用户的角色和部门权限摘要
- **AND** SHALL 保留最近使用的操作权限列表

### Requirement: 会话记忆存储

会话记忆 SHALL 在以下时机更新：

- 每次用户交互完成后
- 压缩操作完成后
- 部门切换时

#### Scenario: 交互后更新记忆

- **WHEN** 用户发送消息并收到 AI 响应后
- **THEN** 系统 SHALL 提取关键业务实体和意图
- **AND** SHALL 更新会话记忆存储

#### Scenario: 压缩后刷新记忆

- **WHEN** 压缩操作完成后
- **THEN** 系统 SHALL 基于压缩后的上下文生成新的会话摘要
- **AND** SHALL 清除过期的业务实体引用

### Requirement: 业务记忆数据结构

会话记忆 SHALL 包含以下结构化数据：

```typescript
interface BusinessSessionMemory {
  sessionId: string;
  departmentContext: {
    currentDepartment: string;
    relatedDepartments: string[];
    permissions: string[];
  };
  keyEntities: {
    documents: Array<{ id: string; name: string; lastAccessed: Date }>;
    approvals: Array<{ id: string; status: string; deadline?: Date }>;
    employees: Array<{ id: string; name: string; department: string }>;
  };
  conversationSummary: string;
  lastUpdated: Date;
}
```

#### Scenario: 完整的会话记忆结构

- **WHEN** 系统需要查询会话记忆
- **THEN** 返回的 BusinessSessionMemory SHALL 包含所有必需字段
- **AND** SHALL 按 lastUpdated 降序排列

#### Scenario: 缺失字段处理

- **WHEN** 会话记忆缺少可选字段时
- **THEN** 系统 SHALL 使用空数组或 null 作为默认值
- **AND** SHALL 不抛出错误
