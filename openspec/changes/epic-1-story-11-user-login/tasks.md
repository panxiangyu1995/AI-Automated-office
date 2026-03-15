# Tasks: 用户登录功能 (Story 1.11)

> **依赖**: Story 1.6 (Go后端), Story 1.7 (PostgreSQL), Story 1.10 (通信架构)

## 任务列表

### 任务 1: 创建登录页面
- **描述**: 创建登录页面组件和布局
- **文件**: `src/features/auth/pages/LoginPage.tsx`
- **验收**: 登录页面正常显示

### 任务 2: 创建登录表单组件
- **描述**: 创建登录表单组件
- **文件**: `src/features/auth/components/LoginForm.tsx`
- **验收**: 表单可输入和提交

### 任务 3: 实现认证状态管理
- **描述**: 创建认证状态 Store
- **文件**: `src/stores/authStore.ts`
- **验收**: 认证状态可管理

### 任务 4: 实现后端认证模块
- **描述**: 创建 Rust 认证服务和命令
- **文件**: `src-tauri/src/auth/`, `src-tauri/src/commands/auth.rs`
- **验收**: 可处理登录请求

### 任务 5: 实现路由守卫
- **描述**: 创建路由守卫组件
- **文件**: `src/components/common/AuthGuard.tsx`
- **验收**: 未登录时重定向到登录页

### 任务 6: 实现记住我功能
- **描述**: 实现登录状态持久化
- **文件**: `src/stores/authStore.ts`, `src-tauri/src/auth/`
- **验收**: 记住我功能生效

### 任务 7: 添加忘记密码入口
- **描述**: 添加忘记密码链接（仅 UI）
- **文件**: `src/features/auth/components/LoginForm.tsx`
- **验收**: 链接可点击

## 执行顺序

1. 任务 1 → 任务 2（登录页面）
2. 任务 3 → 任务 4（认证逻辑）
3. 任务 5（路由守卫）
4. 任务 6 → 任务 7（完善功能）

## 测试要点

- [ ] 登录页面正常显示
- [ ] 正确账号密码登录成功
- [ ] 错误账号密码显示错误提示
- [ ] 记住我功能生效
- [ ] 未登录时重定向到登录页
- [ ] 登录后跳转到主页
- [ ] 密码不明文传输
