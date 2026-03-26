# Proposal: 安全检查强化

## 变更类型
- [x] 重构 (refactor)

## 背景

### 业务背景
随着 Agent Runtime 系统处理更多敏感业务，需要强化安全检查机制：
- 检测和保护敏感数据（如密码、密钥、个人信息）
- 防止恶意输入和攻击（如 Prompt Injection、SQL 注入）
- 实施最小权限原则和字段级权限控制
- 满足合规要求（如 GDPR、数据安全法）

### 技术背景
现有 `sensitiveActionDetection.ts` 已存在，需要扩展更多敏感模式和完善安全机制：
- 扩展 sensitiveActionDetection 支持更多敏感模式
- 实现输入内容的黑名单过滤
- 强化字段级权限校验
- 添加敏感数据的自动脱敏
- 实现安全事件的实时告警

## 目标

### 核心目标
实现安全检查强化，满足以下验收标准：

1. **扩展 sensitiveActionDetection 支持更多敏感模式**
   - 支持敏感数据类型：密码、密钥、Token、个人信息、财务信息
   - 支持检测规则的可配置
   - 支持自定义敏感词库
   - 支持正则表达式模式匹配

2. **实现输入内容的黑名单过滤**
   - 支持黑名单词库管理
   - 实现实时过滤和拦截
   - 支持白名单机制
   - 记录过滤日志

3. **强化字段级权限校验**
   - 实现基于用户角色的字段访问控制
   - 支持动态权限配置
   - 实现权限继承和覆盖
   - 记录权限校验日志

4. **添加敏感数据的自动脱敏**
   - 支持脱敏规则配置
   - 支持多种脱敏方式：掩码、部分替换、哈希
   - 实现脱敏前后对比
   - 支持脱敏豁免（管理员可见原始数据）

5. **实现安全事件的实时告警**
   - 支持告警级别分类
   - 实现实时通知
   - 支持告警聚合
   - 支持告警处理流程

## 范围

### 包含
- 扩展 sensitiveActionDetection 支持更多敏感模式
- 实现输入内容的黑名单过滤
- 强化字段级权限校验
- 添加敏感数据的自动脱敏
- 实现安全事件的实时告警

### 不包含
- 非本 Story 范围内的功能
- 身份认证和授权（由认证系统实现）
- 网络层安全（如 TLS、Firewall）
- 安全合规审计（由 Story 55.1 审计日志实现）

## 影响范围

### 前端
- **影响组件**：
  - `src/features/session/tools/sensitiveActionDetection.ts`（已存在，需扩展）
  - 可能需要新增安全配置组件
- **影响 Hooks**：
  - `useSecurityCheck` Hook
  - `useSensitiveDataMask` Hook
- **影响 Stores**：
  - `securityStore`

### 后端
- **新增模块**：
  - `src-tauri/src/agent/security/mod.rs` - 安全核心模块
  - `src-tauri/src/agent/security/sensitive_detector.rs` - 敏感数据检测
  - `src-tauri/src/agent/security/blacklist_filter.rs` - 黑名单过滤
  - `src-tauri/src/agent/security/permission_checker.rs` - 权限校验
  - `src-tauri/src/agent/security/data_masker.rs` - 数据脱敏
  - `src-tauri/src/agent/security/alert_service.rs` - 告警服务
  - `src-tauri/src/agent/security/models.rs` - 数据模型
- **Tauri 命令**：
  - `check_sensitive_data` - 检查敏感数据
  - `filter_blacklist` - 黑名单过滤
  - `check_field_permission` - 检查字段权限
  - `mask_sensitive_data` - 脱敏数据
  - `get_security_alerts` - 获取安全告警
  - `acknowledge_security_alert` - 确认安全告警

### 数据库
- **新增表结构**：
```sql
-- 敏感数据模式表
CREATE TABLE sensitive_patterns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pattern_type TEXT NOT NULL,  -- regex, keyword, builtin
    pattern_value TEXT NOT NULL,
    category TEXT NOT NULL,  -- password, key, token, personal, financial
    severity TEXT NOT NULL,  -- low, medium, high, critical
    enabled BOOLEAN DEFAULT TRUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 黑名单词库表
CREATE TABLE blacklist (
    id TEXT PRIMARY KEY,
    value TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,  -- word, phrase, regex
    reason TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    created_at INTEGER NOT NULL
);

-- 白名单表
CREATE TABLE whitelist (
    id TEXT PRIMARY KEY,
    value TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- 字段权限配置表
CREATE TABLE field_permissions (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,  -- employee, customer, invoice等
    field_name TEXT NOT NULL,
    required_role TEXT NOT NULL,
    mask_type TEXT,  -- none, partial, full, hash
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 安全告警表
CREATE TABLE security_alerts (
    id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL,  -- sensitive_data, blacklist, permission, injection
    severity TEXT NOT NULL,  -- info, warning, critical
    message TEXT NOT NULL,
    context JSON,  -- 上下文信息
    status TEXT NOT NULL,  -- triggered, acknowledged, resolved
    acknowledged_by TEXT,
    acknowledged_at INTEGER,
    resolved_at INTEGER,
    created_at INTEGER NOT NULL
);
```

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 后端基础设施缺失 | 高 | 高 | Task 101 提供基础架构，本 Story 依赖其后完成 |
| 前端接口已存在但未连接 | 中 | 中 | 逐步对接测试 |
| 安全规则配置不当 | 中 | 高 | 提供规则验证和测试机制 |
| 脱敏导致数据丢失 | 低 | 高 | 实现脱敏豁免和对比机制 |
| 误报导致正常请求被拦截 | 中 | 中 | 实现白名单机制 |

## 依赖

### 前置依赖
- **Task 101**: 后端 Rust Agent 基础架构（必须先完成）
- **Story 51.3**: 工具执行管道 - 完整执行链
- **Story 45.3**: 敏感操作检测（相关）

### 后置依赖
- **Story 55.1**: 完整审计日志系统（记录安全事件）
- **Story 55.3**: 性能监控与指标收集（监控安全指标）

## 实现步骤

1. **扩展 sensitiveActionDetection 支持更多敏感模式**
   - 设计敏感数据类型和级别
   - 实现内置敏感模式库
   - 实现自定义模式配置
   - 实现正则表达式引擎集成

2. **实现输入内容的黑名单过滤**
   - 设计黑名单词库管理
   - 实现实时过滤算法
   - 实现白名单机制
   - 记录过滤日志

3. **强化字段级权限校验**
   - 设计权限模型
   - 实现权限检查器
   - 实现动态权限配置
   - 记录权限校验日志

4. **添加敏感数据的自动脱敏**
   - 设计脱敏规则
   - 实现多种脱敏方式
   - 实现脱敏豁免机制
   - 实现脱敏对比

5. **实现安全事件的实时告警**
   - 实现告警服务
   - 实现告警级别分类
   - 实现实时通知
   - 实现告警处理流程

## 验收标准

- [ ] sensitiveActionDetection 支持所有定义的敏感数据类型
- [ ] 黑名单过滤正常工作
- [ ] 字段级权限校验正常工作
- [ ] 敏感数据脱敏正常工作
- [ ] 安全告警正确发送
- [ ] 安全检查性能影响在可接受范围内
