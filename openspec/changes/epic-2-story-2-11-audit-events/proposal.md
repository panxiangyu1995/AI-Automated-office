# Proposal: Audit Event Integration

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

审计日志模型已建立，现需要将其集成到各关键业务流程中，实现完整的审计追踪能力。

## 目标

1. 在认证 API 中集成审计日志
2. 在权限变更 API 中集成审计日志
3. 在会话撤销 API 中集成审计日志
4. 在导入导出流程中集成审计日志

## 范围

### 包含
- 登录/登出/刷新 Token 审计
- 用户 CRUD 操作审计
- 角色和权限变更审计
- 会话撤销审计
- 导入导出操作审计

### 不包含
- 审计日志模型（E2-S2.11-01）
- 审计查询 UI（E2-S2.11-03）

## 依赖关系

### 前置依赖
- E2-S2.11-01: Structured audit log model
- E2-S2.1-02: Login API and password policy
- E2-S2.7-01: Backend permission gateway
- E2-S2.9-02: Import commit and receipt
- E2-S2.10-02: Force logout and expiry handling