# Tasks: Marketing 市场宣传模块基础架构

## Implementation Tasks

### Phase 1: 后端 (Day 1-2)

- [ ] 创建 `src-tauri/src/marketing/` 目录
- [ ] 实现活动类型和CRUD命令
- [ ] 实现内容类型和CRUD命令
- [ ] 创建数据库迁移

**Verification:** cargo check 通过，curl 测试通过

### Phase 2: 前端 (Day 3-4)

- [ ] 创建 `src/features/marketing/` 目录
- [ ] 实现活动列表组件
- [ ] 实现内容编辑器
- [ ] 实现营销主页
- [ ] 集成Sidebar入口

**Verification:** npm run build 成功，页面可访问

### Phase 3: 测试 (Day 5)

- [ ] 功能测试
- [ ] UI测试

## Verification

- [ ] cargo build 成功
- [ ] npm run build 成功
- [ ] 活动管理功能正常
- [ ] 内容管理功能正常

## Time Estimate

- Phase 1: 8h
- Phase 2: 8h
- Phase 3: 4h
- **Total: 20h**
