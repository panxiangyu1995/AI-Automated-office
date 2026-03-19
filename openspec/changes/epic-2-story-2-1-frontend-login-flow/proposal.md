# Proposal: Frontend Login Flow

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

Epic 2 用户认证与部门权限系统需要前端登录界面。E2-S2.1-02 已完成云端登录 API，本提案旨在构建 React 前端登录页面和全局认证状态管理，为用户提供流畅的登录体验。

### 业务背景
- 用户需要使用账号密码登录系统（FR27）
- 登录成功后需要展示用户信息和权限（UX-01）
- 需要安全的登录体验（NFR9）

### 技术背景
- 使用 React + TypeScript 构建前端
- 使用 Zustand 管理全局状态
- 使用 Shadcn/ui 组件库
- 使用 Tailwind CSS 样式
- 遵循 UX 设计规范（深蓝色品牌色 #1E3A5F）

## 目标

构建完整的登录前端体验，包括：
1. 登录页面 UI
2. 表单验证逻辑
3. 登录 API 调用
4. 全局认证状态管理
5. 路由守卫
6. 错误处理和提示

## 范围

### 包含
- 创建登录页面组件（LoginPage）
- 创建登录表单组件（LoginForm）
- 实现表单验证（用户名、密码）
- 连接云端登录 API
- 创建全局认证状态 Store（Zustand）
- 实现路由守卫（AuthGuard）
- 处理登录成功/失败的跳转
- 统一错误提示组件

### 不包含
- 本地会话缓存（E2-S2.1-04）
- 登出功能（后续 Story）
- 密码修改功能（后续 Story）
- 多因素认证（Post-MVP）

## 影响范围

### 前端
- `src/features/auth/` - 新增认证功能模块
- `src/stores/authStore.ts` - 新增认证状态 Store
- `src/hooks/useAuth.ts` - 新增认证 Hook
- `src/components/common/AuthGuard.tsx` - 新增路由守卫
- `src/App.tsx` - 更新路由配置

### API 调用
- POST /api/auth/login

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Token 存储不安全 | 中 | 高 | 不存储敏感信息，Token 存储在内存/安全存储 |
| 表单验证不完善 | 低 | 中 | 使用 zod 进行严格验证 |
| 错误提示不友好 | 中 | 中 | 设计友好的错误提示文案 |
| 路由守卫绕过 | 低 | 高 | 后端也需要进行权限校验 |

## 实施计划

1. **Step 1**: 定义类型和 API 封装
2. **Step 2**: 创建认证状态 Store
3. **Step 3**: 创建登录表单组件
4. **Step 4**: 创建登录页面
5. **Step 5**: 实现路由守卫
6. **Step 6**: 连接错误处理
7. **Step 7**: 编写单元测试
8. **Step 8**: E2E 测试验证

## 依赖关系

### 前置依赖
- E2-S2.1-02: Login API and password policy（必须完成）
- Epic 1, Story 1.x: 前端项目初始化

### 后置依赖
- E2-S2.1-04: Local session cache wrapper
- E2-S2.10-02: Force logout and expiry handling