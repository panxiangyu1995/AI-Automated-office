# Tasks: 安全检查强化

## 任务列表

### Task 135: 安全检查强化

| 属性 | 值 |
|------|-----|
| **Epic** | Epic 55 - 治理与可靠性增强 |
| **Story** | Story 55.4 |
| **标题** | 安全检查强化 |
| **描述** | 强化 Agent 安全检查，包括敏感数据检测、黑名单拦截、权限校验、输入验证。 |
| **implementationType** | refactor |
| **优先级** | high |
| **阶段** | Phase 5 - 治理与可靠性增强 |
| **后端必需** | true |

### 验收标准

| 编号 | 验收标准 | 验证方式 |
|------|----------|----------|
| AC1 | sensitiveActionDetection 支持所有定义的敏感数据类型 | 单元测试验证 |
| AC2 | 黑名单过滤正常工作 | 集成测试验证 |
| AC3 | 字段级权限校验正常工作 | 单元测试验证 |
| AC4 | 敏感数据脱敏正常工作 | 单元测试验证 |
| AC5 | 安全告警正确发送 | 集成测试验证 |
| AC6 | 安全检查性能影响在可接受范围内 | 性能测试验证 |

---

## 实现任务

### Phase 1: 后端基础设施

#### T1.1: 创建安全模块结构
- **文件**: `src-tauri/src/agent/security/mod.rs`
- **内容**:
  - 定义模块结构
  - 导出子模块
  - 初始化安全服务
- **验收**: 模块可正常编译

#### T1.2: 实现数据模型
- **文件**: `src-tauri/src/agent/security/models.rs`
- **内容**:
  - `SensitivePattern` 结构体
  - `SecurityViolation` 结构体
  - `FieldPermission` 结构体
  - `SecurityAlert` 结构体
  - `MaskConfig` 结构体
- **验收**: 模型可通过 Rust 编译

#### T1.3: 实现敏感数据检测器
- **文件**: `src-tauri/src/agent/security/sensitive_detector.rs`
- **内容**:
  - `SensitiveDetector` 结构体
  - `detect()` 方法
  - 内置模式检测方法（email, phone, id_card, credit_card, password）
  - 正则匹配方法
  - 关键词匹配方法
- **验收**: 可正确检测各类敏感数据

#### T1.4: 实现黑名单过滤器
- **文件**: `src-tauri/src/agent/security/blacklist_filter.rs`
- **内容**:
  - `BlacklistFilter` 结构体
  - `filter()` 方法
  - 白名单检查方法
- **验收**: 可正确过滤黑名单内容

#### T1.5: 实现权限检查器
- **文件**: `src-tauri/src/agent/security/permission_checker.rs`
- **内容**:
  - `PermissionChecker` 结构体
  - `check_field_permission()` 方法
  - 角色检查方法
- **验收**: 可正确检查字段权限

#### T1.6: 实现数据脱敏器
- **文件**: `src-tauri/src/agent/security/data_masker.rs`
- **内容**:
  - `DataMasker` 结构体
  - `mask_value()` 方法
  - `mask_object()` 方法
  - 支持 full, partial, hash 脱敏方式
- **验收**: 可正确脱敏各类数据

#### T1.7: 实现告警服务
- **文件**: `src-tauri/src/agent/security/alert_service.rs`
- **内容**:
  - `AlertService` 结构体
  - `trigger_alert()` 方法
  - `acknowledge_alert()` 方法
  - `resolve_alert()` 方法
- **验收**: 可正确触发和确认告警

#### T1.8: 实现 Tauri 命令
- **文件**: `src-tauri/src/agent/commands/security_commands.rs`
- **内容**:
  - `check_sensitive_data` 命令
  - `filter_blacklist` 命令
  - `check_field_permission` 命令
  - `mask_sensitive_data` 命令
  - `get_security_alerts` 命令
  - `acknowledge_security_alert` 命令
  - `add_sensitive_pattern` 命令
  - `get_sensitive_patterns` 命令
- **验收**: 命令可通过 IPC 调用

### Phase 2: 前端实现

#### T2.1: 扩展敏感数据检测类型定义
- **文件**: `src/types/security.types.ts`
- **内容**:
  - `SensitivePattern` 接口
  - `SecurityCheckResult` 接口
  - `SecurityViolation` 接口
  - `FieldPermission` 接口
  - `SecurityAlert` 接口
  - `MaskingConfig` 接口
- **验收**: TypeScript 类型检查通过

#### T2.2: 创建安全 Store
- **文件**: `src/stores/securityStore.ts`
- **内容**:
  - Zustand store 定义
  - state 和 actions
- **验收**: Store 可正常使用

#### T2.3: 扩展 sensitiveActionDetection
- **文件**: `src/features/session/tools/sensitiveActionDetection.ts`
- **内容**:
  - 扩展敏感模式检测
  - 集成后端检测服务
  - 支持多种敏感类型
- **验收**: 检测功能正常

#### T2.4: 创建安全检查 Hook
- **文件**: `src/hooks/useSecurityCheck.ts`
- **内容**:
  - `check()` 方法
  - `filterBlacklist()` 方法
  - `checkPermission()` 方法
  - `maskData()` 方法
- **验收**: Hook 可正常使用

#### T2.5: 创建黑名单管理组件
- **文件**: `src/features/agent/components/BlacklistManager.tsx`
- **内容**:
  - 黑名单列表展示
  - 添加/删除黑名单
  - 启用/禁用黑名单
- **验收**: 组件正常工作

#### T2.6: 创建字段权限管理组件
- **文件**: `src/features/agent/components/FieldPermissionManager.tsx`
- **内容**:
  - 权限配置列表
  - 添加/编辑权限
  - 删除权限
- **验收**: 组件正常工作

#### T2.7: 创建安全告警面板
- **文件**: `src/features/agent/components/SecurityAlertPanel.tsx`
- **内容**:
  - 告警列表展示
  - 告警级别展示
  - 确认告警按钮
  - 过滤告警
- **验收**: 组件正常工作

### Phase 3: 集成与测试

#### T3.1: 集成安全检查到工具执行管道
- **文件**: `src-tauri/src/agent/tools/`
- **内容**:
  - 集成敏感数据检测
  - 集成黑名单过滤
  - 集成权限检查
- **验收**: 工具执行时自动进行安全检查

#### T3.2: 集成数据脱敏到输出处理
- **文件**: `src-tauri/src/agent/`
- **内容**:
  - 集成数据脱敏
  - 实现脱敏豁免
- **验收**: 输出数据正确脱敏

#### T3.3: 集成告警到安全检查
- **文件**: `src-tauri/src/agent/security/`
- **内容**:
  - 集成告警服务
  - 实现实时告警
- **验收**: 安全事件正确触发告警

#### T3.4: 单元测试
- **文件**: `tests/unit/security/`
- **内容**:
  - `sensitive_detector.test.ts`
  - `blacklist_filter.test.ts`
  - `data_masker.test.ts`
  - `permission_checker.test.ts`
- **验收**: 所有测试通过

#### T3.5: 集成测试
- **文件**: `tests/integration/security/`
- **内容**:
  - `security_check_flow.test.ts`
  - `alert_flow.test.ts`
- **验收**: 所有测试通过

#### T3.6: E2E 测试
- **内容**:
  - 敏感数据检测测试
  - 黑名单拦截测试
  - 权限校验测试
- **验收**: 所有测试通过

---

## 执行顺序

1. **Phase 0**: 确保后端基础设施就绪（Task 101）
2. **Phase 1**: 后端基础设施开发（T1.1 - T1.8）
3. **Phase 2**: 前端实现（T2.1 - T2.7）
4. **Phase 3**: 集成与测试（T3.1 - T3.6）
5. **Phase 4**: 浏览器测试（使用 Playwright MCP）

---

## 测试要点

### 单元测试
- [ ] Email 检测测试
- [ ] Phone 检测测试
- [ ] ID Card 检测测试
- [ ] Credit Card 检测测试
- [ ] Password 检测测试
- [ ] 正则模式检测测试
- [ ] 黑名单过滤测试
- [ ] 全脱敏测试
- [ ] 部分脱敏测试
- [ ] Hash 脱敏测试
- [ ] 字段权限检查测试

### 集成测试
- [ ] 安全检查流程测试
- [ ] 告警触发测试
- [ ] 权限校验流程测试

### E2E 测试（根据优先级）
- [ ] 敏感数据检测测试
- [ ] 黑名单拦截测试
- [ ] 权限校验测试
- [ ] 脱敏输出测试

### 浏览器测试
- [ ] BlacklistManager 正常工作
- [ ] FieldPermissionManager 正常工作
- [ ] SecurityAlertPanel 正常工作
- [ ] 配置保存正常

---

## 验收清单

### 功能验收
- [ ] 敏感数据检测支持所有类型
- [ ] 黑名单过滤正常工作
- [ ] 字段权限校验正常工作
- [ ] 数据脱敏正常工作
- [ ] 安全告警正确发送

### 性能验收
- [ ] 敏感数据检测延迟 < 10ms
- [ ] 黑名单过滤延迟 < 5ms
- [ ] 权限检查延迟 < 5ms

### 安全验收
- [ ] 无敏感数据泄露
- [ ] 权限控制生效
- [ ] 黑名单拦截生效

### 代码质量
- [ ] TypeScript 类型完整
- [ ] Rust 所有权和生命周期正确
- [ ] 遵循项目编码规范
- [ ] 单元测试覆盖率 > 70%

### 文档
- [ ] 代码注释完整
- [ ] API 文档完整
