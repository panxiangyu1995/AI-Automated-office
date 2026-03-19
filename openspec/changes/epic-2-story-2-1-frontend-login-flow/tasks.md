# Tasks: Frontend Login Flow

## 任务列表

### 任务 1: 定义类型和 API 封装
- **描述**: 定义认证相关的 TypeScript 类型和 API 封装
- **文件**: 
  - `src/features/auth/types/auth.types.ts`
  - `src/features/auth/api/authApi.ts`
- **验收**: 
  - 类型定义完整
  - API 封装正确
  - 与后端 API 契约一致

### 任务 2: 创建认证状态 Store
- **描述**: 使用 Zustand 创建全局认证状态管理
- **文件**: 
  - `src/stores/authStore.ts`
- **验收**: 
  - Store 包含 user、token、permissions 状态
  - 提供 setAuth、clearAuth、updateToken actions
  - 配置持久化存储

### 任务 3: 创建 useAuth Hook
- **描述**: 创建认证 Hook，封装登录、登出、权限检查逻辑
- **文件**: 
  - `src/features/auth/hooks/useAuth.ts`
- **验收**: 
  - 提供 login、logout 方法
  - 提供 hasPermission、hasRole 方法
  - 正确调用 authApi 和 authStore

### 任务 4: 创建登录表单组件
- **描述**: 创建登录表单组件，包含用户名、密码输入和验证
- **文件**: 
  - `src/features/auth/components/LoginForm.tsx`
- **验收**: 
  - 表单包含用户名和密码输入
  - 客户端验证逻辑正确
  - 加载状态显示正确
  - 使用 Shadcn/ui 组件

### 任务 5: 创建错误提示组件
- **描述**: 创建登录错误提示组件，显示友好的错误信息
- **文件**: 
  - `src/features/auth/components/LoginError.tsx`
- **验收**: 
  - 根据错误码显示对应错误信息
  - 使用 Lucide React 图标
  - 样式符合 UX 规范

### 任务 6: 创建登录页面
- **描述**: 创建完整的登录页面，整合表单和错误提示
- **文件**: 
  - `src/features/auth/components/LoginPage.tsx`
- **验收**: 
  - 页面布局符合 UX 设计规范
  - 包含 Logo 和品牌元素
  - 正确处理登录流程
  - 登录成功后跳转到主界面

### 任务 7: 实现路由守卫
- **描述**: 创建 AuthGuard 组件，保护需要认证的路由
- **文件**: 
  - `src/components/common/AuthGuard.tsx`
  - `src/App.tsx` (更新路由配置)
- **验收**: 
  - 未认证用户重定向到登录页
  - 保存原始访问路径
  - 认证后正确跳转

### 任务 8: 配置路由
- **描述**: 更新 App.tsx 路由配置，添加登录页和路由守卫
- **文件**: 
  - `src/App.tsx`
- **验收**: 
  - /login 路由指向 LoginPage
  - 其他路由需要 AuthGuard 保护
  - 默认路由重定向正确

### 任务 9: 编写单元测试
- **描述**: 为核心组件和 Hook 编写单元测试
- **文件**: 
  - `src/features/auth/components/LoginForm.test.tsx`
  - `src/features/auth/hooks/useAuth.test.ts`
  - `src/stores/authStore.test.ts`
- **验收**: 
  - 覆盖率 > 80%
  - 测试各种状态场景

### 任务 10: 编写 E2E 测试
- **描述**: 测试完整的登录流程
- **文件**: 
  - `tests/e2e/auth/login.spec.ts`
- **验收**: 
  - 测试成功登录场景
  - 测试失败登录场景
  - 测试路由守卫

## 执行顺序

```
1. 定义类型和 API 封装
      ↓
2. 创建认证状态 Store
      ↓
3. 创建 useAuth Hook
      ↓
4. 创建登录表单组件
      ↓
5. 创建错误提示组件
      ↓
6. 创建登录页面
      ↓
7. 实现路由守卫
      ↓
8. 配置路由
      ↓
9. 编写单元测试
      ↓
10. 编写 E2E 测试
```

## 测试要点

### 单元测试
- [ ] LoginForm 表单验证
- [ ] LoginForm 提交处理
- [ ] useAuth login 方法
- [ ] useAuth hasPermission 方法
- [ ] authStore 状态管理

### 集成测试
- [ ] LoginPage 完整流程
- [ ] AuthGuard 路由保护

### E2E 测试
- [ ] 成功登录流程
- [ ] 密码错误提示
- [ ] 账户锁定提示
- [ ] 路由守卫重定向
- [ ] 登录后权限检查

## 交付物

1. 登录页面 UI（LoginPage）
2. 登录表单组件（LoginForm）
3. 错误提示组件（LoginError）
4. 认证状态 Store（authStore）
5. 认证 Hook（useAuth）
6. 路由守卫（AuthGuard）
7. API 封装（authApi）
8. 单元测试和 E2E 测试