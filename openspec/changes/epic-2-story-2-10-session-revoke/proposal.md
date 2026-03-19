# Proposal: Force Logout and Expiry Handling

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

Epic 2 会话管理系统需要完善会话撤销和过期处理功能。包括管理员强制登出用户、前端检测会话过期并自动返回登录页。

### 业务背景
- 管理员需要强制登出指定用户
- 用户会话过期时需要友好提示
- 自动引导用户重新登录

### 技术背景
- 后端 Go 实现撤销 API（ADR-005）
- 前端 React 处理会话状态（ADR-001）
- Tauri 清理本地缓存

## 目标

实现会话撤销和过期处理：
1. 会话撤销 API
2. 前端会话状态监控
3. 会话过期弹窗和跳转
4. 本地缓存清理

## 范围

### 包含
- 会话撤销 API
- 会话状态检查 API
- 前端 401 响应拦截
- 会话过期弹窗组件
- 自动跳转登录页逻辑
- 本地缓存清理命令

### 不包含
- 会话模型和超时引擎（E2-S2.10-01）
- 登录功能（E2-S2.1-02/03）

## 影响范围

### 后端
- `cloud-server/api/auth/session.go` - 会话撤销 API
- `cloud-server/internal/module/auth/application/service/session_service.go` - 撤销逻辑

### 前端
- `src/stores/authStore.ts` - 会话状态管理
- `src/lib/api.ts` - 401 响应拦截
- `src/components/common/SessionExpiredModal.tsx` - 过期弹窗

### Tauri
- `src-tauri/src/commands/session.rs` - 清理本地缓存命令

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 强制登出通知延迟 | 中 | 低 | 提供 API 轮询或 WebSocket 推送 |
| 前端状态不一致 | 低 | 中 | 统一状态管理，定期校验 |

## 实施计划

1. **Step 1**: 实现会话撤销 API
2. **Step 2**: 实现会话状态检查 API
3. **Step 3**: 前端 401 响应拦截
4. **Step 4**: 实现会话过期弹窗
5. **Step 5**: 实现自动跳转逻辑
6. **Step 6**: 实现本地缓存清理
7. **Step 7**: 测试和优化

## 依赖关系

### 前置依赖
- E2-S2.10-01: Session model and timeout engine
- E2-S2.1-03: Frontend login flow
- E2-S2.1-04: Local session cache wrapper

### 后置依赖
- E2-S2.11-02: Audit event integration