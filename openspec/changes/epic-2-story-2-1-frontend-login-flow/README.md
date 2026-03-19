# Epic 2, Story 2.1: Frontend Login Flow

## 概述

构建 React 前端登录页面、表单验证、登录请求流程和全局认证状态管理。这是用户登录体验的核心前端实现，与 E2-S2.1-02 的云端登录 API 配合完成完整的登录流程。

## 铁律映射

### PRD 需求
- **FRs**: FR27 - 用户可以使用账号密码登录系统
- **NFRs**: 
  - NFR9 - 数据传输加密，所有网络传输使用 TLS 1.3
  - NFR12 - 会话管理，会话超时 30 分钟，支持强制登出

### 架构需求
- **ADR-001**: 分层微内核架构，前端 React 负责登录交互

### UX 需求
- **UX-01**: AI 即入口，对话是主交互方式（登录页面作为入口之一）
- **UX-04**: 零学习成本，傻瓜式操作，适应各种电脑水平

## 验收标准

- [ ] 创建登录页面和表单组件
- [ ] 连接云端登录 API
- [ ] 创建全局认证状态 Store（Zustand）
- [ ] 处理错误提示和重定向
- [ ] 实现路由守卫
- [ ] 登录成功后初始化用户状态并跳转到主界面

## 技术方案

### 页面结构

```
┌─────────────────────────────────────────────────────────────┐
│                    Login Page                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────┐                          │
│                    │   Logo      │                          │
│                    └─────────────┘                          │
│                                                             │
│                    ┌─────────────┐                          │
│                    │ Username    │                          │
│                    └─────────────┘                          │
│                                                             │
│                    ┌─────────────┐                          │
│                    │ Password    │                          │
│                    └─────────────┘                          │
│                                                             │
│                    ┌─────────────┐                          │
│                    │  Login      │                          │
│                    └─────────────┘                          │
│                                                             │
│                    [Error Message Area]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 组件结构

```
src/features/auth/
├── components/
│   ├── LoginPage.tsx           # 登录页面
│   ├── LoginForm.tsx           # 登录表单
│   └── LoginError.tsx          # 错误提示组件
├── hooks/
│   └── useAuth.ts              # 认证 Hook
├── stores/
│   └── authStore.ts            # 认证状态 Store
├── types/
│   └── auth.types.ts           # 类型定义
└── api/
    └── authApi.ts              # 认证 API 封装
```

### 状态管理

使用 Zustand 管理全局认证状态：
- 用户信息
- Token 存储
- 登录状态
- 权限摘要

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX 规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`
- 登录 API: `openspec/changes/epic-2-story-2-1-login-password-policy/`