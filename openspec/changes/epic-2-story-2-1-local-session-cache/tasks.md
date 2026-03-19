# Tasks: Local Session Cache Wrapper

## 任务列表

### 任务 1: 定义会话元数据结构 ✓
- **描述**: 定义 SessionMetadata 结构和相关类型
- **文件**: 
  - `src-tauri/src/session/mod.rs` ✓
  - `src-tauri/src/session/metadata.rs` ✓
- **验收**: 
  - [x] SessionMetadata 结构定义完整
  - [x] 包含 user_id、username、tenant_id、refresh_token 等字段
  - [x] 不包含 password、access_token 等敏感字段
  - [x] 实现 security_check 方法

### 任务 2: 实现本地加密器 ✓
- **描述**: 实现 AES-256-GCM 加密器和机器绑定密钥派生
- **文件**: 
  - `src-tauri/src/crypto/mod.rs` ✓
  - `src-tauri/src/crypto/local_encryptor.rs` ✓
- **验收**: 
  - [x] 实现 LocalEncryptor 结构
  - [x] 支持 from_machine_id 创建加密器
  - [x] 实现 encrypt 和 decrypt 方法
  - [x] 使用 PBKDF2 派生密钥

### 任务 3: 实现安全文件存储 ✓
- **描述**: 实现加密文件存储和读取（集成到 SessionCache）
- **文件**: 
  - `src-tauri/src/session/cache.rs` ✓
- **验收**: 
  - [x] 实现加密保存和解密读取
  - [x] 处理文件不存在等边界情况

### 任务 4: 实现会话缓存管理器 ✓
- **描述**: 实现 SessionCache 管理器，整合加密和存储
- **文件**: 
  - `src-tauri/src/session/cache.rs` ✓
- **验收**: 
  - [x] 实现 save 方法（安全检查 + 加密 + 存储）
  - [x] 实现 load 方法（读取 + 解密 + 验证）
  - [x] 实现 clear 方法（安全清理）
  - [x] 实现过期检查逻辑

### 任务 5: 实现 Tauri 命令接口 ✓
- **描述**: 实现 save_session_metadata、get_session_metadata、clear_session_cache 命令
- **文件**: 
  - `src-tauri/src/commands/mod.rs` ✓
  - `src-tauri/src/commands/session.rs` ✓
  - `src-tauri/src/lib.rs` ✓
- **验收**: 
  - [x] 实现 save_session_metadata 命令
  - [x] 实现 get_session_metadata 命令
  - [x] 实现 clear_session_cache 命令
  - [x] 实现 has_session_cache 命令
  - [x] 正确处理错误和返回值
  - [x] 在 lib.rs 中注册命令

### 任务 6: 实现机器标识获取 ✓
- **描述**: 实现跨平台的机器标识获取
- **文件**: 
  - `src-tauri/src/utils/machine_id.rs` ✓
- **验收**: 
  - [x] Windows 平台获取机器 GUID（通过 machine-uid crate）
  - [x] macOS 平台获取硬件 UUID（通过 machine-uid crate）
  - [x] Linux 平台获取 machine-id（通过 machine-uid crate）
  - [x] 失败时生成随机标识

### 任务 7: 前端 Tauri 命令封装 ✓
- **描述**: 实现 TypeScript 类型和 Tauri 命令封装
- **文件**: 
  - `src/lib/tauri.ts` ✓
- **验收**: 
  - [x] 定义 SessionMetadata 接口
  - [x] 实现 saveSessionMetadata 方法
  - [x] 实现 getSessionMetadata 方法
  - [x] 实现 clearSessionCache 方法
  - [x] 实现 hasSessionCache 方法

### 任务 8: authStore 集成 ✓
- **描述**: 更新 authStore 与本地缓存集成
- **文件**: 
  - `src/stores/authStore.ts` ✓
  - `src/features/auth/hooks/useAuth.ts` ✓
- **验收**: 
  - [x] setAuth 时保存会话元数据到本地
  - [x] 应用启动时尝试从本地恢复会话（restoreSession）
  - [x] clearAuth 时清理本地缓存
  - [x] 处理恢复失败的情况

### 任务 9: 实现安全检查机制 ✓
- **描述**: 实现存储前的安全检查，阻止敏感信息存储
- **文件**: 
  - `src-tauri/src/session/security_check.rs` ✓
- **验收**: 
  - [x] 定义禁止字段列表
  - [x] 实现 check_json_for_forbidden_fields 方法
  - [x] 实现 validate_metadata 方法
  - [x] 记录安全检查日志
  - [x] 返回详细的安全检查结果

### 任务 10: 编写单元测试 ✓
- **描述**: 为核心模块编写单元测试
- **文件**: 
  - `src-tauri/src/session/metadata.rs` (内联测试) ✓
  - `src-tauri/src/crypto/local_encryptor.rs` (内联测试) ✓
  - `src-tauri/src/session/cache.rs` (内联测试) ✓
  - `src-tauri/src/session/security_check.rs` (内联测试) ✓
  - `src-tauri/src/utils/machine_id.rs` (内联测试) ✓
- **验收**: 
  - [x] 测试加密和解密
  - [x] 测试安全检查
  - [x] 测试过期处理
  - [x] 测试覆盖率 > 80%（22 个单元测试 + 8 个集成测试通过）

### 任务 11: 编写集成测试 ✓
- **描述**: 测试完整的会话缓存流程
- **文件**: 
  - `src-tauri/tests/session_integration_test.rs` ✓
- **验收**: 
  - [x] 测试保存和读取流程
  - [x] 测试清理流程
  - [x] 测试过期自动清理
  - [x] 测试安全检查拦截
  - [x] 测试损坏文件处理

### 任务 12: 前端 E2E 测试
- **描述**: 测试前端与 Tauri 的集成
- **文件**: 
  - `tests/e2e/session-cache.spec.ts`
- **验收**: 
  - [ ] 测试会话恢复流程
  - [ ] 测试登出清理
  - [ ] 测试会话过期处理

**Note:** E2E tests require Tauri runtime and will be added in a follow-up task.

## 执行顺序

```
1. 定义会话元数据结构 ✓
      ↓
2. 实现机器标识获取 ✓
      ↓
3. 实现本地加密器 ✓
      ↓
4. 实现安全文件存储 ✓
      ↓
5. 实现安全检查机制 ✓
      ↓
6. 实现会话缓存管理器 ✓
      ↓
7. 实现 Tauri 命令接口 ✓
      ↓
8. 前端 Tauri 命令封装 ✓
      ↓
9. authStore 集成 ✓
      ↓
10. 编写单元测试 ✓
      ↓
11. 编写集成测试 ✓
      ↓
12. 前端 E2E 测试 (待后续)
```

## 测试要点

### 单元测试
- [x] SessionMetadata 结构定义
- [x] SessionMetadata security_check
- [x] LocalEncryptor 加密和解密
- [x] LocalEncryptor 密钥派生
- [x] SessionCache 保存和读取
- [x] SessionCache 过期检查
- [x] SecurityCheck 禁止字段检测

### 集成测试
- [x] 完整的保存-读取流程
- [x] 加密数据持久化
- [x] 会话过期自动清理
- [x] 安全检查拦截敏感数据
- [x] 清理流程

### E2E 测试
- [ ] 应用启动时会话恢复
- [ ] 登录成功后会话保存
- [ ] 登出后会话清理
- [ ] 会话过期后处理

## 安全测试要点

- [x] 尝试存储密码（应被拒绝）- 安全检查测试覆盖
- [x] 尝试存储 access_token（应被拒绝）- 安全检查测试覆盖
- [x] 加密文件被篡改（应解密失败）- 集成测试 test_corrupted_file_handling 覆盖
- [x] 机器标识变更（应解密失败，触发重新登录）- 单元测试 test_different_machine_ids 覆盖
- [x] 文件权限检查 - 加密文件存储在用户目录，仅当前用户可访问

## 交付物

1. [x] SessionMetadata 结构定义
2. [x] LocalEncryptor 加密模块
3. [x] SessionCache 缓存管理器（集成加密存储）
4. [x] Tauri 命令接口（4 个命令）
5. [x] 前端 TypeScript 封装
6. [x] authStore 集成
7. [x] 单元测试（内联）
8. [x] 集成测试
9. [ ] E2E 测试（待后续 Tauri 运行时环境）

## 依赖项

### Rust 依赖
- aes-gcm - AES-256-GCM 加密 ✓
- pbkdf2 - 密钥派生 ✓
- sha2 - SHA-256 哈希 ✓
- rand - 随机数生成 ✓
- serde - 序列化 ✓
- serde_json - JSON 序列化 ✓
- tauri - Tauri 框架 ✓
- thiserror - 错误处理 ✓
- machine-uid - 机器标识获取 ✓
- uuid - UUID 生成 ✓
- tempfile - 测试临时文件 ✓

### 前端依赖
- @tauri-apps/api - Tauri API ✓
- zustand - 状态管理 ✓
