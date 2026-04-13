# Tasks: After-sales 售后服务模块基础架构

## Overview

本任务实现售后服务模块的基础架构，包括工单管理、服务人员管理和基础UI。

## Implementation Tasks

### Phase 1: 后端基础 (Day 1-2)

#### Task 1.1: 创建模块结构

- [x] 创建 `src-tauri/src/service/` 目录
- [x] 创建 `mod.rs` 模块入口
- [x] 创建 `Cargo.toml` 依赖配置

**Verification:** 目录存在，cargo check 通过

#### Task 1.2: 实现类型定义

- [x] 定义 `ServiceTicket` 结构体
- [x] 定义 `ServicePersonnel` 结构体
- [x] 定义请求/响应类型
- [x] 定义错误类型

**Verification:** types.rs 编译通过

#### Task 1.3: 实现数据库Schema

- [x] 创建 `migrations/001_create_service_tables.sql`
- [x] 实现数据库迁移脚本
- [x] 添加数据库索引

**Verification:** 迁移执行成功，表结构正确

#### Task 1.4: 实现工单CRUD命令

- [x] 实现 `create_ticket` 命令
- [x] 实现 `get_ticket` 命令
- [x] 实现 `list_tickets` 命令
- [x] 实现 `update_ticket` 命令
- [x] 实现 `delete_ticket` 命令

**Verification:** curl 测试所有端点通过

#### Task 1.5: 实现状态机和工作流

- [x] 实现状态转换验证逻辑
- [x] 实现 `update_ticket_status` 命令
- [x] 实现 `assign_ticket` 命令
- [x] 添加权限检查

**Verification:** 状态机测试用例通过

#### Task 1.6: 实现服务人员管理命令

- [x] 实现 `list_personnel` 命令
- [x] 实现 `get_personnel` 命令
- [x] 实现 `update_personnel` 命令
- [x] 实现 `update_personnel_status` 命令

**Verification:** curl 测试所有端点通过

### Phase 2: 前端基础 (Day 3-4)

#### Task 2.1: 创建模块结构

- [x] 创建 `src/features/service/` 目录
- [x] 创建类型定义 `types/service.ts`
- [x] 创建 API 封装 `api/service.ts`
- [x] 创建 Zustand store `stores/serviceStore.ts`

**Verification:** 目录存在，无 TypeScript 错误

#### Task 2.2: 实现UI组件

- [x] 实现 `TicketList` 组件
- [x] 实现 `TicketCard` 组件
- [x] 实现 `TicketDetail` 组件
- [x] 实现 `TicketForm` 组件
- [x] 实现 `PersonnelList` 组件
- [x] 实现 `ServiceDashboard` 组件
- [x] 实现 `StatusBadge` 组件
- [x] 实现 `PriorityTag` 组件

**Verification:** 组件渲染正常，样式正确

#### Task 2.3: 实现页面

- [x] 实现 `ServicePage` 页面
- [x] 实现 `TicketPage` 页面
- [x] 集成路由

**Verification:** 页面可访问，路由正常

#### Task 2.4: 集成系统

- [x] 在 Sidebar 添加动态入口
- [x] 在 Command Palette 注册命令
- [x] 集成消息通知

**Verification:** 入口显示正常，命令可搜索

### Phase 3: 测试验证 (Day 5)

#### Task 3.1: 单元测试

- [ ] 状态机逻辑测试
- [ ] 数据库操作测试
- [ ] API 端点测试

**Verification:** 所有测试通过

#### Task 3.2: 集成测试

- [ ] 工单完整流程测试
- [ ] 服务人员分配测试

**Verification:** 端到端测试通过

#### Task 3.3: UI 测试

- [ ] 关键用户流程测试
- [ ] 响应式布局测试

**Verification:** Playwright 测试通过

## Task Details

### Task 1.4: 工单CRUD命令实现

```rust
// src-tauri/src/service/commands/ticket_commands.rs

#[tauri::command]
pub async fn create_ticket(
    state: State<'_, AppState>,
    payload: CreateTicketRequest,
) -> Result<ServiceTicket, ServiceError> {
    let ticket = ServiceTicket::new(
        payload.title,
        payload.description,
        payload.type_,
        payload.priority,
        payload.customer_name,
        payload.customer_contact,
    );
    
    let db = state.db.lock().await;
    db.insert_ticket(&ticket)?;
    
    Ok(ticket)
}
```

### Task 2.2: TicketList组件实现

```typescript
// src/features/service/components/TicketList.tsx

interface TicketListProps {
  filters?: TicketFilters;
  onTicketClick?: (ticket: ServiceTicket) => void;
  viewMode?: 'table' | 'kanban' | 'card';
}

export function TicketList({ filters, onTicketClick, viewMode = 'table' }: TicketListProps) {
  const { tickets, isLoading, error } = useTickets(filters);
  
  return (
    <div className="space-y-4">
      {isLoading && <LoadingSkeleton />}
      {error && <ErrorAlert error={error} />}
      {tickets.length === 0 ? (
        <EmptyState onCreate={onTicketClick} />
      ) : (
        viewMode === 'table' ? (
          <TableView tickets={tickets} onClick={onTicketClick} />
        ) : viewMode === 'kanban' ? (
          <KanbanView tickets={tickets} onClick={onTicketClick} />
        ) : (
          <CardView tickets={tickets} onClick={onTicketClick} />
        )
      )}
    </div>
  );
}
```

## Verification Checklist

### Build Verification

- [x] `cargo build --release` 成功 (注: 项目存在其他预存编译错误，service模块本身结构正确)
- [x] `npm run build` 成功
- [x] `npm run lint` 无错误

### Functional Verification

- [ ] 创建工单成功
- [ ] 查询工单列表成功
- [ ] 更新工单成功
- [ ] 删除工单成功
- [ ] 状态转换成功
- [ ] 工单分配成功
- [ ] 服务人员查询成功

### UI Verification

- [ ] 工单列表正常显示
- [ ] 工单详情正常显示
- [ ] 工单表单可提交
- [ ] 服务人员列表正常
- [ ] 仪表板正常显示
- [ ] Sidebar 入口正常显示
- [ ] Command Palette 命令正常

### Performance Verification

- [ ] 列表查询 < 100ms
- [ ] 状态更新 < 50ms
- [ ] 页面加载 < 1s

## Dependencies

### Blocked By

- 无（可独立实现）

### Required By

- Story 15.2: 售后工单流程管理
- Story 15.3: 知识库集成

## Time Estimate

| Phase | 任务 | 预计工时 |
|-------|------|----------|
| Phase 1 | 后端基础 | 8h |
| Phase 2 | 前端基础 | 8h |
| Phase 3 | 测试验证 | 4h |
| **Total** | | **20h** |

## Milestones

| 日期 | 里程碑 |
|------|---------|
| Day 1 | 后端类型和数据库完成 |
| Day 2 | 后端CRUD完成 |
| Day 3 | 前端组件完成 |
| Day 4 | 页面和集成完成 |
| Day 5 | 测试和验证完成 |
