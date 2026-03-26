# Proposal: 完整审计日志系统

## 变更类型
- [x] 重构 (refactor)

## 背景

### 业务背景
随着 Agent Runtime 系统的复杂化，需要对所有 Agent 操作、工具调用、决策过程、数据变更进行完整的审计追踪。这对于：
- 合规性要求：满足企业级审计需求
- 问题排查：快速定位 Agent 执行过程中的问题
- 安全监控：识别异常行为和潜在风险
- 性能分析：为优化提供数据支撑

### 技术背景
现有 `AuditLogManager` 仅支持基础日志记录，需要扩展为完整的审计日志系统，涵盖：
- Agent 决策过程的详细记录
- 工具调用的完整上下文
- 数据变更的全链路追踪
- 审计日志的查询与导出
- 定期归档机制

## 目标

### 核心目标
实现完整的审计日志系统，满足以下验收标准：

1. **扩展 AuditLogManager 支持全量审计事件**
   - 支持事件类型：agent_action, tool_call, tool_result, decision, data_change, system_event
   - 支持事件级别：DEBUG, INFO, WARN, ERROR, CRITICAL
   - 支持事件来源：main_agent, sub_agent, tool_executor

2. **实现 Agent 决策过程的详细记录**
   - 记录意图解析结果
   - 记录计划生成过程
   - 记录步骤执行状态
   - 记录结果汇总

3. **实现数据变更的审计追踪**
   - 记录数据变更前后的值
   - 记录变更操作类型（CREATE, UPDATE, DELETE）
   - 记录变更操作者

4. **添加审计日志的查询与导出功能**
   - 支持多维度查询（时间范围、事件类型、操作者等）
   - 支持导出为 JSON/CSV 格式
   - 支持分页查询

5. **实现审计日志的定期归档**
   - 支持按时间策略归档
   - 支持压缩存储
   - 支持归档日志的查询

## 范围

### 包含
- 扩展 AuditLogManager 支持全量审计事件
- 实现 Agent 决策过程的详细记录
- 实现数据变更的审计追踪
- 添加审计日志的查询与导出功能
- 实现审计日志的定期归档

### 不包含
- 非本 Story 范围内的功能
- 前端 UI 的全新设计（仅扩展现有组件）
- 云端同步功能
- 实时告警通知（由 Story 55.4 安全检查强化实现）

## 影响范围

### 前端
- **影响组件**：
  - `src/features/agent/components/AuditLogViewer.tsx`（如存在）
  - 现有日志展示组件的扩展
- **影响 Hooks**：
  - 可能需要新增 `useAuditLog` Hook
- **影响 Stores**：
  - 可能需要新增 `auditLogStore`

### 后端
- **新增模块**：
  - `src-tauri/src/agent/audit/mod.rs` - 审计日志核心模块
  - `src-tauri/src/agent/audit/log_manager.rs` - 日志管理器
  - `src-tauri/src/agent/audit/event_recorder.rs` - 事件记录器
  - `src-tauri/src/agent/audit/query_service.rs` - 查询服务
  - `src-tauri/src/agent/audit/archive_service.rs` - 归档服务
- **新增数据库表**：
  - `audit_logs` - 审计日志主表
  - `audit_events` - 审计事件明细表
  - `audit_archives` - 归档记录表
- **Tauri 命令**：
  - `record_audit_event` - 记录审计事件
  - `query_audit_logs` - 查询审计日志
  - `export_audit_logs` - 导出审计日志
  - `trigger_archive` - 触发归档

### 数据库
- **新增表结构**：
```sql
-- 审计日志主表
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,  -- UUID
    event_type TEXT NOT NULL,  -- agent_action, tool_call, decision, data_change
    event_level TEXT NOT NULL,  -- DEBUG, INFO, WARN, ERROR, CRITICAL
    source TEXT NOT NULL,  -- main_agent, sub_agent, tool_executor
    session_id TEXT,
    trace_id TEXT,
    user_id TEXT,
    tenant_id TEXT,
    content JSON NOT NULL,  -- 事件详细内容
    created_at INTEGER NOT NULL,  -- Unix timestamp
    archived BOOLEAN DEFAULT FALSE
);

-- 审计事件明细表（用于详细追溯）
CREATE TABLE audit_events (
    id TEXT PRIMARY KEY,
    log_id TEXT NOT NULL,
    step_id TEXT,
    action TEXT NOT NULL,
    input_data JSON,
    output_data JSON,
    error_message TEXT,
    duration_ms INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (log_id) REFERENCES audit_logs(id)
);

-- 归档记录表
CREATE TABLE audit_archives (
    id TEXT PRIMARY KEY,
    archive_date TEXT NOT NULL,  -- YYYY-MM-DD
    file_path TEXT NOT NULL,
    file_size INTEGER,
    log_count INTEGER,
    compressed BOOLEAN,
    created_at INTEGER NOT NULL
);

-- 索引
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_events_log_id ON audit_events(log_id);
```

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 后端基础设施缺失 | 高 | 高 | Task 101 提供基础架构，本 Story 依赖其后完成 |
| 前端接口已存在但未连接 | 中 | 中 | 逐步对接测试，使用模拟数据验证 |
| 审计日志写入影响性能 | 中 | 中 | 使用异步写入，批量插入，索引优化 |
| 审计数据量过大导致存储问题 | 低 | 中 | 实现定期归档和压缩机制 |
| 查询性能问题 | 中 | 中 | 添加合适索引，使用分页，避免全表扫描 |

## 依赖

### 前置依赖
- **Task 101**: 后端 Rust Agent 基础架构（必须先完成）
- **Story 51.1**: 主 Agent 协调器 - 核心协调模块
- **Story 51.3**: 工具执行管道 - 完整执行链

### 后置依赖
- **Story 55.2**: 错误恢复与故障转移机制（使用审计日志进行问题诊断）
- **Story 55.3**: 性能监控与指标收集（使用审计日志进行分析）
- **Story 55.4**: 安全检查强化（使用审计日志进行安全分析）

## 实现步骤

1. **扩展 AuditLogManager 支持全量审计事件**
   - 定义审计事件类型和级别枚举
   - 设计事件内容 JSON Schema
   - 实现事件序列化和反序列化
   - 实现事件异步写入

2. **实现 Agent 决策过程的详细记录**
   - 在 AgentOrchestrator 中集成决策记录
   - 记录意图解析、计划生成、步骤执行等关键节点
   - 实现决策上下文的捕获

3. **实现数据变更的审计追踪**
   - 设计数据变更事件格式
   - 在数据操作层集成变更追踪
   - 实现变更前后的值记录

4. **添加审计日志的查询与导出功能**
   - 实现多维度查询接口
   - 支持分页和排序
   - 实现 JSON/CSV 导出

5. **实现审计日志的定期归档**
   - 设计归档策略（时间、文件大小）
   - 实现归档执行器
   - 实现归档日志的查询

## 验收标准

- [ ] AuditLogManager 支持所有定义的审计事件类型
- [ ] Agent 决策过程有完整的日志记录
- [ ] 数据变更可追溯到具体的操作和值
- [ ] 支持多维度查询和导出功能
- [ ] 定期归档机制正常工作
- [ ] 性能影响在可接受范围内（写入延迟 < 10ms）
