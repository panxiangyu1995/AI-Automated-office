# Epic 2 Cross-Story: API Contracts

## 概述

定义 Epic 2 所有 API 的请求/响应结构体、错误码、状态码和接口约定，确保前后端接口一致性。

## 铁律映射

### 架构需求
- **ADR-005**: 后端 Go 提供 RESTful API
- **ADR-001**: 前端 React 通过 HTTP 调用 API

## 验收标准

- [ ] 定义所有 API 请求结构体
- [ ] 定义所有 API 响应结构体
- [ ] 定义统一错误码
- [ ] 定义 HTTP 状态码映射
- [ ] 生成 TypeScript 类型定义

## 技术方案

### API 目录结构

```
cloud-server/api/
├── auth/
│   ├── login.go        # 登录 API
│   ├── logout.go       # 登出 API
│   ├── refresh.go      # Token 刷新 API
│   └── session.go      # 会话管理 API
├── user/
│   ├── user.go         # 用户 CRUD API
│   └── import.go       # 用户导入 API
├── role/
│   └── role.go         # 角色 API
├── department/
│   └── department.go   # 部门 API
└── audit/
    ├── log.go          # 审计查询 API
    └── export.go       # 审计导出 API
```

### 统一响应格式

```typescript
interface ApiResponse<T> {
  code: number;       // 业务码
  message: string;    // 消息
  data: T;           // 数据
}

interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
```

### 错误码定义

```typescript
// 通用错误码 1-999
const ErrorCode = {
  SUCCESS: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

// 认证错误码 1000-1999
const AuthErrorCode = {
  INVALID_CREDENTIALS: 1001,
  ACCOUNT_DISABLED: 1002,
  ACCOUNT_LOCKED: 1003,
  TOKEN_EXPIRED: 1004,
  TOKEN_INVALID: 1005,
  SESSION_EXPIRED: 1006,
  SESSION_REVOKED: 1007,
};

// 用户错误码 2000-2999
const UserErrorCode = {
  USER_NOT_FOUND: 2001,
  USER_ALREADY_EXISTS: 2002,
  INVALID_PASSWORD: 2003,
  PERMISSION_DENIED: 2004,
};
```

## 相关文档
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`