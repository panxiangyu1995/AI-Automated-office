# Epic 2, Story 2.10: Session Model and Timeout Engine

## 概述

构建云端会话模型和空闲超时引擎，实现 30 分钟空闲超时规则、会话状态管理和会话列表查询。这是会话安全管理的基础设施。

## 铁律映射

### PRD 需求
- **FR27**: 用户可以使用账号密码登录系统（会话管理相关）

### 架构需求
- **ADR-005**: 多租户采用数据库级隔离，会话数据按租户隔离

### NFR 需求
- **NFR12**: 会话管理，会话超时 30 分钟，支持强制登出

## 验收标准

- [ ] 定义 sessions 表和会话状态
- [ ] 在受保护请求中更新 last_active_at
- [ ] 实现 30 分钟空闲超时规则
- [ ] 支持会话列表查询

## 技术方案

### 后端模块结构

```
cloud-server/internal/module/auth/
├── domain/
│   └── entity/
│       └── session.go           # 会话实体
├── application/
│   └── service/
│       └── session_service.go   # 会话服务
└── infrastructure/
    └── persistence/
        └── session_repo.go      # 会话仓储
```

### 核心功能

1. **会话状态管理**
   - 创建会话
   - 更新活跃时间
   - 撤销会话
   - 会话状态转换

2. **空闲超时引擎**
   - 30 分钟空闲检测
   - 自动过期会话
   - 定时清理任务

3. **会话查询**
   - 用户会话列表
   - 会话详情
   - 活跃会话统计

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`