# Proposal: Local Session Cache Wrapper

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

Epic 2 用户认证系统采用云端主导的架构。E2-S2.1-03 已完成前端登录流程，本提案旨在实现 Tauri 本地会话缓存层，作为云端会话的辅助存储，支持离线场景下的快速恢复和会话状态同步。

### 业务背景
- 用户需要快速恢复会话（FR27）
- 本地数据需要安全存储（NFR10）
- 会话需要统一管理（NFR12）

### 技术背景
- 使用 Tauri + Rust 构建桌面端
- 本地存储使用 SQLite + 加密文件
- 遵循 ADR-003 本地优先存储策略

### 架构约束（重要）

根据 `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md` 的规定：

> **Tauri/Rust 在 Epic 2 中只承担以下能力：**
> - 保存极少量必要登录元数据
> - 清理本地缓存
> - 提供桌面通知、系统托盘、窗口控制
> - 记录本地诊断日志
>
> **明确禁止：**
> - ❌ 本地保存明文密码
> - ❌ 本地自行判定登录成功
> - ❌ 本地绕过云端会话与权限校验

## 目标

实现安全的本地会话缓存管理，包括：
1. 定义安全的会话元数据结构
2. 实现加密存储机制
3. 提供 Tauri 命令接口
4. 与前端 authStore 集成
5. 支持会话清理和刷新

## 范围

### 包含
- 定义 SessionMetadata 结构（仅包含安全数据）
- 实现 AES-256-GCM 加密存储
- 实现 Tauri 命令（save/get/clear）
- 实现安全检查（阻止密码存储）
- 与前端 authStore 集成
- 实现会话刷新逻辑

### 不包含
- 本地登录验证（由云端负责）
- 本地权限计算（由云端负责）
- 离线登录功能（不支持）
- 会话持久化策略（由云端控制）

## 影响范围

### Tauri/Rust 后端
- `src-tauri/src/commands/session.rs` - 新增会话命令
- `src-tauri/src/session/metadata.rs` - 新增元数据结构
- `src-tauri/src/session/cache.rs` - 新增缓存管理
- `src-tauri/src/crypto/local_encryptor.rs` - 新增加密模块

### 前端
- `src/lib/tauri.ts` - 新增 Tauri 命令封装
- `src/stores/authStore.ts` - 更新集成逻辑

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 本地存储被破解 | 低 | 高 | AES-256-GCM 加密，密钥机器绑定 |
| 缓存与云端状态不一致 | 中 | 中 | 使用云端会话校验接口 |
| 误存储敏感信息 | 低 | 高 | 安全检查，阻止密码存储 |
| 离线场景下的会话验证 | 中 | 低 | 离线时使用缓存，上线后校验 |

## 实施计划

1. **Step 1**: 定义 SessionMetadata 结构
2. **Step 2**: 实现本地加密模块
3. **Step 3**: 实现缓存存储和读取
4. **Step 4**: 实现 Tauri 命令接口
5. **Step 5**: 实现安全检查
6. **Step 6**: 与前端 authStore 集成
7. **Step 7**: 编写单元测试
8. **Step 8**: 编写集成测试

## 依赖关系

### 前置依赖
- E2-S2.1-03: Frontend login flow（必须完成）
- Epic 1, Story 1.x: Tauri 项目初始化

### 后置依赖
- E2-S2.10-02: Force logout and expiry handling