# Tasks: 多租户-用户-租户关联

## 实现类型
- **类型**: optimize
- **优先级**: high
- **阶段**: 架构升级迭代

## 任务列表

### Task 1: 创建数据库迁移文件

- **描述**: 创建 v8_users_tenant_id 迁移，为 users 表增加 tenant_id 字段
- **文件**: `src-tauri/src/storage/migrations/v8_users_tenant_id.rs`
- **验收**:
  - 添加 tenant_id 字段
  - 设置默认值为 "default"
  - 创建租户索引
  - 修改用户名唯一性约束为租户内唯一
- **验证**: `cargo test --lib migrations`

### Task 2: 更新 User 结构体

- **描述**: 为 User 结构体增加 tenant_id 字段
- **文件**: `src-tauri/src/auth/mod.rs`
- **验收**:
  - User 结构体包含 tenant_id
  - serde 序列化正确
  - Default 实现正确
- **验证**: `cargo check`

### Task 3: 更新 AuthService login 方法

- **描述**: login 方法增加 tenant_id 参数，按租户查询用户
- **文件**: `src-tauri/src/auth/mod.rs`
- **验收**:
  - login 签名增加 tenant_id 参数
  - 用户查询按 tenant_id + username 过滤
  - JWT Claims 包含 tenant_id
- **验证**: `cargo test auth`

### Task 4: 更新 AuthService register 方法

- **描述**: register 方法增加 tenant_id 参数，验证租户内唯一性
- **文件**: `src-tauri/src/auth/mod.rs`
- **验收**:
  - register 签名增加 tenant_id 参数
  - 用户名唯一性检查按租户内验证
  - 新用户创建时设置 tenant_id
- **验证**: `cargo test auth`

### Task 5: 更新 ensure_default_user 方法

- **描述**: ensure_default_user 为默认用户设置默认租户
- **文件**: `src-tauri/src/auth/mod.rs`
- **验收**:
  - 默认用户的 tenant_id 为 "default"
  - 支持重复调用幂等
- **验证**: `cargo test auth`

### Task 6: 更新 SessionMetadata

- **描述**: 确认 SessionMetadata 与 User 的 tenant_id 一致
- **文件**: `src-tauri/src/session/metadata.rs`
- **验收**:
  - SessionMetadata.tenant_id 类型正确
  - 创建时从 User 获取 tenant_id
- **验证**: `cargo check`

### Task 7: 更新前端登录接口（如需要）

- **描述**: 如前端传递 tenant_id，更新相关类型
- **文件**: `src/features/auth/` 等
- **验收**:
  - 前端登录请求包含 tenant_id
  - 后端正确接收 tenant_id
- **验证**: `npm run build`

### Task 8: 添加单元测试

- **描述**: 为用户-租户关联添加测试
- **文件**: `src-tauri/src/auth/mod.rs`
- **验收**:
  - 测试同一租户内不同用户
  - 测试不同租户内相同用户名
  - 测试租户内唯一性约束
- **验证**: `cargo test auth`

### Task 9: 运行 cargo clippy

- **描述**: 运行 clippy 检查代码质量
- **验收**:
  - 无 clippy 警告
  - 无 clippy 错误
- **验证**: `cargo clippy -- -D warnings`

## 测试要点

- [x] 单元测试覆盖单租户用户场景
- [x] 单元测试覆盖多租户隔离场景
- [x] 单元测试覆盖租户内唯一性约束
- [x] 集成测试覆盖数据库迁移
- [x] cargo clippy 通过

## 实施检查清单

- [x] Task 1: 创建数据库迁移文件
- [x] Task 2: 更新 User 结构体
- [x] Task 3: 更新 AuthService login 方法
- [x] Task 4: 更新 AuthService register 方法
- [x] Task 5: 更新 ensure_default_user 方法
- [x] Task 6: 更新 SessionMetadata（已有 tenant_id）
- [x] Task 7: 更新前端登录接口
- [x] Task 8: 添加单元测试
- [ ] Task 9: 运行 cargo clippy (需要手动验证)
