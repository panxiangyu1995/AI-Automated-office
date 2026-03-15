# SQLite本地存储初始化

**Story 1.8** | Epic 1 - 基础设施与桌面端框架

## 概述

初始化本地SQLite数据库，支持离线模式、会话管理、记忆存储。

## 铁律映射

| 铁律文档 | 映射内容 |
|----------|----------|
| **PRD** | FR5 离线模式, FR38-FR42 数据同步 |
| **架构** | ADR-003 本地优先存储, ADR-024 数据库设计, ADR-030 检查点系统 |
| **UX** | 无直接映射（后端基础设施） |
| **Epic** | Epic 1, Story 1.8 |

## 验收标准

- [ ] SQLite数据库在用户数据目录正确创建
- [ ] 核心表结构创建完成
- [ ] 数据库版本迁移机制工作正常
- [ ] 租户数据隔离生效

## 依赖关系

```
无前置依赖（可与 Story 1.6 并行）
    ↓
Story 1.8 (SQLite初始化)
    ↓
├── Story 1.9 (向量数据库)
└── Story 1.12 (离线模式)
```

## 数据库位置

| 平台 | 路径 |
|------|------|
| Windows | `%LOCALAPPDATA%\AI-Automated-office\data\{tenant_id}\local.db` |
| macOS | `~/Library/Application Support/AI-Automated-office/data/{tenant_id}/local.db` |
| Linux | `~/.local/share/ai-automated-office/data/{tenant_id}/local.db` |

## 核心表结构

| 表名 | 说明 |
|------|------|
| `sessions` | 本地会话缓存 |
| `messages` | 消息记录 |
| `sync_queue` | 同步队列 |
| `memory_facts` | 记忆事实存储 |
| `checkpoints` | 检查点元数据 |
| `context_summaries` | 上下文摘要 |

## 相关文档

- [proposal.md](./proposal.md) - 变更提案
- [design.md](./design.md) - 技术设计
- [tasks.md](./tasks.md) - 任务列表
- [specs/spec.md](./specs/spec.md) - 验收规格
