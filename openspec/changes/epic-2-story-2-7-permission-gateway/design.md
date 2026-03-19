## Context

- **Change:** `epic-2-story-2-7-permission-gateway`
- **Story:** Story 2.7 - 权限网关
- **Capability:** `permission-gateway`
- **需求映射:** FR(FR29, FR30, FR31, FR32), NFR(NFR16), ARCH(ADR-005)

本设计文档定义权限网关中间件的详细设计，包括中间件架构、校验流程和响应契约。

## Goals / Non-Goals

**Goals:**
- 实现统一的认证和权限中间件
- 实现租户隔离检查
- 实现资源权限校验
- 实现标准化的 403 响应契约

**Non-Goals:**
- 不涉及前端权限展示（由 E2-S2.7-02 处理）
- 不涉及权限配置界面（由 E2-S2.5-02 和 E2-S2.6-02 处理）
- 不涉及权限计算逻辑（由 E2-S2.5-01 和 E2-S2.6-01 处理）

## Architecture Design

### 中间件架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    中间件架构                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HTTP Request                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                       │
│  │  TenantMiddleware   │                                       │
│  │  - 解析 TenantID    │                                       │
│  │  - 验证租户有效性   │                                       │
│  │  - 设置租户上下文   │                                       │
│  └──────────┬──────────┘                                       │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │   AuthMiddleware    │                                       │
│  │  - 解析 Token       │                                       │
│  │  - 验证会话有效性   │                                       │
│  │  - 加载用户信息     │                                       │
│  │  - 设置用户上下文   │                                       │
│  └──────────┬──────────┘                                       │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │ PermissionMiddleware│                                       │
│  │  - 加载用户权限     │                                       │
│  │  - 检查资源权限     │                                       │
│  │  - 应用数据范围     │                                       │
│  │  - 应用字段权限     │                                       │
│  └──────────┬──────────┘                                       │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │      Handler        │                                       │
│  │  - 业务逻辑处理     │                                       │
│  └─────────────────────┘                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 校验流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    权限校验详细流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 租户隔离检查                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 从请求头/路径解析 tenant_id                           │   │
│  │ • 验证租户是否存在且有效                                │   │
│  │ • 检查租户订阅状态                                      │   │
│  │ • 设置租户上下文 (context)                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 2: 用户认证检查                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 从 Authorization 头解析 access_token                  │   │
│  │ • 验证 token 签名和有效期                               │   │
│  │ • 检查 token 是否已被撤销                               │   │
│  │ • 加载用户信息和会话状态                                │   │
│  │ • 检查用户状态（是否被禁用）                            │   │
│  │ • 设置用户上下文 (context)                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 3: 权限校验                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 解析请求资源 (resource)                               │   │
│  │ • 解析请求操作 (action)                                 │   │
│  │ • 计算用户权限 (角色权限 + 覆盖权限)                    │   │
│  │ • 检查是否拥有所需权限                                  │   │
│  │ • 如无权限，返回标准 403 响应                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 4: 数据范围应用                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 获取用户数据范围权限                                  │   │
│  │ • 生成数据过滤条件                                      │   │
│  │ • 注入到查询上下文                                      │   │
│  │ • Handler 中自动应用过滤                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 5: 字段权限应用                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 获取用户字段权限                                      │   │
│  │ • 标记需要隐藏/只读/脱敏的字段                          │   │
│  │ • 注入到响应处理上下文                                  │   │
│  │ • 响应序列化时应用字段规则                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Go 中间件实现

```go
// middleware/tenant.go
func TenantMiddleware(tenantService *TenantService) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 从请求头获取租户ID
        tenantID := c.GetHeader("X-Tenant-ID")
        if tenantID == "" {
            // 尝试从路径参数获取
            tenantID = c.Param("tenant_id")
        }
        
        if tenantID == "" {
            c.JSON(400, gin.H{
                "code":    "TENANT_REQUIRED",
                "message": "缺少租户标识",
            })
            c.Abort()
            return
        }
        
        // 验证租户有效性
        tenant, err := tenantService.GetByID(c.Request.Context(), tenantID)
        if err != nil {
            c.JSON(403, gin.H{
                "code":    "TENANT_INVALID",
                "message": "无效的租户标识",
            })
            c.Abort()
            return
        }
        
        if tenant.Status != "active" {
            c.JSON(403, gin.H{
                "code":    "TENANT_INACTIVE",
                "message": "租户已停用",
            })
            c.Abort()
            return
        }
        
        // 设置租户上下文
        c.Set("tenant_id", tenantID)
        c.Set("tenant", tenant)
        c.Next()
    }
}

// middleware/auth.go
func AuthMiddleware(authService *AuthService) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 从 Authorization 头获取 token
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{
                "code":    "AUTH_REQUIRED",
                "message": "缺少认证信息",
            })
            c.Abort()
            return
        }
        
        // 解析 Bearer token
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(401, gin.H{
                "code":    "INVALID_AUTH_FORMAT",
                "message": "认证格式错误",
            })
            c.Abort()
            return
        }
        
        tokenString := parts[1]
        
        // 验证 token
        claims, err := authService.ValidateToken(c.Request.Context(), tokenString)
        if err != nil {
            c.JSON(401, gin.H{
                "code":    "TOKEN_INVALID",
                "message": "令牌无效或已过期",
            })
            c.Abort()
            return
        }
        
        // 检查会话是否被撤销
        if revoked, _ := authService.IsTokenRevoked(c.Request.Context(), claims.SessionID); revoked {
            c.JSON(401, gin.H{
                "code":    "TOKEN_REVOKED",
                "message": "令牌已被撤销",
            })
            c.Abort()
            return
        }
        
        // 加载用户信息
        user, err := authService.GetUserByID(c.Request.Context(), claims.UserID)
        if err != nil {
            c.JSON(401, gin.H{
                "code":    "USER_NOT_FOUND",
                "message": "用户不存在",
            })
            c.Abort()
            return
        }
        
        if user.Status != "active" {
            c.JSON(403, gin.H{
                "code":    "USER_INACTIVE",
                "message": "用户已被禁用",
            })
            c.Abort()
            return
        }
        
        // 设置用户上下文
        c.Set("user_id", claims.UserID)
        c.Set("user", user)
        c.Set("session_id", claims.SessionID)
        c.Next()
    }
}

// middleware/permission.go
func PermissionMiddleware(
    permCalculator *PermissionCalculator,
    permCache *PermissionCache,
) gin.HandlerFunc {
    return func(c *gin.Context) {
        tenantID := c.GetString("tenant_id")
        userID := c.GetString("user_id")
        
        // 从路由配置获取资源标识
        resource := getResourceFromPath(c.FullPath())
        action := getActionFromMethod(c.Request.Method)
        
        // 获取用户权限（优先从缓存）
        permResult, err := permCache.GetOrCompute(c.Request.Context(), userID, resource, func() (*PermissionResult, error) {
            return permCalculator.GetUserPermissionResult(c.Request.Context(), userID, resource)
        })
        
        if err != nil {
            c.JSON(500, gin.H{
                "code":    "PERMISSION_ERROR",
                "message": "权限计算失败",
            })
            c.Abort()
            return
        }
        
        // 检查权限
        requiredPerm := fmt.Sprintf("%s_%s", resource, action)
        if !permResult.Permissions[requiredPerm] {
            c.JSON(403, ForbiddenResponse{
                Code:               "PERMISSION_DENIED",
                HTTPStatus:         403,
                Message:            "当前账号无权限执行该操作",
                Resource:           resource,
                RequiredPermission: requiredPerm,
                ApplyEntry:         fmt.Sprintf("/permissions/apply?resource=%s", resource),
                TraceID:            c.GetString("trace_id"),
            })
            c.Abort()
            return
        }
        
        // 设置权限上下文（供 Handler 使用）
        c.Set("permission_result", permResult)
        c.Set("data_scope", permResult.DataScope)
        c.Set("field_restrictions", permResult.FieldRestrictions)
        
        c.Next()
    }
}
```

### 标准 403 响应契约

```go
// response/forbidden.go
type ForbiddenResponse struct {
    Code               string `json:"code"`
    HTTPStatus         int    `json:"http_status"`
    Message            string `json:"message"`
    Resource           string `json:"resource"`
    RequiredPermission string `json:"required_permission"`
    ApplyEntry         string `json:"apply_entry"`
    TraceID            string `json:"trace_id"`
}

// 标准错误码
const (
    ErrPermissionDenied  = "PERMISSION_DENIED"
    ErrTenantRequired    = "TENANT_REQUIRED"
    ErrTenantInvalid     = "TENANT_INVALID"
    ErrTenantInactive    = "TENANT_INACTIVE"
    ErrAuthRequired      = "AUTH_REQUIRED"
    ErrTokenInvalid      = "TOKEN_INVALID"
    ErrTokenExpired      = "TOKEN_EXPIRED"
    ErrTokenRevoked      = "TOKEN_REVOKED"
    ErrUserInactive      = "USER_INACTIVE"
)
```

### 数据范围过滤集成

```go
// handler/user_handler.go
func (h *UserHandler) ListUsers(c *gin.Context) {
    // 从上下文获取数据范围
    dataScope := c.MustGet("data_scope").(DataScope)
    fieldRestrictions := c.MustGet("field_restrictions").(map[string]FieldRestriction)
    
    // 构建查询
    query := h.db.WithContext(c.Request.Context()).
        Model(&User{}).
        Where("tenant_id = ?", c.GetString("tenant_id"))
    
    // 应用数据范围过滤
    query = h.dataScopeService.ApplyDataScope(query, c.GetString("user_id"), "hr.employee", dataScope)
    
    // 执行查询
    var users []User
    if err := query.Find(&users).Error; err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // 应用字段权限（隐藏/脱敏）
    results := make([]map[string]interface{}, len(users))
    for i, user := range users {
        results[i] = applyFieldRestrictions(user, fieldRestrictions)
    }
    
    c.JSON(200, gin.H{"data": results})
}

func applyFieldRestrictions(user User, restrictions map[string]FieldRestriction) map[string]interface{} {
    result := make(map[string]interface{})
    val := reflect.ValueOf(user)
    
    for i := 0; i < val.NumField(); i++ {
        fieldName := val.Type().Field(i).Tag.Get("json")
        
        restriction, hasRestriction := restrictions[fieldName]
        
        if hasRestriction {
            switch restriction.Mode {
            case "hidden":
                continue // 跳过隐藏字段
            case "masked":
                result[fieldName] = applyMask(val.Field(i).Interface(), restriction.MaskRule)
            default:
                result[fieldName] = val.Field(i).Interface()
            }
        } else {
            result[fieldName] = val.Field(i).Interface()
        }
    }
    
    return result
}
```

## Decisions

1. **中间件分层设计**
   - Rationale: 职责分离，每层只处理一种校验逻辑。
   - 顺序：租户 → 认证 → 权限，按依赖关系排列。

2. **403 响应包含申请入口**
   - Rationale: 用户体验友好，用户可以直接申请权限。
   - 包含 trace_id 便于问题追踪。

3. **权限结果缓存**
   - Rationale: 权限计算开销大，缓存显著提升性能。
   - 缓存失效策略：权限变更时主动失效。

4. **数据范围注入查询上下文**
   - Rationale: 自动化数据过滤，避免 Handler 重复编码。
   - 支持自定义规则扩展。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 中间件链过长影响性能 | 异步预加载、缓存策略 |
| 权限缓存与实际不一致 | 变更通知、主动失效 |
| 误拦截合法请求 | 白名单机制、细粒度配置 |
| 数据范围过滤遗漏 | 代码审查、测试覆盖 |

## Migration Plan

1. 实现 TenantMiddleware 租户隔离中间件
2. 实现 AuthMiddleware 认证中间件
3. 实现 PermissionMiddleware 权限中间件
4. 定义标准 403 响应契约
5. 逐步迁移现有 API 使用中间件
6. 进行集成测试验证

## Open Questions

1. 是否需要支持权限缓存预热？
2. 权限变更是否需要实时推送到客户端？
3. 是否需要支持批量权限检查 API？