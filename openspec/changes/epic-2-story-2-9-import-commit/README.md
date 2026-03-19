# Epic 2, Story 2.9: Import Commit and Receipt

## 概述

实现用户导入确认提交功能，支持预览确认后的批量数据写入、幂等性控制、结果回执和失败详情返回。这是导入导出流程的第二步，确保数据安全可靠地写入数据库。

## 铁律映射

### PRD 需求
- **FR33**: 管理员可以导入和导出用户数据

### 架构需求
- **ADR-005**: 多租户采用数据库级隔离，导入数据需遵循租户隔离原则

### NFR 需求
- **NFR14**: 审计日志记录所有关键操作
- **NFR16**: 数据导入需进行完整性和一致性校验

## 验收标准

- [ ] 实现预览确认后的提交端点
- [ ] 添加 import_batch_id 幂等性控制
- [ ] 返回成功和失败详情
- [ ] 写入批量导入审计日志

## 技术方案

### 后端模块结构

```
cloud-server/internal/module/admin/
├── application/
│   ├── service/
│   │   └── import_commit_service.go  # 导入提交服务
│   └── dto/
│       ├── import_commit_request.go   # 提交请求 DTO
│       └── import_receipt.go          # 结果回执 DTO
└── domain/
    └── entity/
        └── import_result.go           # 导入结果实体
```

### 核心功能

1. **幂等性控制**
   - 基于 batch_id 的幂等性检查
   - 防止重复提交
   - 状态机管理

2. **批量写入**
   - 事务处理
   - 批量插入优化
   - 部分失败处理

3. **结果回执**
   - 成功/失败统计
   - 失败详情列表
   - 导出失败数据

4. **审计日志**
   - 记录导入操作
   - 记录数据变更
   - 关联 trace_id

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`