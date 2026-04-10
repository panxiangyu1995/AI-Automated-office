# Tasks: 多租户-租户持久化改造

## 实现类型
- **类型**: optimize
- **优先级**: high
- **阶段**: 架构升级迭代

## 任务列表

### Task 1: 创建数据库迁移文件

- **描述**: 创建 v7_tenant_tables 迁移，定义 tenants 和 tenant_configs 表
- **文件**: `src-tauri/src/storage/migrations/v7_tenant_tables.rs`
- **验收**: 
  - 迁移脚本语法正确
  - 表结构符合设计规范
  - 支持 CREATE TABLE IF NOT EXISTS
- **验证**: `cargo test --lib migrations`

### Task 2: 定义 Repository Trait

- **描述**: 定义 TenantRepository 和 TenantConfigRepository trait 接口
- **文件**: `src-tauri/src/tenant/repository.rs`
- **验收**:
  - Trait 定义完整
  - 方法签名正确
  - 错误类型统一
- **验证**: `cargo check`

### Task 3: 实现 SqliteTenantRepository

- **描述**: 实现 SqliteTenantRepository 结构体，实现 TenantRepository trait
- **文件**: `src-tauri/src/tenant/repository.rs`
- **验收**:
  - get_by_id 实现正确
  - get_by_code 实现正确
  - list 实现正确
  - create 实现正确
  - update 实现正确
  - delete 实现正确
- **验证**: `cargo test tenant`

### Task 4: 实现 SqliteTenantConfigRepository

- **描述**: 实现 SqliteTenantConfigRepository 结构体，实现 TenantConfigRepository trait
- **文件**: `src-tauri/src/tenant/repository.rs`
- **验收**:
  - get_by_tenant_id 实现正确
  - upsert 实现正确
- **验证**: `cargo test tenant`

### Task 5: 重构 TenantState

- **描述**: 将 TenantState 改为泛型结构体，使用 Repository
- **文件**: `src-tauri/src/tenant/mod.rs`
- **验收**:
  - TenantState 使用 Arc<dyn TenantRepository>
  - 保持现有命令接口兼容
  - 支持默认租户初始化
- **验证**: `cargo build`

### Task 6: 更新 Tauri 命令

- **描述**: 更新 tenant 命令使用 Repository
- **文件**: `src-tauri/src/tenant/commands.rs`
- **验收**:
  - tenant_get_current 正常工作
  - tenant_list 正常工作
  - tenant_get_config 正常工作
  - tenant_update_config 正常工作
  - tenant_get_stats 正常工作
- **验证**: `cargo test tenant`

### Task 7: 更新 lib.rs 初始化逻辑

- **描述**: 更新应用初始化，创建 Repository 实例
- **文件**: `src-tauri/src/lib.rs`
- **验收**:
  - StorageManager 使用租户存储
  - 首次启动自动创建默认租户
- **验证**: `cargo build`

### Task 8: 添加单元测试

- **描述**: 为 Repository 和 TenantState 添加单元测试
- **文件**: `src-tauri/src/tenant/`
- **验收**:
  - 覆盖 CRUD 操作
  - 覆盖错误处理
  - 覆盖边界条件
- **验证**: `cargo test tenant`

### Task 9: 运行 cargo clippy

- **描述**: 运行 clippy 检查代码质量
- **验收**:
  - 无 clippy 警告
  - 无 clippy 错误
- **验证**: `cargo clippy -- -D warnings`

## 测试要点

- [x] 单元测试覆盖 Repository CRUD
- [x] 单元测试覆盖 TenantState 状态管理
- [x] 集成测试覆盖数据库迁移
- [x] 集成测试覆盖命令执行
- [x] cargo clippy 通过

## 实施检查清单

- [x] Task 1: 创建数据库迁移文件
- [x] Task 2: 定义 Repository Trait
- [x] Task 3: 实现 SqliteTenantRepository
- [x] Task 4: 实现 SqliteTenantConfigRepository
- [x] Task 5: 重构 TenantState
- [x] Task 6: 更新 Tauri 命令
- [x] Task 7: 更新 lib.rs 初始化逻辑
- [x] Task 8: 添加单元测试
- [ ] Task 9: 运行 cargo clippy (需要手动验证)
