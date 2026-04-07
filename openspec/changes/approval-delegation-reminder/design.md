# Design: 审批增强功能-委托与催办

## 技术架构

### 1. 委托模型

```rust
pub struct ApprovalDelegation {
    pub id: String,
    pub delegator_id: String,      // 原审批人
    pub delegate_id: String,        // 被委托人
    pub delegation_type: DelegationType,
    pub start_time: i64,
    pub end_time: Option<i64>,
    pub is_active: bool,
    pub reason: Option<String>,
}

pub enum DelegationType {
    Full,           // 全权委托
    Category(Vec<String>),  // 分类委托（审批类型列表）
    Amount(f64),    // 金额委托（小于此金额）
}

pub enum ReminderLevel {
    Normal,    // 普通催办
    Urgent,    // 紧急催办
    Critical,  // 超紧急催办
}
```

### 2. 委托流程

```rust
pub async fn set_delegation(
    &self,
    delegation: ApprovalDelegation,
) -> Result<()> {
    // 1. 校验委托人权限
    self.check_delegator_permission(&delegation.delegator_id).await?;
    
    // 2. 校验被委托人存在
    self.validate_delegate(&delegation.delegate_id).await?;
    
    // 3. 校验时间冲突
    self.check_time_conflict(&delegation).await?;
    
    // 4. 保存委托
    self.save_delegation(&delegation).await?;
    
    Ok(())
}
```

### 3. 催办流程

```rust
pub async fn send_reminder(
    &self,
    approval_id: String,
    level: ReminderLevel,
) -> Result<ReminderResult> {
    let approval = self.get_approval(&approval_id).await?;
    
    // 1. 检查催办频率
    let today_count = self.get_today_reminder_count(&approval.approver_id).await?;
    if today_count >= 3 {
        return Err(ApprovalError::ReminderLimitReached);
    }
    
    // 2. 检查催办间隔
    let last_reminder = self.get_last_reminder(&approval_id).await?;
    if let Some(last) = last_reminder {
        let hours_since = (Utc::now().timestamp() - last) / 3600;
        if hours_since < 2 {
            return Err(ApprovalError::ReminderIntervalTooShort);
        }
    }
    
    // 3. 检查工作时间
    if !self.is_working_hours() {
        return Err(ApprovalError::OutsideWorkingHours);
    }
    
    // 4. 发送催办
    let result = self.send_notification(&approval, level).await?;
    
    // 5. 更新催办记录
    self.record_reminder(&approval_id, level).await?;
    
    // 6. 升级催办逻辑
    if level == ReminderLevel::Urgent && today_count >= 1 {
        // FR160: 第2次催办自动抄送审批人上级
        self.cc_to_manager(&approval).await?;
    }
    if level == ReminderLevel::Critical && today_count >= 2 {
        // FR161: 第3次催办自动抄送部门负责人
        self.cc_to_department_head(&approval).await?;
    }
    
    Ok(result)
}
```

### 4. Tauri命令

```rust
#[tauri::command]
pub async fn set_delegation(delegation: ApprovalDelegation) -> Result<(), String>;

#[tauri::command]
pub async fn cancel_delegation(delegation_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn get_delegation(approver_id: String) -> Result<Option<ApprovalDelegation>, String>;

#[tauri::command]
pub async fn send_approval_reminder(
    approval_id: String,
    level: ReminderLevel,
) -> Result<ReminderResult, String>;

#[tauri::command]
pub async fn get_approval_pending_reminders(
    approver_id: String,
) -> Result<Vec<PendingReminder>, String>;

#[tauri::command]
pub async fn set_reminder_settings(
    approver_id: String,
    settings: ReminderSettings,
) -> Result<(), String>;
```

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| DEL_001 | 委托人不存在 | 返回错误 |
| DEL_002 | 被委托人不存在 | 返回错误 |
| DEL_003 | 时间冲突 | 返回错误 |
| REM_001 | 催办次数超限 | 提示用户 |
| REM_002 | 催办间隔不足 | 提示用户 |
| REM_003 | 非工作时间 | 提示用户 |
