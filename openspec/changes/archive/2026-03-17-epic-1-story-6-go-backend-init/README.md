# Go云端后端项目初始化

**Story 1.6** | Epic 1 - 基础设施与桌面端框架

## 概述

创建Go语言云端后端项目基础框架，为认证、租户管理、数据同步等服务提供运行环境。

## 铁律映射

| 铁律文档 | 映射内容 |
|----------|----------|
| **PRD** | FR27 - 用户登录基础 |
| **架构** | ADR-005 - 多租户架构，Cloud Layer 设计 |
| **UX** | 无直接映射（后端基础设施） |
| **Epic** | Epic 1, Story 1.6 |

## 验收标准

- [ ] Go项目结构符合标准布局
- [ ] Gin Web框架正常工作
- [ ] GORM数据库ORM配置完成
- [ ] Viper配置管理支持环境变量
- [ ] Zap日志系统输出结构化日志
- [ ] Swagger API文档可访问
- [ ] Docker配置可启动
- [ ] 热重载开发模式生效

## 依赖关系

```
无前置依赖
    ↓
Story 1.6 (Go后端初始化)
    ↓
├── Story 1.7 (PostgreSQL初始化)
├── Story 1.10 (前后端通信架构)
└── Story 1.11 (用户登录)
```

## 技术栈

| 组件 | 选择 | 版本 |
|------|------|------|
| 运行时 | Go | 1.21+ |
| Web框架 | Gin | v1.9+ |
| ORM | GORM | v1.25+ |
| 配置 | Viper | v1.18+ |
| 日志 | Zap | v1.26+ |
| API文档 | Swagger | v1.16+ |

## 相关文档

- [proposal.md](./proposal.md) - 变更提案
- [design.md](./design.md) - 技术设计
- [tasks.md](./tasks.md) - 任务列表
- [specs/spec.md](./specs/spec.md) - 验收规格
