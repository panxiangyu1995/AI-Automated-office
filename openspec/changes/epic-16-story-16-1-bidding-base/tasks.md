# Tasks: Bidding 招投标模块基础架构

## Overview

本任务实现招投标模块的基础架构，包括资质库管理和业绩库管理。

## Implementation Tasks

### Phase 1: 后端基础 (Day 1-2)

#### Task 1.1: 创建模块结构

- [ ] 创建 `src-tauri/src/tender/` 目录
- [ ] 创建 `mod.rs` 模块入口
- [ ] 更新 `Cargo.toml` 依赖

**Verification:** 目录存在，cargo check 通过

#### Task 1.2: 实现类型定义

- [ ] 定义 `Qualification` 结构体
- [ ] 定义 `Case` 结构体
- [ ] 定义请求/响应类型

**Verification:** types.rs 编译通过

#### Task 1.3: 实现数据库Schema

- [ ] 创建资质表迁移
- [ ] 创建业绩表迁移
- [ ] 创建行业分类表迁移

**Verification:** 迁移执行成功

#### Task 1.4: 实现资质CRUD命令

- [ ] 实现 `create_qualification` 命令
- [ ] 实现 `list_qualifications` 命令
- [ ] 实现 `get_qualification` 命令
- [ ] 实现 `update_qualification` 命令
- [ ] 实现 `delete_qualification` 命令
- [ ] 实现 `get_expiring_qualifications` 命令

**Verification:** curl 测试通过

#### Task 1.5: 实现业绩CRUD命令

- [ ] 实现 `create_case` 命令
- [ ] 实现 `list_cases` 命令
- [ ] 实现 `get_case` 命令
- [ ] 实现 `update_case` 命令
- [ ] 实现 `delete_case` 命令
- [ ] 实现 `search_cases` 命令

**Verification:** curl 测试通过

#### Task 1.6: 实现到期提醒逻辑

- [ ] 实现资质状态计算
- [ ] 实现定时提醒任务

**Verification:** 提醒正常触发

### Phase 2: 前端基础 (Day 3-4)

#### Task 2.1: 创建模块结构

- [ ] 创建 `src/features/tender/` 目录
- [ ] 创建类型定义
- [ ] 创建 API 封装
- [ ] 创建 Zustand store

**Verification:** 无 TypeScript 错误

#### Task 2.2: 实现资质组件

- [ ] 实现 `QualificationList` 组件
- [ ] 实现 `QualificationCard` 组件
- [ ] 实现 `QualificationForm` 组件
- [ ] 实现 `ExpiryAlert` 组件

**Verification:** 组件渲染正常

#### Task 2.3: 实现业绩组件

- [ ] 实现 `CaseList` 组件
- [ ] 实现 `CaseCard` 组件
- [ ] 实现 `CaseForm` 组件

**Verification:** 组件渲染正常

#### Task 2.4: 实现页面

- [ ] 实现 `TenderPage` 主页
- [ ] 实现 `QualificationPage` 资质页
- [ ] 实现 `CasePage` 业绩页

**Verification:** 页面可访问

#### Task 2.5: 集成系统

- [ ] 在 Sidebar 添加动态入口
- [ ] 注册 Command Palette 命令

**Verification:** 入口正常显示

### Phase 3: 测试验证 (Day 5)

#### Task 3.1: 单元测试

- [ ] 资质状态计算测试
- [ ] 业绩搜索测试

**Verification:** 测试通过

#### Task 3.2: 集成测试

- [ ] 资质完整流程测试
- [ ] 业绩完整流程测试

**Verification:** 端到端测试通过

## Verification Checklist

### Build Verification

- [ ] `cargo build --release` 成功
- [ ] `npm run build` 成功
- [ ] `npm run lint` 无错误

### Functional Verification

- [ ] 资质创建成功
- [ ] 资质列表正常
- [ ] 资质更新成功
- [ ] 资质到期提醒正常
- [ ] 业绩创建成功
- [ ] 业绩搜索正常
- [ ] Sidebar 入口正常

## Dependencies

### Blocked By

- 无

### Required By

- Story 16.2: 投标项目管理
- Story 16.3: 标书生成AI辅助

## Time Estimate

| Phase | 任务 | 预计工时 |
|-------|------|----------|
| Phase 1 | 后端基础 | 8h |
| Phase 2 | 前端基础 | 8h |
| Phase 3 | 测试验证 | 4h |
| **Total** | | **20h** |
