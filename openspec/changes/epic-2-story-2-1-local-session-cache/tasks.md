# Tasks: Local Session Cache Wrapper

## 任务列表

### 任务 1: 定义会话元数据结构
- **描述**: 定义 SessionMetadata 结构和相关类型
- **文件**: 
  - `src-tauri/src/session/mod.rs`
  - `src-tauri/src/session/metadata.rs`
- **验收**: 
  - SessionMetadata 结构定义完整
  - 包含 user_id、username、tenant_id、refresh_token 等字段
  - 不包含 password、access_token 等敏感字段
  - 实现 security_check 方法

### 任务 2: 实现本地加密器
- **描述**: 实现 AES-256-GCM 加密器和机器绑定密钥派生
- **文件**: 
  - `src-tauri/src/crypto/mod.rs`
  - `src-tauri/src/crypto/local_encryptor.rs`
  - `src-tauri/src/crypto/error.rs`
- **验收**: 
  - 实现 LocalEncryptor 结构
  - 支持 from_machine_id 创建加密器
  - 实现 encrypt 和 decrypt 方法
  - 使用 PBKDF2 派生密钥

### 任务 3: 实现安全文件存储
- **描述**: 实现加密文件存储和读取
- **文件**: 
  - `src-tauri/src/storage/mod.rs`
  - `src-tauri/src/storage/secure_file_storage.rs`
- **验收**: 
  - 实现 SecureFileStorage 结构
  - 支持加密保存和解密读取
  - 正确设置文件权限
  - 处理文件不存在等边界情况

### 任务 4: 实现会话缓存管理器
- **描述**: 实现 SessionCache 管理器，整合加密和存储
- **文件**: 
  - `src-tauri/src/session/cache.rs`
- **验收**: 
  - 实现 save 方法（安全检查 + 加密 + 存储）
  - 实现 load 方法（读取 + 解密 + 验证）
  - 实现 clear 方法（安全清理）
  - 实现过期检查逻辑

### 任务 5: 实现 Tauri 命令接口
- **描述**: 实现 save_session_metadata、get_session_metadata、clear_session_cache 命令
- **文件**: 
  - `src-tauri/src/commands/mod.rs`
  - `src-tauri/src/commands/session.rs`
- **验收**: 
  - 实现 save_session_metadata 命令
  - 实现 get_session_metadata 命令
  - 实现 clear_session_cache 命令
  - 正确处理错误和返回值
  - 在 main.rs 中注册命令

### 任务 6: 实现机器标识获取
- **描述**: 实现跨平台的机器标识获取
- **文件**: 
  - `src-tauri/src/utils/machine_id.rs`
- **验收**: 
  - Windows 平台获取机器 GUID
  - macOS 平台获取硬件 UUID
  - Linux 平台获取 machine-id
  - 失败时生成随机标识

### 任务 7: 前端 Tauri 命令封装
- **描述**: 实现 TypeScript 类型和 Tauri 命令封装
- **文件**: 
  - `src/lib/tauri.ts`
  - `src/types/tauri.types.ts`
- **验收**: 
  - 定义 SessionMetadata 接口
  - 实现 saveSessionMetadata 方法
  - 实现 getSessionMetadata 方法
  - 实现 clearSessionCache 方法

### 任务 8: authStore 集成
- **描述**: 更新 authStore 与本地缓存集成
- **文件**: 
  - `src/stores/authStore.ts`
- **验收**: 
  - setAuth 时保存会话元数据到本地
  - 应用启动时尝试从本地恢复会话
  - clearAuth 时清理本地缓存
  - 处理恢复失败的情况

### 任务 9: 实现安全检查机制
- **描述**: 实现存储前的安全检查，阻止敏感信息存储
- **文件**: 
  - `src-tauri/src/session/security_check.rs`
- **验收**: 
  - 定义禁止字段列表
  - 实现 contains_forbidden_fields 方法
  - 记录安全检查日志
  - 返回详细的安全检查结果

### 任务 10: 编写单元测试
- **描述**: 为核心模块编写单元测试
- **文件**: 
  - `src-tauri/src/session/metadata_test.rs`
  - `src-tauri/src/crypto/local_encryptor_test.rs`
  - `src-tauri/src/session/cache_test.rs`
  - `src-tauri/src/session/security_check_test.rs`
- **验收**: 
  - 测试加密和解密
  - 测试安全检查
  - 测试过期处理
  - 测试错误处理
  - 覆盖率 > 80%

### 任务 11: 编写集成测试
- **描述**: 测试完整的会话缓存流程
- **文件**: 
  - `src-tauri/tests/session_integration_test.rs`
- **验收**: 
  - 测试保存和读取流程
  - 测试清理流程
  - 测试过期自动清理
  - 测试安全检查拦截

### 任务 12: 前端 E2E 测试
- **描述**: 测试前端与 Tauri 的集成
- **文件**: 
  - `tests/e2e/session-cache.spec.ts`
- **验收**: 
  - 测试会话恢复流程
  - 测试登出清理
  - 测试会话过期处理

## 执行顺序

```
1. 定义会话元数据结构
      ↓
2. 实现机器标识获取
      ↓
3. 实现本地加密器
      ↓
4. 实现安全文件存储
      ↓
5. 实现安全检查机制
      ↓
6. 实现会话缓存管理器
      ↓
7. 实现 Tauri 命令接口
      ↓
8. 前端 Tauri 命令封装
      ↓
9. authStore 集成
      ↓
10. 编写单元测试
      ↓
11. 编写集成测试
      ↓
12. 前端 E2E 测试
```

## 测试要点

### 单元测试
- [ ] SessionMetadata 结构定义
- [ ] SessionMetadata security_check
- [ ] LocalEncryptor 加密和解密
- [ ] LocalEncryptor 密钥派生
- [ ] SecureFileStorage 读写
- [ ] SessionCache 保存和读取
- [ ] SessionCache 过期检查
- [ ] SecurityCheck 禁止字段检测

### 集成测试
- [ ] 完整的保存-读取流程
- [ ] 加密数据持久化
- [ ] 会话过期自动清理
- [ ] 安全检查拦截敏感数据
- [ ] 清理流程

### E2E 测试
- [ ] 应用启动时会话恢复
- [ ] 登录成功后会话保存
- [ ] 登出后会话清理
- [ ] 会话过期后处理

## 安全测试要点

- [ ] 尝试存储密码（应被拒绝）
- [ ] 尝试存储 access_token（应被拒绝）
- [ ] 加密文件被篡改（应解密失败）
- [ ] 机器标识变更（应解密失败，触发重新登录）
- [ ] 文件权限检查

## 交付物

1. SessionMetadata 结构定义
2. LocalEncryptor 加密模块
3. SecureFileStorage 安全存储
4. SessionCache 缓存管理器
5. Tauri 命令接口（3 个命令）
6. 前端 TypeScript 封装
7. authStore 集成
8. 单元测试和集成测试

## 依赖项

### Rust 依赖
- aes-gcm - AES-256-GCM 加密
- pbkdf2 - 密钥派生
- sha2 - SHA-256 哈希
- rand - 随机数生成
- serde - 序列化
- serde_json - JSON 序列化
- tauri - Tauri 框架
- thiserror - 错误处理

### 前端依赖
- @tauri-apps/api - Tauri API
- zustand - 状态管理