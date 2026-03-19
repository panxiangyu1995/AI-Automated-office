# Epic 2, Story 2.10: Force Logout and Expiry Handling

## 概述

实现管理员强制登出、前端会话过期处理和自动返回登录页。完善会话安全管理的用户交互层。

## 铁律映射

### PRD 需求
- **FR27**: 用户可以使用账号密码登录系统（会话管理相关）

### 架构需求
- **ADR-001**: 前端 React 负责会话过期处理
- **ADR-005**: 后端 Go 负责会话撤销

### NFR 需求
- **NFR12**: 会话管理，会话超时 30 分钟，支持强制登出

### UX 需求
- **UX-04**: 会话过期提示清晰，自动引导重新登录

## 验收标准

- [ ] 实现会话撤销 API
- [ ] 实现会话检查或实时通知
- [ ] 清除认证状态和本地缓存
- [ ] 显示会话过期和强制登出消息

## 技术方案

### 后端 API
- `POST /api/auth/session/revoke` - 撤销会话
- `GET /api/auth/session/check` - 检查会话状态

### 前端处理
- 全局会话状态管理
- 401 响应拦截处理
- 会话过期弹窗
- 自动跳转登录页

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`