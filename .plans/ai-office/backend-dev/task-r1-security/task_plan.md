# R1-R2 安全修复任务计划

## G1: JWT安全修复
- 当前问题：`jwt_secret` 硬编码为 `"secret_key_change_me"` (auth/mod.rs:39)
- 修复方案：
  1. `AuthService::new()` 从环境变量 `JWT_SECRET` 读取
  2. 保留默认值用于开发环境
  3. 启动时若使用默认值则打印 WARNING
  4. 更新 lib.rs 初始化代码传递 secret

## G2: CSP配置
- 当前问题：`tauri.conf.json` 中 `csp: null` (无CSP策略)
- 修复方案：
  1. 添加合理CSP策略
  2. 允许 self、unsafe-inline for style、ws://localhost
  3. 限制 script-src 为 self

## G4: RBAC基础实现
- 当前问题：无角色权限检查
- 修复方案：
  1. 定义 Role 枚举：Admin/Manager/Employee
  2. 在 auth/mod.rs 添加 `check_permission` 函数
  3. 在关键命令中添加权限检查
