# Proposal: Frontend Login Flow Enhancement

## 变更类型
- [ ] 新功能
- [ ] 修复
- [x] 优化/增强
- [ ] 重构

## 背景

### 已完成的基础登录功能
`epic-1-story-11-user-login` 已实现完整的基础登录功能：
- ✅ 登录页面 UI（左右分栏布局）
- ✅ 登录/注册表单组件
- ✅ 认证状态管理（Zustand）
- ✅ 路由守卫
- ✅ 记住我功能
- ✅ 忘记密码入口
- ✅ API 调用（login, register, forgot-password）

### 业务背景
- 用户需要权限控制来访问不同功能模块（FR29, FR30）
- 需要更安全的 Token 管理机制（双 Token）
- 代码需要更好的模块化以便维护

### 技术背景
- 现有 LoginForm 组件中 API 调用和类型定义内联，不利于维护
- 现有 authStore 缺少权限管理功能
- 缺少双 Token 机制和自动刷新逻辑

## 目标

基于已实现的登录功能，进行以下增强：
1. **代码模块化** - 抽取 API 调用和类型定义
2. **权限管理** - 扩展 authStore 支持 permissions
3. **双 Token 机制** - 支持 accessToken/refreshToken
4. **useAuth Hook** - 封装认证逻辑供全局使用

## 范围

### 包含
- 创建 `useAuth` Hook（login, logout, hasPermission, hasRole）
- 创建 `authApi.ts` 模块化 API 调用
- 创建 `auth.types.ts` 模块化类型定义
- 扩展 `authStore` 支持 permissions 状态
- 实现双 Token 机制（accessToken/refreshToken）
- 实现 Token 自动刷新逻辑
- 创建 `LoginError.tsx` 错误提示组件（可选优化）

### 不包含
- 登录页面 UI（已在 epic-1-story-11-user-login 实现）
- 登录表单组件（已在 epic-1-story-11-user-login 实现）
- 路由守卫（已在 epic-1-story-11-user-login 实现）
- 后端认证 API（由 E2-S2.1-02 负责）
- 本地会话缓存（由 E2-S2.1-04 负责）

### 已实现（不在本次范围）
- LoginPage.tsx - 登录页面
- LoginForm.tsx - 登录/注册表单
- authStore.ts - 基础认证状态管理
- AuthGuard.tsx - 路由守卫
- App.tsx 路由配置

## 影响范围

### 前端文件修改
- `src/stores/authStore.ts` - 扩展 permissions 和双 Token
- `src/features/auth/components/LoginForm.tsx` - 重构使用模块化 API

### 前端文件新增
- `src/features/auth/hooks/useAuth.ts` - 认证 Hook
- `src/features/auth/api/authApi.ts` - API 封装
- `src/features/auth/types/auth.types.ts` - 类型定义
- `src/features/auth/components/LoginError.tsx` - 错误提示组件（可选）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Token 存储不安全 | 中 | 高 | 不存储敏感信息，Token 存储在内存/安全存储 |
| 权限检查遗漏 | 中 | 中 | 统一使用 useAuth Hook 进行权限检查 |
| 刷新 Token 失败 | 低 | 中 | 提供重新登录的友好提示 |

## 实施计划

1. **Step 1**: 创建 auth.types.ts 类型定义
2. **Step 2**: 创建 authApi.ts API 封装
3. **Step 3**: 扩展 authStore 支持 permissions 和双 Token
4. **Step 4**: 创建 useAuth Hook
5. **Step 5**: 重构 LoginForm 使用模块化 API
6. **Step 6**: 创建 LoginError.tsx 组件（可选）
7. **Step 7**: 编写单元测试
8. **Step 8**: E2E 测试验证

## 依赖关系

### 前置依赖
- ✅ `epic-1-story-11-user-login`: 用户登录功能（已完成）
- E2-S2.1-02: Login API and password policy（需要返回 permissions 和双 Token）

### 后置依赖
- E2-S2.1-04: Local session cache wrapper
- E2-S2.10-02: Force logout and expiry handling

## 与 epic-1-story-11-user-login 的关系

| 功能 | epic-1-story-11 | E2-S2.1-03 |
|------|-----------------|------------|
| LoginPage.tsx | ✅ 已实现 | - |
| LoginForm.tsx | ✅ 已实现 | 🔄 重构使用模块化 API |
| authStore.ts | ✅ 基础实现 | 🔄 扩展 permissions |
| AuthGuard.tsx | ✅ 已实现 | - |
| useAuth.ts | - | ❌ 新增 |
| authApi.ts | - | ❌ 新增 |
| auth.types.ts | - | ❌ 新增 |
| 权限管理 | - | ❌ 新增 |
| 双 Token | - | ❌ 新增 |
