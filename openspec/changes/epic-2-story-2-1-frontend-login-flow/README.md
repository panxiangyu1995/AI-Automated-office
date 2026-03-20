# Epic 2, Story 2.1: Frontend Login Flow Enhancement

## 概述

基于已实现的登录功能（epic-1-story-11-user-login），增强前端登录流程，包括权限管理集成、双 Token 机制、代码模块化重构。

> **注意**: 基础登录功能已在 `epic-1-story-11-user-login` 中实现完成，本 Story 专注于增强和优化。

## 已实现功能（来自 epic-1-story-11-user-login）

### ✅ 已完成
- **LoginPage.tsx** - 登录页面（左右分栏布局，品牌展示区）
- **LoginForm.tsx** - 登录/注册表单
  - 支持登录/注册模式切换
  - 用户名、密码输入
  - 记住我功能
  - 忘记密码功能
  - 加载状态和错误提示
- **authStore.ts** - Zustand 状态管理
  - user, token, isAuthenticated 状态
  - setUser, setToken, clearAuthSession, logout actions
- **AuthGuard.tsx** - 路由守卫
- **App.tsx** - 路由配置（/login, /* 受保护路由）
- **API 调用** - /api/v1/auth/login, /api/v1/auth/register, /api/v1/auth/forgot-password

## 待增强功能

### 🔄 需要实现
1. **useAuth Hook** - 封装认证逻辑（login, logout, hasPermission, hasRole）
2. **authApi.ts** - API 调用模块化
3. **auth.types.ts** - 类型定义模块化
4. **权限管理** - permissions 状态和权限检查函数
5. **双 Token 机制** - accessToken/refreshToken 支持
6. **Token 刷新** - 自动刷新逻辑
7. **LoginError.tsx** - 错误提示组件化（可选）

## 铁律映射

### PRD 需求
- **FRs**: FR27 - 用户可以使用账号密码登录系统
- **FR29**: 基础权限管理
- **FR30**: 部门权限管理
- **NFRs**: 
  - NFR9 - 数据传输加密，所有网络传输使用 TLS 1.3
  - NFR12 - 会话管理，会话超时 30 分钟，支持强制登出

### 架构需求
- **ADR-001**: 分层微内核架构，前端 React 负责登录交互

### UX 需求
- **UX-01**: AI 即入口，对话是主交互方式（登录页面作为入口之一）
- **UX-04**: 零学习成本，傻瓜式操作，适应各种电脑水平

## 验收标准

- [ ] 创建 useAuth Hook 封装认证逻辑
- [ ] 模块化 API 调用（authApi.ts）
- [ ] 模块化类型定义（auth.types.ts）
- [ ] 扩展 authStore 支持权限管理（permissions）
- [ ] 实现双 Token 机制（accessToken/refreshToken）
- [ ] 实现 Token 自动刷新
- [ ] 实现 hasPermission, hasRole 权限检查

## 现有代码结构

```
src/features/auth/
├── components/
│   └── LoginForm.tsx       # ✅ 已实现（登录/注册/忘记密码）
├── pages/
│   └── LoginPage.tsx       # ✅ 已实现（左右分栏布局）
├── hooks/
│   └── useAuth.ts          # ❌ 待实现
├── api/
│   └── authApi.ts          # ❌ 待实现（从 LoginForm 抽取）
└── types/
    └── auth.types.ts       # ❌ 待实现（从 LoginForm 抽取）

src/stores/
└── authStore.ts            # ✅ 已实现（需扩展 permissions）

src/components/common/
└── AuthGuard.tsx           # ✅ 已实现
```

## 与其他模块的关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        已实现功能                               │
├─────────────────────────────────────────────────────────────────┤
│  LoginPage.tsx ◄── LoginForm.tsx ◄── authStore.ts              │
│        │                  │                  │                  │
│        │                  │                  ▼                  │
│        │                  │           AuthGuard.tsx             │
│        │                  │                  │                  │
│        ▼                  ▼                  ▼                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    App.tsx (路由配置)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        待增强功能                               │
├─────────────────────────────────────────────────────────────────┤
│  useAuth.ts ◄── authApi.ts ◄── auth.types.ts                   │
│       │                                                         │
│       ▼                                                         │
│  authStore.ts (扩展 permissions)                                │
│       │                                                         │
│       ▼                                                         │
│  hasPermission(), hasRole(), refreshToken()                     │
└─────────────────────────────────────────────────────────────────┘
```

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX 规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`
- 已实现的登录功能: `openspec/changes/epic-1-story-11-user-login/`
