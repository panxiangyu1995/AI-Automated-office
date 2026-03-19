# Design: API Contracts

## 技术方案

### API 端点列表

#### 认证 API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 用户登出 |
| POST | /api/auth/refresh | 刷新 Token |
| GET | /api/auth/session/check | 检查会话状态 |
| GET | /api/auth/session/list | 获取会话列表 |
| POST | /api/auth/session/revoke | 撤销会话 |

#### 用户 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/users | 获取用户列表 |
| GET | /api/users/:id | 获取用户详情 |
| POST | /api/users | 创建用户 |
| PUT | /api/users/:id | 更新用户 |
| DELETE | /api/users/:id | 删除用户 |
| POST | /api/users/import/preview | 导入预览 |
| POST | /api/users/import/commit | 导入提交 |
| GET | /api/users/export | 导出用户 |

#### 角色 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/roles | 获取角色列表 |
| GET | /api/roles/:id | 获取角色详情 |
| POST | /api/roles | 创建角色 |
| PUT | /api/roles/:id | 更新角色 |
| DELETE | /api/roles/:id | 删除角色 |

#### 部门 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/departments | 获取部门列表 |
| GET | /api/departments/tree | 获取部门树 |
| POST | /api/departments | 创建部门 |
| PUT | /api/departments/:id | 更新部门 |
| DELETE | /api/departments/:id | 删除部门 |

#### 审计 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/audit/logs | 获取审计日志列表 |
| GET | /api/audit/logs/:id | 获取审计日志详情 |
| GET | /api/audit/export | 导出审计日志 |

### 请求/响应结构

```typescript
// 登录请求
interface LoginRequest {
  username: string;
  password: string;
  tenant_id?: string;
}

// 登录响应
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// 用户结构
interface User {
  id: string;
  username: string;
  email: string;
  real_name: string;
  department_id: string;
  department_name: string;
  roles: Role[];
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

// 角色结构
interface Role {
  id: string;
  name: string;
  code: string;
  permissions: Permission[];
}

// 权限结构
interface Permission {
  id: string;
  name: string;
  code: string;
  resource: string;
  action: string;
}

// 错误响应
interface ErrorResponse {
  code: number;
  message: string;
  details?: Record<string, string>;
}
```

### 错误码完整定义

```go
// cloud-server/pkg/errors/codes.go
package errors

// 通用错误码
const (
    Success         = 0
    BadRequest      = 400
    Unauthorized    = 401
    Forbidden       = 403
    NotFound        = 404
    Conflict        = 409
    InternalError   = 500
    ServiceUnavailable = 503
)

// 认证错误码 (1xxx)
const (
    ErrInvalidCredentials  = 1001
    ErrAccountDisabled     = 1002
    ErrAccountLocked       = 1003
    ErrTokenExpired        = 1004
    ErrTokenInvalid        = 1005
    ErrSessionExpired      = 1006
    ErrSessionRevoked      = 1007
    ErrSessionIdleTimeout  = 1008
)

// 用户错误码 (2xxx)
const (
    ErrUserNotFound        = 2001
    ErrUserAlreadyExists   = 2002
    ErrInvalidPassword     = 2003
    ErrPermissionDenied    = 2004
    ErrUserDisabled        = 2005
)

// 导入导出错误码 (3xxx)
const (
    ErrImportFileInvalid   = 3001
    ErrImportParseError    = 3002
    ErrImportConflict      = 3003
    ErrExportFailed        = 3004
)
```

### HTTP 状态码映射

```go
// 业务码到 HTTP 状态码的映射
func ToHTTPStatus(code int) int {
    switch code {
    case Success:
        return 200
    case BadRequest:
        return 400
    case Unauthorized, ErrTokenExpired, ErrTokenInvalid, 
         ErrSessionExpired, ErrSessionRevoked, ErrSessionIdleTimeout:
        return 401
    case Forbidden, ErrPermissionDenied:
        return 403
    case NotFound, ErrUserNotFound:
        return 404
    case Conflict, ErrUserAlreadyExists, ErrImportConflict:
        return 409
    default:
        if code >= 5000 {
            return 500
        }
        return 200 // 业务错误返回 200 + code
    }
}
```

## 任务列表

1. 创建 API 契约文档
2. 定义 Go 请求/响应结构体
3. 定义错误码常量
4. 生成 TypeScript 类型定义
5. 创建 API Mock Server
6. 编写 API 文档