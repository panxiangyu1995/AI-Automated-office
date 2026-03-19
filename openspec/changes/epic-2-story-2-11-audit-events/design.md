# Design: Audit Event Integration

## 技术方案

### 审计集成点

```
┌─────────────────────────────────────────────────────────────┐
│                    Audit Integration Points                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Auth APIs                                               │
│     ├── Login (success/failure)                            │
│     ├── Logout                                             │
│     ├── Token Refresh                                      │
│     └── Session Revoke                                     │
│                                                             │
│  2. User APIs                                               │
│     ├── Create User                                        │
│     ├── Update User                                        │
│     ├── Delete User                                        │
│     └── Enable/Disable User                                │
│                                                             │
│  3. Permission APIs                                         │
│     ├── Create Role                                        │
│     ├── Update Role                                        │
│     ├── Delete Role                                        │
│     ├── Grant Permission                                   │
│     └── Revoke Permission                                  │
│                                                             │
│  4. Import/Export APIs                                      │
│     ├── Import Preview                                     │
│     ├── Import Commit                                      │
│     └── Export                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 集成示例代码

```go
// 登录 API 集成审计
func (h *AuthHandler) Login(c *gin.Context) {
    // ... 登录逻辑 ...
    
    // 记录审计日志
    h.auditLogger.Log(c, NewAuditLogBuilder().
        WithTenant(req.TenantID).
        WithOperator(user.ID, OperatorTypeUser, c.ClientIP()).
        WithTarget(user.ID, "user").
        WithEvent(EventAuthLogin, "auth", "login").
        WithResult(ResultSuccess, "").
        WithDetails(map[string]interface{}{
            "username": req.Username,
        }).
        Build())
}

// 用户创建集成审计
func (h *UserHandler) CreateUser(c *gin.Context) {
    // ... 创建逻辑 ...
    
    // 记录审计日志
    h.auditLogger.Log(c, NewAuditLogBuilder().
        WithTenant(tenantID).
        WithOperator(operatorID, OperatorTypeUser, c.ClientIP()).
        WithTarget(user.ID, "user").
        WithEvent(EventUserCreate, "users", "create").
        WithResult(ResultSuccess, "").
        WithNewValues(map[string]interface{}{
            "username":   user.Username,
            "email":      user.Email,
            "real_name":  user.RealName,
            "department": user.DepartmentID,
        }).
        Build())
}
```

## 任务列表

1. 在 Auth Service 中注入 AuditLogger
2. 集成登录成功/失败审计
3. 集成登出审计
4. 集成会话撤销审计
5. 在 User Service 中注入 AuditLogger
6. 集成用户 CRUD 审计
7. 在 Role Service 中注入 AuditLogger
8. 集成角色和权限变更审计
9. 在 Import Service 中注入 AuditLogger
10. 集成导入导出审计

## 交付物

1. 各 Service 的审计集成
2. 单元测试
3. 集成测试