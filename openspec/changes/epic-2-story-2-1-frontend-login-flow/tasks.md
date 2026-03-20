# Tasks: Frontend Login Flow Enhancement

> **前置说明**: 基础登录功能已在 `epic-1-story-11-user-login` 完成，本 Story 专注于增强和优化。

## 已完成任务（来自 epic-1-story-11-user-login）

- [x] ~~创建登录页面~~ → `src/features/auth/pages/LoginPage.tsx`
- [x] ~~创建登录表单组件~~ → `src/features/auth/components/LoginForm.tsx`
- [x] ~~实现认证状态管理~~ → `src/stores/authStore.ts`
- [x] ~~实现路由守卫~~ → `src/components/common/AuthGuard.tsx`
- [x] ~~实现记住我功能~~ → 已在 LoginForm.tsx 实现
- [x] ~~添加忘记密码入口~~ → 已在 LoginForm.tsx 实现

## 本次已完成任务

### 任务 1: 创建类型定义模块 ✅
- **描述**: 从 LoginForm.tsx 抽取类型定义，创建独立的类型文件
- **文件**: `src/features/auth/types/auth.types.ts`
- **验收**: 
  - [x] 定义 User, PermissionSummary, TokenPair 类型
  - [x] 定义 LoginRequest, LoginResponse 类型
  - [x] 定义 RegisterRequest, RegisterResponse 类型
  - [x] 定义 AuthError 类型
  - [x] LoginForm.tsx 可正常导入使用

### 任务 2: 创建 API 封装模块 ✅
- **描述**: 从 LoginForm.tsx 抽取 API 调用逻辑，创建独立的 API 模块
- **文件**: `src/features/auth/api/authApi.ts`
- **验收**: 
  - [x] 实现 login, register, forgotPassword 方法
  - [x] 实现 refreshToken 方法
  - [x] 统一错误处理和超时控制
  - [x] LoginForm.tsx 可正常调用

### 任务 3: 扩展认证状态 Store ✅
- **描述**: 扩展 authStore 支持权限管理和双 Token
- **文件**: `src/stores/authStore.ts`
- **验收**: 
  - [x] 添加 accessToken, refreshToken 状态
  - [x] 添加 permissions 状态
  - [x] 添加 setAuth, updateToken actions
  - [x] 保留原有 setUser, setToken 的兼容性
  - [x] 配置持久化策略（只持久化 refreshToken）

### 任务 4: 创建 useAuth Hook ✅
- **描述**: 创建认证 Hook，封装登录、登出、权限检查逻辑
- **文件**: `src/features/auth/hooks/useAuth.ts`
- **验收**: 
  - [x] 提供 login, logout, register 方法
  - [x] 提供 refreshSession 方法
  - [x] 提供 hasPermission, hasRole 方法
  - [x] 提供 hasAnyPermission, hasAllPermissions 方法
  - [x] 返回 isAuthenticated, user, permissions 状态

### 任务 5: 重构登录表单组件 ✅
- **描述**: 重构 LoginForm.tsx 使用模块化 API 和 useAuth Hook
- **文件**: `src/features/auth/components/LoginForm.tsx`
- **验收**: 
  - [x] 移除内联 API 调用代码
  - [x] 使用 authApi 调用 API
  - [x] 使用 useAuth Hook 管理状态
  - [x] 功能保持不变（登录/注册/忘记密码）

### 任务 6: 创建错误提示组件 ✅
- **描述**: 创建独立的错误提示组件，根据错误码显示友好提示
- **文件**: `src/features/auth/components/LoginError.tsx`
- **验收**: 
  - [x] 根据错误码显示对应图标和文案
  - [x] 使用 Lucide React 图标
  - [x] 样式符合 UX 规范
  - [x] LoginForm 可正常使用

## 待执行任务

### 任务 7: 编写单元测试
- **描述**: 为新增模块编写单元测试
- **文件**: 
  - `src/features/auth/hooks/useAuth.test.ts`
  - `src/stores/authStore.test.ts`
- **验收**: 
  - [ ] useAuth Hook 测试覆盖
  - [ ] authStore 权限相关测试
  - [ ] 覆盖率 > 80%

### 任务 8: E2E 测试验证
- **描述**: 验证完整的登录增强流程
- **文件**: `tests/e2e/auth/login-enhancement.spec.ts`
- **验收**: 
  - [ ] 登录成功获取权限
  - [ ] 权限检查功能正常
  - [ ] Token 刷新流程正常

## 执行顺序

```
任务 1: 创建类型定义模块 ✅
      ↓
任务 2: 创建 API 封装模块 ✅
      ↓
任务 3: 扩展认证状态 Store ✅
      ↓
任务 4: 创建 useAuth Hook ✅
      ↓
任务 5: 重构登录表单组件 ✅
      ↓
任务 6: 创建错误提示组件 ✅
      ↓
任务 7: 编写单元测试 (待执行)
      ↓
任务 8: E2E 测试验证 (待执行)
```

## 测试要点

### 单元测试
- [ ] useAuth Hook 方法
- [ ] authStore 权限状态管理
- [ ] hasPermission / hasRole 逻辑
- [ ] authApi 请求封装

### 集成测试
- [ ] 登录流程（使用 useAuth）
- [ ] Token 刷新流程
- [ ] 权限检查流程

### E2E 测试
- [ ] 成功登录获取权限
- [ ] 权限控制页面访问
- [ ] Token 过期自动刷新

## 交付物

1. ✅ `src/features/auth/types/auth.types.ts` - 类型定义
2. ✅ `src/features/auth/api/authApi.ts` - API 封装
3. ✅ `src/features/auth/hooks/useAuth.ts` - 认证 Hook
4. ✅ `src/stores/authStore.ts` - 扩展后的认证状态
5. ✅ `src/features/auth/components/LoginForm.tsx` - 重构后的登录表单
6. ✅ `src/features/auth/components/LoginError.tsx` - 错误提示组件
7. 单元测试和 E2E 测试（待完成）

## 风险与注意事项

1. **向后兼容**: 保留原有 setUser, setToken 方法，避免破坏现有代码
2. **渐进式重构**: 先创建新模块，再逐步迁移现有代码
3. **测试覆盖**: 重构后确保所有原有功能正常
4. **权限一致性**: 前端权限检查仅用于 UI 控制，后端必须校验

## 与 task.json 的对应

本 OpenSpec 变更对应 `task.json` 中的任务 ID 19:
```json
{
  "id": 19,
  "epic": "Epic 2",
  "story": "Story 2.1",
  "title": "Frontend login flow enhancement",
  "description": "Enhance the frontend login flow with permission management, dual token mechanism, and code modularization. Base implementation completed in epic-1-story-11-user-login.",
  "openspec_change": "epic-2-story-2-1-frontend-login-flow"
}
```