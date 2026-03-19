# Specification: Local Session Cache Wrapper

## 需求来源

### PRD 需求

**FR27 - 用户可以使用账号密码登录系统**

登录成功后，系统应支持会话的本地缓存，以便用户下次启动时快速恢复会话。

**NFR10 - 本地数据安全**

敏感数据在本地存储时必须加密，使用 AES-256-GCM 或同等强度的加密算法。

**NFR12 - 会话管理**

- 会话超时 30 分钟
- 支持强制登出
- 会话状态由云端主导管理

### 架构约束

**ADR-001 - 分层微内核架构**

- 本地层作为辅助能力，不承担账号密码鉴权主入口
- 前端 React 负责会话状态展示
- 云端 Go 负责会话验证和权限计算

**ADR-003 - 本地优先存储策略**

- 本地缓存少量必要数据
- 支持离线场景下的快速恢复
- 上线后与云端同步

### 架构约束（重要 - 来自 Epic 2 架构增强文档）

> **明确禁止**：
> - ❌ 本地保存明文密码
> - ❌ 本地自行判定登录成功
> - ❌ 本地绕过云端会话与权限校验
> - ❌ 本地缓存作为鉴权主入口

> **允许**：
> - ✅ 保存极少量必要的会话元数据
> - ✅ 辅助离线场景下的快速恢复
> - ✅ 配合云端会话状态清理本地缓存

## 功能规格

### 用户故事

As a **系统用户**,
I want **下次启动应用时能快速恢复会话**,
So that **我不需要每次都重新登录**。

### 验收场景

#### Scenario 1: 保存会话元数据
- **GIVEN** 用户成功登录
- **AND** 前端调用 save_session_metadata
- **WHEN** 传入合法的 SessionMetadata
- **THEN** 元数据被加密并存储到本地
- **AND** 返回成功
- **AND** 不存储密码和 Access Token

#### Scenario 2: 读取会话元数据
- **GIVEN** 本地存在有效的会话缓存
- **WHEN** 调用 get_session_metadata
- **THEN** 返回解密后的 SessionMetadata
- **AND** 不包含密码和 Access Token

#### Scenario 3: 清理会话缓存
- **GIVEN** 本地存在会话缓存
- **WHEN** 调用 clear_session_cache
- **THEN** 本地缓存文件被删除
- **AND** 后续 get_session_metadata 返回 null

#### Scenario 4: 尝试存储密码（安全检查）
- **GIVEN** 尝试存储包含密码的元数据
- **WHEN** 调用 save_session_metadata
- **THEN** 返回 SecurityViolation 错误
- **AND** 数据不被存储
- **AND** 记录安全日志

#### Scenario 5: 尝试存储 Access Token（安全检查）
- **GIVEN** 尝试存储包含 access_token 的元数据
- **WHEN** 调用 save_session_metadata
- **THEN** 返回 SecurityViolation 错误
- **AND** 数据不被存储

#### Scenario 6: 会话已过期
- **GIVEN** 本地缓存的会话已过期
- **WHEN** 调用 get_session_metadata
- **THEN** 自动清理本地缓存
- **AND** 返回 null

#### Scenario 7: 解密失败（文件损坏或机器变更）
- **GIVEN** 加密文件损坏或机器标识变更
- **WHEN** 调用 get_session_metadata
- **THEN** 返回 null
- **AND** 记录错误日志
- **AND** 清理损坏的文件

#### Scenario 8: 应用启动时恢复会话
- **GIVEN** 用户之前成功登录过
- **AND** 本地存在有效的会话缓存
- **WHEN** 应用启动
- **THEN** 从本地缓存恢复会话
- **AND** 使用 refresh_token 刷新 access_token
- **AND** 更新前端认证状态

#### Scenario 9: 恢复会话失败
- **GIVEN** 本地会话缓存无效或过期
- **WHEN** 尝试恢复会话
- **THEN** 清理本地缓存
- **AND** 跳转到登录页

#### Scenario 10: 登出时清理缓存
- **GIVEN** 用户点击登出
- **WHEN** 执行登出流程
- **THEN** 清理本地会话缓存
- **AND** 清理前端认证状态
- **AND** 跳转到登录页

## 数据规格

### SessionMetadata 结构

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| user_id | string | 是 | 用户 ID |
| username | string | 是 | 用户名（用于显示） |
| display_name | string | 否 | 显示名称 |
| tenant_id | string | 是 | 租户 ID |
| tenant_name | string | 否 | 租户名称 |
| refresh_token | string | 是 | 刷新令牌 |
| expires_at | int64 | 是 | Token 过期时间（Unix 时间戳） |
| last_active_at | int64 | 是 | 最后活跃时间 |
| created_at | int64 | 是 | 创建时间 |

### 禁止存储的字段

| 字段 | 原因 |
|------|------|
| password | 绝对禁止 - 安全风险 |
| password_hash | 禁止 - 由云端管理 |
| access_token | 禁止 - 有效期短，敏感 |
| permissions | 禁止 - 由云端实时计算 |
| roles | 禁止 - 由云端实时计算 |

### 本地存储格式

**加密文件格式：**

```
┌────────────────────────────────────────────┐
│ Nonce (12 bytes)                           │
├────────────────────────────────────────────┤
│ Ciphertext (variable length)               │
├────────────────────────────────────────────┤
│ Authentication Tag (16 bytes)              │
└────────────────────────────────────────────┘
```

**存储位置（Windows）：**

```
%LOCALAPPDATA%\AI-Automated-office\session\metadata.enc
```

## 边界条件

1. **存储大小限制**: SessionMetadata 序列化后 < 10KB
2. **有效期限制**: 会话过期后自动清理
3. **加密失败**: 返回错误，不存储明文
4. **解密失败**: 返回 null，清理损坏文件
5. **并发访问**: 使用文件锁或互斥量保护

## 错误处理

| 错误类型 | 错误信息 | 处理方式 |
|----------|----------|----------|
| SecurityViolation | "Attempted to store forbidden fields: password" | 拒绝存储，记录安全日志 |
| EncryptionError | "Failed to encrypt data: ..." | 返回错误，不存储 |
| DecryptionError | "Failed to decrypt data: ..." | 返回 null，清理文件 |
| FileNotFoundError | "Session cache not found" | 返回 null |
| PermissionError | "Cannot access session file" | 返回错误，提示重新安装 |
| SessionExpired | "Session has expired" | 清理缓存，返回 null |

## 安全规格

### 加密要求

- **算法**: AES-256-GCM
- **密钥长度**: 256 bits
- **Nonce 长度**: 96 bits (12 bytes)
- **认证标签**: 128 bits (16 bytes)

### 密钥派生

- **算法**: PBKDF2-HMAC-SHA256
- **迭代次数**: 100,000
- **盐值**: 固定盐（应用级）
- **输入**: 机器标识

### 文件权限

- **Windows**: 仅当前用户可读写
- **Linux**: chmod 600
- **macOS**: chmod 600

### 安全检查

1. **字段检查**: 检查是否包含禁止字段
2. **类型检查**: 验证字段类型正确
3. **时间检查**: 验证时间戳合理
4. **长度检查**: 验证数据长度在限制内

## 审计日志规格

### 会话保存成功

```json
{
  "event_type": "session.cache.save",
  "result": "success",
  "user_id": "user-uuid",
  "trace_id": "trace-uuid"
}
```

### 安全检查失败

```json
{
  "event_type": "session.cache.security_violation",
  "result": "failure",
  "reason": "attempted_to_store_password",
  "trace_id": "trace-uuid"
}
```

### 会话清理

```json
{
  "event_type": "session.cache.clear",
  "result": "success",
  "reason": "logout|expired|decrypt_failed",
  "trace_id": "trace-uuid"
}
```

## 质量属性

### 性能要求
- 会话保存时间 < 100ms
- 会话读取时间 < 50ms
- 会话清理时间 < 50ms

### 可靠性要求
- 加密失败不存储明文
- 解密失败自动清理
- 文件损坏自动恢复

### 安全要求
- 敏感数据不落地
- 加密数据无法破解
- 机器变更后数据失效

## 与其他模块的关系

### 上游依赖
- 前端登录流程（E2-S2.1-03）
- Tauri 项目初始化（Epic 1）

### 下游依赖
- 会话管理（E2-S2.10-02）
- 强制登出处理

### 协作模块
- 云端会话 API - 用于验证会话有效性
- 前端 authStore - 状态同步

## 实现约束

### 必须遵守

1. **禁止本地鉴权**: 所有鉴权必须走云端
2. **禁止存储密码**: 任何形式的密码都不允许存储
3. **禁止绕过云端**: 本地缓存不能替代云端会话校验

### 允许的操作

1. 存储 refresh_token（用于刷新）
2. 存储用户基本信息（用于显示）
3. 存储租户信息（用于多租户场景）
4. 在会话有效期内快速恢复

## 测试规格

### 单元测试

| 测试项 | 输入 | 期望输出 |
|--------|------|----------|
| 加密解密 | 有效数据 | 数据一致 |
| 安全检查-密码 | 含 password 字段 | SecurityViolation |
| 安全检查-Access Token | 含 access_token 字段 | SecurityViolation |
| 过期检查 | 已过期元数据 | 返回 null + 清理 |

### 集成测试

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 保存读取流程 | save -> get | 数据一致 |
| 清理流程 | clear -> get | 返回 null |
| 过期自动清理 | 等待过期后 get | 返回 null + 文件删除 |

### E2E 测试

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 会话恢复 | 重启应用 | 自动恢复会话 |
| 登出清理 | 登出 -> 重启 | 需要重新登录 |
| 会话过期 | 等待过期 -> 重启 | 需要重新登录 |

## 验收检查清单

- [ ] 实现 SessionMetadata 结构
- [ ] 实现 AES-256-GCM 加密
- [ ] 实现机器绑定密钥派生
- [ ] 实现 save_session_metadata 命令
- [ ] 实现 get_session_metadata 命令
- [ ] 实现 clear_session_cache 命令
- [ ] 实现安全检查（阻止密码存储）
- [ ] 实现过期自动清理
- [ ] 与前端 authStore 集成
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过
- [ ] E2E 测试通过