# Design: Agent模块UX增强

## Strategy

本轮不替换mock数据（这是R15-20的任务），只添加UX状态包裹。
Agent模块的mock数据保留但用条件判断包裹，为将来切换真实数据预留空间。

## Tasks

### Task 1: AgentIntercom添加Loading状态

- 在AgentIntercom中，当会话加载时显示ChatSkeleton
- 将mock数据延迟2秒显示（模拟加载），便于测试骨架屏效果
- 不替换现有mock数据

### Task 2: EmployeeDirectory添加EmptyState

- 搜索无结果时展示EmptyState variant="search"
- 空列表时展示EmptyState variant="data"

### Task 3: ChatPanel添加ErrorBoundary包裹

- 用ErrorBoundary包裹ChatPanel核心区域
- 错误时展示ErrorFallback而非白屏

### Task 4: SessionList添加EmptyState

- 无会话时展示EmptyState variant="data"
- 添加"创建新对话"按钮

### Task 5: 验证构建
