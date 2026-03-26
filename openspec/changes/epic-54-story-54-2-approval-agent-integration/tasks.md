# Tasks: 审批中心 - Agent集成

## 任务列表

### Task 125: 审批中心 - Agent集成

| 属性 | 值 |
|------|-----|
| **ID** | 125 |
| **Epic** | Epic 54 - 业务模块动态化 |
| **Story** | Story 54.2 |
| **Title** | 审批中心 - Agent集成 |
| **implementationType** | `refactor` (基于现有代码重构扩展) |
| **优先级** | `high` |
| **阶段** | Phase 4 - 业务模块动态化 |
| **后端必需** | `true` |

#### 描述
将审批中心与 Agent Runtime 集成，支持 Agent 自动创建审批、查询审批状态、处理审批结果。

#### 现有代码状态
- **前端**: `src/features/agent/components/ApprovalPilotIntegration.tsx` 组件已有
- **后端**: 需要基于 Story 54.1 的审批引擎创建工具集
- **数据库**: 使用 Story 54.1 定义的表结构

---

## 详细任务列表

### Phase 1: 工具定义与注册

#### Task 1.1: 创建前端工具定义
- [ ] 创建 `src/features/approval/tools/approvalTools.ts`
- [ ] 定义 `approval_create` 工具
- [ ] 定义 `approval_query` 工具
- [ ] 定义 `approval_query_by_applicant` 工具
- [ ] 定义 `approval_query_pending` 工具
- [ ] 定义 `approval_approve` 工具
- [ ] 定义 `approval_reject` 工具
- [ ] 定义 `approval_cancel` 工具
- [ ] 为每个工具编写示例和使用说明

#### Task 1.2: 创建工具类型定义
- [ ] 创建 `src/features/agent/tools/types/toolDefinition.ts`
- [ ] 定义 `ToolDefinition` 接口
- [ ] 定义 `ToolParameter` 接口
- [ ] 定义 `ToolReturn` 接口
- [ ] 定义 `ToolExample` 接口

#### Task 1.3: 注册工具到工具注册表
- [ ] 修改 `src/features/agent/tools/toolRegistry.ts`
- [ ] 导入审批工具定义
- [ ] 在工具注册时包含审批工具
- [ ] 验证工具正确注册

---

### Phase 2: 后端工具实现

#### Task 2.1: 创建后端工具模块
- [ ] 创建 `src-tauri/src/agent/tools/approval_tools.rs`
- [ ] 创建 `ApprovalToolRegistry` 结构体
- [ ] 实现工具注册方法

#### Task 2.2: 实现工具处理器
- [ ] 实现 `handle_create` - 创建审批请求
- [ ] 实现 `handle_query` - 查询审批状态
- [ ] 实现 `handle_query_pending` - 查询待审批列表
- [ ] 实现 `handle_approve` - 审批通过
- [ ] 实现 `handle_reject` - 审批拒绝
- [ ] 实现 `handle_cancel` - 取消审批

#### Task 2.3: 定义工具错误类型
- [ ] 定义 `ToolError` 结构体
- [ ] 实现错误工厂方法
- [ ] 实现 `From<ToolError>` for `ToolResult`

#### Task 2.4: 注册工具模块
- [ ] 修改 `src-tauri/src/agent/tools/mod.rs`
- [ ] 导入 `approval_tools` 子模块
- [ ] 在工具注册表中注册审批工具

---

### Phase 3: 意图识别与上下文集成

#### Task 3.1: 创建意图识别配置
- [ ] 创建 `src/features/agent/tools/intent/approvalIntents.ts`
- [ ] 定义 `create_approval` 意图模式
- [ ] 定义 `query_approval` 意图模式
- [ ] 定义 `approve` 意图模式
- [ ] 定义 `reject` 意图模式
- [ ] 配置实体提取规则

#### Task 3.2: 创建审批上下文管理
- [ ] 修改 `src/features/agent/stores/agentStore.ts`
- [ ] 添加 `approvalContext` 状态
- [ ] 实现 `updateApprovalContext` 方法
- [ ] 实现审批状态订阅机制

#### Task 3.3: 创建状态消息生成器
- [ ] 创建 `src/features/approval/utils/statusMessage.ts`
- [ ] 实现 `generateStatusMessage` 函数
- [ ] 实现 `generatePendingMessage` 函数
- [ ] 实现 `generateHistoryMessage` 函数

---

### Phase 4: 前端组件扩展

#### Task 4.1: 扩展 ApprovalPilotIntegration 组件
- [ ] 修改 `src/features/agent/components/ApprovalPilotIntegration.tsx`
- [ ] 集成工具调用逻辑
- [ ] 集成状态消息展示
- [ ] 添加用户交互处理

#### Task 4.2: 创建 Agent 工具适配器
- [ ] 创建 `src/features/agent/tools/adapters/approvalAdapter.ts`
- [ ] 实现工具调用的参数转换
- [ ] 实现结果的自然语言格式化
- [ ] 处理错误和异常

#### Task 4.3: 添加工具调用 UI 组件
- [ ] 创建 `src/features/approval/components/ApprovalToolCall.tsx`
- [ ] 显示工具调用状态
- [ ] 显示工具调用结果
- [ ] 处理用户确认和取消

---

## 验收标准

### 功能验收

| # | 验收标准 | 验证方法 |
|---|----------|----------|
| AC-1 | 创建审批相关的工具集（create_approval、query_approval、approve、reject） | 工具列表 API 检查 |
| AC-2 | 实现 Agent 自动识别需要审批的场景 | 对话测试：输入"我想申请报销" |
| AC-3 | 实现审批创建时的内容自动生成 | 对话测试：创建审批并验证内容 |
| AC-4 | 集成审批状态到 Agent 对话上下文 | 对话测试：查询审批状态 |
| AC-5 | 实现审批结果的通知与处理 | 对话测试：审批通过/拒绝后反馈 |

### 技术验收

| # | 验收标准 | 验证方法 |
|---|----------|----------|
| TC-1 | 所有工具正确注册到工具注册表 | 工具列表 API 测试 |
| TC-2 | 工具调用返回正确结果 | 单元测试 |
| TC-3 | 意图识别正确匹配用户输入 | 意图匹配测试 |
| TC-4 | 审批状态正确推送到 Agent 上下文 | 状态同步测试 |
| TC-5 | 代码编译通过，无 TypeScript/Rust 错误 | `npm run build` + `cargo build` |

---

## 测试要点

### 单元测试

#### 后端单元测试
- [ ] `ApprovalToolRegistry::get_tools` 测试
- [ ] `handle_create` 处理器测试
- [ ] `handle_query` 处理器测试
- [ ] `handle_approve` 处理器测试
- [ ] `handle_reject` 处理器测试
- [ ] `handle_cancel` 处理器测试

#### 前端单元测试
- [ ] `approvalTools` 定义完整性测试
- [ ] `generateStatusMessage` 函数测试
- [ ] `generatePendingMessage` 函数测试
- [ ] 意图模式匹配测试

### 集成测试
- [ ] 完整对话流程测试：用户输入 → 意图识别 → 工具调用 → 结果展示
- [ ] 审批创建 → 查询 → 审批 → 结果反馈
- [ ] 状态上下文同步测试

### E2E 测试（根据优先级）
- [ ] Agent 审批对话端到端测试（如果时间允许）

### 浏览器测试
- [ ] ApprovalPilotIntegration 组件渲染测试
- [ ] 工具调用 UI 交互测试

---

## 执行顺序

```
1. Phase 0: 完成前置依赖
   └─ Story 54.1 (审批流程引擎)
   └─ Story 51.1 (Agent 协调器)

2. Phase 1: 工具定义与注册
   ├─ Task 1.1 - 创建前端工具定义
   ├─ Task 1.2 - 创建工具类型定义
   └─ Task 1.3 - 注册工具到工具注册表

3. Phase 2: 后端工具实现
   ├─ Task 2.1 - 创建后端工具模块
   ├─ Task 2.2 - 实现工具处理器
   ├─ Task 2.3 - 定义工具错误类型
   └─ Task 2.4 - 注册工具模块

4. Phase 3: 意图识别与上下文集成
   ├─ Task 3.1 - 创建意图识别配置
   ├─ Task 3.2 - 创建审批上下文管理
   └─ Task 3.3 - 创建状态消息生成器

5. Phase 4: 前端组件扩展
   ├─ Task 4.1 - 扩展 ApprovalPilotIntegration 组件
   ├─ Task 4.2 - 创建 Agent 工具适配器
   └─ Task 4.3 - 添加工具调用 UI 组件

6. Phase 5: 测试与验证
   └─ 执行验收标准测试
```

---

## 依赖关系

### 前置依赖
- Story 54.1 (审批中心完整实现 - 流程引擎)
- Story 51.1 (主 Agent 协调器 - 核心协调模块)

### 被依赖
- Story 54.8 (AI 暂存写回与审阅机制)

---

## 估算工作量

| Phase | 任务 | 估算时间 |
|-------|------|----------|
| Phase 1 | 工具定义与注册 | 4 小时 |
| Phase 2 | 后端工具实现 | 6 小时 |
| Phase 3 | 意图识别与上下文集成 | 4 小时 |
| Phase 4 | 前端组件扩展 | 4 小时 |
| Phase 5 | 测试与验证 | 4 小时 |
| **总计** | | **22 小时** |
