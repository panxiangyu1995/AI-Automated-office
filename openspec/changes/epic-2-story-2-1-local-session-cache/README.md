# Epic 2, Story 2.1: Local Session Cache Wrapper

## 概述

实现 Tauri 本地会话元数据缓存和安全清理流程。此模块严格遵循架构约束：**本地不承担账号密码鉴权，不存储明文密码，不自行判定登录成功**。仅作为云端会话的辅助缓存层，存储少量必要的会话元数据，支持离线场景下的快速恢复。

## 铁律映射

### PRD 需求
- **FRs**: FR27 - 用户可以使用账号密码登录系统
- **NFRs**: 
  - NFR10 - 本地数据安全，敏感数据本地加密存储
  - NFR12 - 会话管理，会话超时 30 分钟，支持强制登出

### 架构需求
- **ADR-001**: 分层微内核架构，本地层作为辅助能力
- **ADR-003**: 本地优先存储策略

### 架构约束（重要）

> **明确禁止**：
> - ❌ 本地保存明文密码
> - ❌ 本地自行判定登录成功
> - ❌ 本地绕过云端会话与权限校验
> - ❌ 本地缓存作为鉴权主入口

> **允许**：
> - ✅ 保存极少量必要的会话元数据
> - ✅ 辅助离线场景下的快速恢复
> - ✅ 配合云端会话状态清理本地缓存

## 验收标准

- [ ] 定义安全的本地会话元数据结构
- [ ] 实现 Tauri save_session_metadata 命令
- [ ] 实现 Tauri clear_session_cache 命令
- [ ] 实现 Tauri get_session_metadata 命令
- [ ] 阻止明文密码存储（安全检查）
- [ ] 与前端 authStore 集成

## 技术方案

### 存储内容

**允许存储的元数据：**
- Refresh Token（用于 Token 刷新）
- 用户基本信息（ID、用户名、显示名称）
- 租户信息（ID、名称）
- 最后活跃时间

**禁止存储：**
- ❌ Access Token（敏感，有效期短）
- ❌ 密码（明文或哈希）
- ❌ 详细权限列表（由云端实时计算）

### 存储位置

```
用户数据目录：
%LOCALAPPDATA%\AI-Automated-office\
├── session/
│   ├── metadata.json          # 会话元数据（加密）
│   └── key.der                # 加密密钥（机器绑定）
└── cache/
    └── ...
```

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`
- 前端登录: `openspec/changes/epic-2-story-2-1-frontend-login-flow/`