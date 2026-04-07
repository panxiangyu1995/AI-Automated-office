# Tasks: Agent-to-Agent通信后端集成

## 实现类型
- **类型**: enhancement
- **优先级**: critical (P0)
- **阶段**: Phase 3 - P0核心

## 任务列表

### Task 1: 创建Agent间消息数据模型
- **描述**: 定义AgentMessage和相关数据结构
- **文件**:
  - `src-tauri/src/agent/intercom/types.rs` (新建)
- **验收**: 数据模型符合FR600参与者ID格式
- **状态**: ✅ 已完成

### Task 2: 实现Agent消息路由服务
- **描述**: 创建AgentIntercomService，实现消息发送、路由、状态追踪
- **文件**:
  - `src-tauri/src/agent/intercom/service.rs` (新建)
  - `src-tauri/src/agent/intercom/mod.rs`
- **验收**: 消息能够正确路由和状态更新
- **状态**: ✅ 已完成

### Task 3: 实现消息权限校验中间件
- **描述**: 实现AgentPermissionMiddleware，校验发送和接收权限
- **文件**:
  - `src-tauri/src/agent/intercom/permission.rs` (新建)
- **验收**: 未授权消息被正确拒绝
- **状态**: ✅ 已完成

### Task 4: 实现审计日志记录
- **描述**: 实现AuditLogger，记录所有Agent间通信
- **文件**:
  - `src-tauri/src/agent/intercom/audit.rs` (新建)
- **验收**: 所有通信可追溯查询
- **状态**: ✅ 已完成

### Task 5: 实现消息状态追踪
- **描述**: 实现已发送/已送达/已读状态更新
- **文件**:
  - `src-tauri/src/agent/intercom/status.rs` (新建)
- **验收**: 状态更新正确及时
- **状态**: ✅ 已完成

### Task 6: 与前端AgentIntercom集成
- **描述**: 前端组件调用后端API
- **文件**:
  - `src-tauri/src/commands/intercom.rs`
  - `src/features/agent/hooks/useAgentIntercom.ts`
  - `src/features/agent/api/intercom.ts`
- **验收**: UI与后端正常通信
- **状态**: ✅ 已完成

### Task 7: 浏览器测试
- **描述**: 测试Agent间消息发送和接收
- **验收**: 端到端流程正常
- **状态**: ⏳ 待测试

## 已实现功能

### 后端 (Rust)
1. **types.rs** - 数据模型定义
   - AgentMessage, AgentPermission, AgentIntercomConfig
   - ParticipantType, MessageContent, MessageStatus
   - AgentIntercomError, AuditLogEntry

2. **permission.rs** - 权限校验中间件
   - check_send_permission / check_receive_permission
   - check_content_restriction
   - 速率限制 (Rate limiting)

3. **audit.rs** - 审计日志
   - record_send / record_receive
   - record_permission_check
   - record_status_change
   - query_audit_logs

4. **status.rs** - 状态追踪
   - MessageStatusTracker
   - DeliveryTracker (通知追踪)

5. **service.rs** - 核心服务
   - send_message
   - confirm_message (FR60)
   - get_messages (FR61)
   - recall_message (FR63)
   - set_permission (FR62)

6. **commands/intercom.rs** - Tauri命令
   - send_agent_message
   - get_agent_messages
   - update_agent_message_status
   - confirm_agent_message
   - set_agent_permission / get_agent_permission
   - recall_agent_message

### 前端 (TypeScript/React)
1. **useAgentIntercom.ts** - React Hook
   - useAgentIntercom(currentAgentId)
   - sendMessage / updateMessageStatus
   - confirmMessage / recallMessage
   - setPermission / getPermission
   - blockAgent / unblockAgent

2. **api/intercom.ts** - API客户端
   - sendAgentMessage
   - getAgentMessages
   - updateAgentMessageStatus
   - confirmAgentMessage
   - setAgentPermission
   - getAgentPermission
   - recallAgentMessage

## 测试要点

- [x] 单元测试：消息数据模型 (types.rs 内置测试)
- [x] 单元测试：权限校验逻辑 (permission.rs 内置测试)
- [x] 集成测试：消息发送和路由 (service.rs 内置测试)
- [ ] E2E 测试：完整Agent间通信流程
- [ ] 浏览器测试：AgentIntercom UI

## 需求覆盖

| FR | 需求 | 实现位置 |
|----|------|----------|
| FR59 | AI Agent可以给其他员工的AI Agent发送消息 | service.rs:send_message |
| FR60 | AI Agent发送重要消息前需员工确认 | service.rs:confirm_message |
| FR61 | 员工可以查看自己AI Agent的所有发送和接收记录 | service.rs:get_messages |
| FR62 | 员工可以设置AI Agent的通信权限 | service.rs:set_permission |
| FR63 | 员工可以撤回AI Agent发送的消息 | service.rs:recall_message |
| FR64 | AI Agent接收的消息会通知员工并记录到日志 | service.rs:deliver_message + audit.rs |
| FR65 | AI Agent不能访问员工未授权的数据 | permission.rs:check_*_permission |
| FR66 | 系统可以设置Agent间通信的内容审核规则 | permission.rs:check_content_restriction |
| FR600 | 系统支持统一的参与者ID格式 | types.rs:ParticipantType |
| FR622 | 消息支持已发送、已送达、已读状态 | types.rs:MessageStatus |
| FR623 | Agent消息同样支持状态追踪 | status.rs:MessageStatusTracker |
