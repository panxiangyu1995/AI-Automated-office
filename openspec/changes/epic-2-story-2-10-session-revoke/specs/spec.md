# Specification: Force Logout and Expiry Handling

## 需求来源

### PRD 需求

**FR27 - 用户可以使用账号密码登录系统**

会话过期或被强制登出时，需要给用户明确的提示并引导重新登录。

### 架构约束

**ADR-001 - 分层微内核架构**
- 前端 React 负责会话过期处理
- Tauri 负责本地缓存清理

**ADR-005 - 多租户数据库级隔离**
- 会话撤销需验证租户权限

### NFR 约束

**NFR12 - 会话管理**
- 支持强制登出
- 会话状态可追踪

### UX 规范

**UX-04 - 交互透明可控**
- 会话过期提示清晰
- 自动引导重新登录

## 功能规格

### 用户故事

As a **用户或管理员**,
I want **会话过期时有明确提示，或能强制登出其他用户**,
So that **保证系统安全和良好的用户体验**。

### 验收场景

#### Scenario 1: 管理员强制登出单个会话
- **GIVEN** 管理员登录系统
- **WHEN** 管理员撤销指定会话
- **THEN** 
  - 会话被标记为已撤销
  - 记录审计日志
  - 对应用户下次请求收到 401

#### Scenario 2: 管理员强制登出用户所有设备
- **GIVEN** 管理员登录系统
- **WHEN** 管理员撤销用户所有会话
- **THEN** 
  - 用户所有设备的会话被撤销
  - 记录审计日志

#### Scenario 3: 会话空闲超时处理
- **GIVEN** 用户已登录
- **WHEN** 用户 30 分钟未活动后发送请求
- **THEN** 
  - 收到 401 响应
  - 错误码为 SESSION_IDLE_TIMEOUT
  - 显示会话过期弹窗
  - 自动跳转登录页

#### Scenario 4: 会话过期处理
- **GIVEN** 用户已登录
- **WHEN** 会话超过 24 小时过期
- **THEN** 
  - 收到 401 响应
  - 错误码为 SESSION_EXPIRED
  - 显示会话过期弹窗

#### Scenario 5: 被强制登出处理
- **GIVEN** 用户已登录
- **WHEN** 用户被管理员强制登出
- **THEN** 
  - 下次请求收到 401 响应
  - 错误码为 SESSION_REVOKED
  - 显示"您已被强制登出"提示

#### Scenario 6: 本地缓存清理
- **GIVEN** 会话过期
- **WHEN** 前端清理认证状态
- **THEN** 
  - 内存中的认证状态被清除
  - 本地存储的 Token 被清除
  - Tauri 本地缓存被清理

#### Scenario 7: 定期会话检查
- **GIVEN** 用户正常使用系统
- **WHEN** 每 5 分钟进行会话检查
- **THEN** 
  - 发送会话状态检查请求
  - 如会话失效则触发处理流程

## 数据规格

### 输入

| 输入 | 类型 | 描述 | 必填 |
|------|------|------|------|
| session_id | string | 要撤销的会话 ID | 与 user_id 二选一 |
| user_id | string | 要撤销的用户 ID | 与 session_id 二选一 |
| reason | string | 撤销原因 | 否 |

### 输出

```typescript
interface RevokeSessionResponse {
  revoked_count: number;
  session_ids: string[];
}
```

## 边界条件

1. **权限检查**: 只有管理员可以强制登出其他用户
2. **并发处理**: 同一会话并发撤销请求需幂等处理
3. **清理延迟**: 本地缓存清理需等待 Tauri 命令完成

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| SESSION_NOT_FOUND | 会话不存在 | 提示会话已失效 |
| PERMISSION_DENIED | 无权限撤销 | 提示权限不足 |
| SESSION_ALREADY_REVOKED | 会话已撤销 | 幂等处理，返回成功 |

## 质量属性

### 可用性要求
- 弹窗提示清晰友好
- 跳转登录页保留原路径
- 支持记住用户名

### 性能要求
- 会话撤销 < 100ms
- 弹窗显示 < 500ms
- 缓存清理 < 1s

### 安全要求
- 权限验证严格
- 敏感数据完全清理
- 审计日志完整

## 依赖关系

### 上游依赖
- E2-S2.10-01: Session model and timeout engine
- E2-S2.1-03: Frontend login flow
- E2-S2.1-04: Local session cache wrapper

### API 依赖
- `POST /api/auth/session/revoke` - 撤销会话
- `GET /api/auth/session/check` - 检查会话状态

## 验收标准

| 标准 | 验证方式 |
|------|---------|
| 强制登出功能正常 | E2E 测试 |
| 会话过期提示正常 | 手动测试 |
| 本地缓存清理完整 | 手动检查 |
| 审计日志正确 | 手动检查 |