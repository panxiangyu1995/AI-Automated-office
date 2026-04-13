# Tasks: Bidding 投标项目管理

## Implementation Tasks

### Phase 1: 后端 (Day 1-2)

#### Task 1.1: 数据库迁移

- [ ] 创建 `tender_projects` 表

**Verification:** 迁移成功

#### Task 1.2: 实现项目管理命令

- [ ] 实现 `create_project` 命令
- [ ] 实现 `list_projects` 命令
- [ ] 实现 `get_project` 命令
- [ ] 实现 `update_project` 命令
- [ ] 实现 `update_project_status` 命令
- [ ] 实现 `get_project_stats` 命令

**Verification:** curl 测试通过

### Phase 2: 前端 (Day 3-4)

#### Task 2.1: 实现UI组件

- [ ] 实现 `ProjectList` 组件
- [ ] 实现 `ProjectKanban` 看板视图
- [ ] 实现 `ProjectDetail` 详情面板
- [ ] 实现 `ProjectTimeline` 时间线

**Verification:** 组件正常渲染

#### Task 2.2: 实现页面

- [ ] 实现项目管理页面
- [ ] 集成到主模块

**Verification:** 页面可访问

### Phase 3: 测试 (Day 5)

- [ ] 功能测试
- [ ] 集成测试

## Verification

- [ ] cargo build 成功
- [ ] npm run build 成功
- [ ] 项目管理功能正常

## Dependencies

- Story 16.1: 招投标基础架构
