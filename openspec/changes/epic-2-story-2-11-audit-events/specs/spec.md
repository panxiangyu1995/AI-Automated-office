# Specification: Audit Event Integration

## 需求来源

### PRD 需求
- **FR27**: 用户登录系统
- **FR29**: 权限分配操作
- **FR33**: 导入导出操作

### NFR 约束
- **NFR14**: 审计日志记录所有关键操作

## 功能规格

### 验收场景

#### Scenario 1: 登录成功审计
- **GIVEN** 用户成功登录
- **WHEN** 登录完成
- **THEN** 记录审计日志 (event_type: auth.login, result: success)

#### Scenario 2: 登录失败审计
- **GIVEN** 用户登录失败
- **WHEN** 登录失败
- **THEN** 记录审计日志 (event_type: auth.login, result: failure, reason: 失败原因)

#### Scenario 3: 权限变更审计
- **GIVEN** 管理员修改权限
- **WHEN** 变更完成
- **THEN** 记录审计日志 (old_values/new_values)

#### Scenario 4: 导入审计
- **GIVEN** 批量导入用户
- **WHEN** 导入完成
- **THEN** 记录审计日志 (details: 导入统计)

## 交付物

1. 各 API 的审计集成
2. 单元测试
3. 集成测试