# backend-dev - 工作日志

> 用于上下文恢复。压缩/重启后先读此文件。

---

## 2026-04-16 - R1-R2 安全修复

### G1: JWT安全修复
- `auth/mod.rs`: 硬编码 `"secret_key_change_me"` 改为从环境变量 `JWT_SECRET` 读取
- 保留默认值用于开发环境
- 使用默认值时打印 WARNING 日志
- 新增 `with_secret()` 构造函数供测试使用
- 测试代码更新为 `with_secret()`，不依赖环境变量

### G2: CSP配置
- `tauri.conf.json`: 从 `csp: null` 改为完整CSP策略
- default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
- connect-src 允许 self + localhost + openrouter.ai
- frame-src 'none'

### G4: RBAC基础实现
- `auth/mod.rs`: 新增 `Role` 枚举 (Employee < Manager < Admin)
- `auth/mod.rs`: 新增 `Permission` 枚举 (Read/Write/Admin)
- `auth/mod.rs`: 新增 `check_permission()` 函数
- `commands/auth.rs`: register 命令添加 admin 权限检查
- `commands/auth.rs`: 新增 `check_user_permission` 命令
- `lib.rs`: 注册 `check_user_permission` 命令

### 验证
- `cargo check` 编译通过
