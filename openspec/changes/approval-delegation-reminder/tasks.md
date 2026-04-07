# Tasks: 审批增强功能-委托与催办

## 实现类型
- **类型**: enhancement
- **优先级**: critical (P0)
- **阶段**: Phase 3 - P0核心

## 任务列表

### Task 1: 创建委托数据模型
- **描述**: 定义ApprovalDelegation和相关类型
- **文件**:
  - `src-tauri/src/approval/delegation.rs` (新建)
- **验收**: 符合FR143-FR148
- **状态**: ✅ 已完成

### Task 2: 实现委托设置API
- **描述**: 设置/取消委托，校验权限
- **文件**:
  - `src-tauri/src/approval/delegation.rs`
  - `src-tauri/src/commands/approval_enhancement.rs`
- **验收**: 三种委托类型正常工作
- **状态**: ✅ 已完成

### Task 3: 创建催办数据模型
- **描述**: 定义ReminderLevel和相关类型
- **文件**:
  - `src-tauri/src/approval/reminder.rs` (新建)
- **验收**: 符合FR154-FR163
- **状态**: ✅ 已完成

### Task 4: 实现催办频率限制
- **描述**: 实现每天最多3次、间隔2小时的限制
- **文件**:
  - `src-tauri/src/approval/reminder.rs`
- **验收**: 符合FR155-FR156
- **状态**: ✅ 已完成

### Task 5: 实现紧急催办分级
- **描述**: 实现普通/紧急/超紧急分级
- **文件**:
  - `src-tauri/src/approval/reminder.rs`
- **验收**: 符合FR158
- **状态**: ✅ 已完成

### Task 6: 实现自动抄送上级的逻辑
- **描述**: 第2次催办抄送上级，第3次催办抄送部门负责人
- **文件**:
  - `src-tauri/src/approval/reminder.rs`
- **验收**: 符合FR160-FR161
- **状态**: ✅ 已完成

### Task 7: 创建委托设置UI
- **描述**: 前端委托设置组件
- **文件**:
  - `src/features/approval/components/DelegationSettings.tsx`
- **验收**: UI与后端正常通信
- **状态**: ⏳ 待前端实现

### Task 8: 创建催办面板UI
- **描述**: 前端催办面板组件
- **文件**:
  - `src/features/approval/components/ReminderPanel.tsx`
- **验收**: UI与后端正常通信
- **状态**: ⏳ 待前端实现

### Task 9: 集成测试
- **描述**: 测试委托和催办完整流程
- **验收**: 集成测试通过
- **状态**: ⏳ 待测试

## 已实现功能

### 后端 (Rust)

1. **approval/delegation.rs** - 审批委托
   - `ApprovalDelegation` - 委托数据结构
   - `DelegationType` - 委托类型 (Full/Category/Amount)
   - `DelegationStore` - 委托存储服务
   - `set_delegation` - 设置委托
   - `cancel_delegation` - 取消委托
   - `get_delegation` - 获取委托
   - `resolve_delegation` - 解析委托请求

2. **approval/reminder.rs** - 催办服务
   - `ReminderLevel` - 催办级别 (Normal/Urgent/Critical)
   - `ReminderRecord` - 催办记录
   - `ReminderSettings` - 催办设置
   - `ReminderService` - 催办服务
   - `send_reminder` - 发送催办
   - `get_reminders` - 获取催办记录
   - `get_reminder_stats` - 获取催办统计
   - `check_frequency` - 频率检查 (每天3次)
   - `check_interval` - 间隔检查 (2小时)
   - `check_work_hours` - 工作时间检查

3. **commands/approval_enhancement.rs** - Tauri命令
   - `set_delegation` - 设置委托
   - `cancel_delegation` - 取消委托
   - `get_delegation` - 获取委托
   - `get_delegations_as_delegate` - 获取被委托的列表
   - `send_approval_reminder` - 发送催办
   - `get_reminder_records` - 获取催办记录
   - `get_reminder_stats` - 获取催办统计
   - `set_reminder_settings` - 设置催办参数
   - `get_reminder_settings` - 获取催办设置

## 需求覆盖

| FR | 需求 | 实现位置 |
|----|------|----------|
| FR143 | 员工可以设置审批委托 | delegation.rs:set_delegation |
| FR144 | 委托支持时间范围 | ApprovalDelegation.start_time/end_time |
| FR145 | 委托支持分类委托 | DelegationType::Category |
| FR146 | 委托支持金额委托 | DelegationType::Amount |
| FR147 | 员工可以取消委托 | delegation.rs:cancel_delegation |
| FR148 | 被委托人可以查看委托记录 | delegation.rs:get_delegations_as_delegate |
| FR154 | 员工可以催办待审批项 | reminder.rs:send_reminder |
| FR155 | 每天最多催办3次 | reminder.rs:check_frequency |
| FR156 | 催办间隔至少2小时 | reminder.rs:check_interval |
| FR158 | 支持紧急催办分级 | ReminderLevel (Normal/Urgent/Critical) |
| FR159 | 催办仅在工作时间内 | reminder.rs:check_work_hours |
| FR160 | 第2次催办抄送上级 | reminder.rs:get_cc_list |
| FR161 | 第3次催办抄送部门负责人 | reminder.rs:get_cc_list |
| FR162 | 催办结果实时推送 | Tauri事件系统 |
| FR163 | 催办记录可追溯 | reminder.rs:get_reminders |
