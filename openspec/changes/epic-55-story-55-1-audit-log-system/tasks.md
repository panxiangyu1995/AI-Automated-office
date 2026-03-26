# Tasks: 完整审计日志系统

## 任务列表

### Task 132: 完整审计日志系统

| 属性 | 值 |
|------|-----|
| **Epic** | Epic 55 - 治理与可靠性增强 |
| **Story** | Story 55.1 |
| **标题** | 完整审计日志系统 |
| **描述** | 实现完整的审计日志系统，记录所有 Agent 操作、工具调用、决策过程、数据变更。 |
| **implementationType** | refactor |
| **优先级** | medium |
| **阶段** | Phase 5 - 治理与可靠性增强 |
| **后端必需** | true |

### 验收标准

| 编号 | 验收标准 | 验证方式 |
|------|----------|----------|
| AC1 | AuditLogManager 支持全量审计事件类型 | 单元测试验证 |
| AC2 | Agent 决策过程有完整的日志记录 | 集成测试验证 |
| AC3 | 数据变更可追溯到具体的操作和值 | 单元测试验证 |
| AC4 | 支持多维度查询（时间、类型、用户等） | API 测试验证 |
| AC5 | 支持 JSON/CSV 格式导出 | API 测试验证 |
| AC6 | 定期归档机制正常工作 | 集成测试验证 |
| AC7 | 性能影响在可接受范围内（写入延迟 < 10ms） | 性能测试验证 |

---

## 实现任务

### Phase 1: 后端基础设施

#### T1.1: 创建审计日志模块结构
- **文件**: `src-tauri/src/agent/audit/mod.rs`
- **内容**:
  - 定义模块结构
  - 导出子模块
  - 初始化日志管理器
- **验收**: 模块可正常编译

#### T1.2: 实现数据模型
- **文件**: `src-tauri/src/agent/audit/models.rs`
- **内容**:
  - `AuditLog` 结构体
  - `AuditEvent` 结构体
  - `AuditArchive` 结构体
  - JSON 序列化/反序列化
- **验收**: 模型可通过 Rust 编译

#### T1.3: 实现日志管理器
- **文件**: `src-tauri/src/agent/audit/log_manager.rs`
- **内容**:
  - `AuditLogManager` 结构体
  - `record_event()` 方法
  - `query()` 方法
  - `export()` 方法
  - `trigger_archive()` 方法
- **验收**: 基础 CRUD 操作正常

#### T1.4: 实现事件记录器
- **文件**: `src-tauri/src/agent/audit/event_recorder.rs`
- **内容**:
  - `EventRecorder` 结构体
  - `record_tool_call()` 方法
  - `record_decision()` 方法
  - `record_data_change()` 方法
- **验收**: 可集成到 Agent 执行流程

#### T1.5: 实现 Tauri 命令
- **文件**: `src-tauri/src/agent/commands/audit_commands.rs`
- **内容**:
  - `record_audit_event` 命令
  - `query_audit_logs` 命令
  - `export_audit_logs` 命令
  - `trigger_audit_archive` 命令
  - `get_audit_log_detail` 命令
- **验收**: 命令可通过 IPC 调用

### Phase 2: 前端实现

#### T2.1: 创建审计日志类型定义
- **文件**: `src/types/audit.types.ts`
- **内容**:
  - `AuditLog` 接口
  - `AuditEventType` 类型
  - `AuditEventLevel` 类型
  - `AuditLogQuery` 接口
- **验收**: TypeScript 类型检查通过

#### T2.2: 创建审计日志 Store
- **文件**: `src/stores/auditLogStore.ts`
- **内容**:
  - Zustand store 定义
  - state 和 actions
  - 持久化配置（如需要）
- **验收**: Store 可正常使用

#### T2.3: 创建审计日志 Hook
- **文件**: `src/hooks/useAuditLog.ts`
- **内容**:
  - 查询日志
  - 导出日志
  - 获取详情
- **验收**: Hook 可正常使用

#### T2.4: 创建审计日志组件
- **文件**: `src/components/audit/AuditLogViewer.tsx`
- **文件**: `src/components/audit/AuditLogDetail.tsx`
- **内容**:
  - 日志列表展示
  - 日志详情展示
  - 查询表单
  - 导出按钮
- **验收**: 组件可正常渲染

### Phase 3: 集成与测试

#### T3.1: 集成事件记录器到 AgentOrchestrator
- **文件**: `src-tauri/src/agent/orchestrator.rs`
- **内容**:
  - 集成 EventRecorder
  - 在关键节点调用记录方法
- **验收**: Agent 执行时自动记录审计日志

#### T3.2: 集成事件记录器到工具执行管道
- **文件**: `src-tauri/src/agent/tools/executor.rs`
- **内容**:
  - 集成 EventRecorder
  - 记录工具调用和结果
- **验收**: 工具执行时自动记录审计日志

#### T3.3: 单元测试
- **文件**: `tests/unit/audit/`
- **内容**:
  - `log_manager.test.ts`
  - `event_recorder.test.ts`
  - `query_service.test.ts`
- **验收**: 所有测试通过

#### T3.4: 集成测试
- **文件**: `tests/integration/audit/`
- **内容**:
  - `audit_flow.test.ts`
  - `archive_flow.test.ts`
- **验收**: 所有测试通过

---

## 执行顺序

1. **Phase 0**: 确保后端基础设施就绪（Task 101）
2. **Phase 1**: 后端基础设施开发（T1.1 - T1.5）
3. **Phase 2**: 前端实现（T2.1 - T2.4）
4. **Phase 3**: 集成与测试（T3.1 - T3.4）
5. **Phase 4**: 浏览器测试（使用 Playwright MCP）

---

## 测试要点

### 单元测试
- [ ] `AuditLogManager.record_event()` 测试
- [ ] `AuditLogManager.query()` 测试（多条件过滤）
- [ ] `AuditLogManager.export()` 测试（JSON/CSV）
- [ ] `EventRecorder` 各方法测试
- [ ] JSON 序列化/反序列化测试

### 集成测试
- [ ] Agent 执行流程审计日志记录测试
- [ ] 工具调用审计日志记录测试
- [ ] 归档流程测试
- [ ] 性能基准测试（写入延迟 < 10ms）

### E2E 测试（根据优先级）
- [ ] 审计日志完整流程测试
- [ ] 查询和导出功能测试
- [ ] 归档功能测试

### 浏览器测试
- [ ] 审计日志列表展示正常
- [ ] 查询表单功能正常
- [ ] 导出功能正常
- [ ] 分页功能正常

---

## 验收清单

### 功能验收
- [ ] 支持所有审计事件类型
- [ ] 支持多维度查询
- [ ] 支持导出为 JSON/CSV
- [ ] 归档机制正常工作
- [ ] 性能满足要求

### 代码质量
- [ ] TypeScript 类型完整
- [ ] Rust 所有权和生命周期正确
- [ ] 遵循项目编码规范
- [ ] 单元测试覆盖率 > 70%

### 文档
- [ ] 代码注释完整
- [ ] API 文档完整
- [ ] 更新 README（如需要）
