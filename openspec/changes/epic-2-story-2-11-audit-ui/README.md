# Epic 2, Story 2.11: Audit Query and Export UI

## 概述

构建审计日志查询页面，支持按事件类型、时间范围、操作人筛选，并提供审计日志导出功能。

## 铁律映射

### PRD 需求
- **FR33**: 管理员可以导入和导出用户数据（审计导出）

### 架构需求
- **ADR-001**: 前端 React 负责审计 UI
- **ADR-005**: 后端 Go 提供审计 API

### UX 需求
- **UX-01**: Shadcn/ui 组件
- **UX-02**: 表格筛选和排序

## 验收标准

- [ ] 实现审计日志列表 API
- [ ] 构建前端审计日志表格
- [ ] 支持按类型、时间范围、操作人筛选
- [ ] 支持审计日志导出

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`