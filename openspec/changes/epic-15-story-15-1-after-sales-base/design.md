# Design: After-sales 售后服务模块基础架构

## Context

当前系统已完成6个核心部门模块（HR、审批、销售、财务、仓储、管理），扩展部门模块尚未实现。售后服务是企业客户生命周期的重要环节，需要：
- 规范化售后工单处理流程
- 积累维修经验形成知识资产
- 提供透明的进度追踪
- 支撑客服团队高效协作

### 技术背景

- **前端架构：** React + TypeScript + Shadcn/ui + Tailwind CSS
- **后端架构：** Rust + Tauri + SQLite
- **模块规范：** 遵循现有部门模块架构模式

### 约束条件

1. 遵循现有模块目录结构（features/ + src-tauri/src/）
2. 使用Shadcn/ui组件库和Tailwind CSS
3. 遵循部门模块开发规范
4. 数据库使用SQLite，与现有数据模型保持一致

## Goals / Non-Goals

### Goals（本次实现）

- [x] 实现售后工单基础CRUD功能
- [x] 实现服务人员管理
- [x] 创建可扩展的工单状态机
- [x] 集成到Sidebar动态入口
- [x] 支持工单筛选和搜索

### Non-Goals（后续Story实现）

- [ ] AI辅助功能（Story 15.3）
- [ ] 完整的工单流程管理（Story 15.2）
- [ ] 回访管理（Story 15.2）
- [ ] 工单评论/讨论功能
- [ ] 工单SLA超时处理

## Decisions

### 1. 工单状态机设计

采用状态机模式管理工单生命周期，定义清晰的状态转换规则：

```
┌─────────┐    分配     ┌─────────────┐
│  新建    │ ──────────→ │   处理中    │
└─────────┘             └─────────────┘
     │                        │
     │ 取消                   │ 确认完成
     ↓                        ↓
┌─────────┐             ┌─────────────┐
│  已取消  │             │  待客户确认  │
└─────────┘             └─────────────┘
                               │
                               │ 客户确认
                               ↓
                          ┌───────────┐
                          │  已完成   │
                          └───────────┘
```

#### 状态定义

| 状态 | 代码 | 说明 | 可转换到 |
|------|------|------|----------|
| 新建 | `new` | 工单创建，等待分配 | `processing`, `cancelled` |
| 处理中 | `processing` | 已分配处理中 | `pending_confirm`, `cancelled` |
| 待确认 | `pending_confirm` | 处理完成等待客户确认 | `processing`, `completed` |
| 已完成 | `completed` | 流程结束 | - |
| 已取消 | `cancelled` | 工单取消 | - |

#### 权限控制

| 操作 | 新建 | 处理中 | 待确认 | 已完成 | 已取消 |
|------|------|--------|--------|--------|--------|
| 分配 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 处理 | ❌ | ✅ | ❌ | ❌ | ❌ |
| 确认 | ❌ | ❌ | ✅ | ❌ | ❌ |
| 取消 | ✅ | ✅ | ✅ | ❌ | ❌ |

### 2. 数据库Schema设计

```sql
-- 工单表
CREATE TABLE service_tickets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('repair', 'consultation', 'complaint')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'pending_confirm', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- 客户信息
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_contact TEXT,
    customer_email TEXT,
    
    -- 分配信息
    assigned_to TEXT,
    assigned_name TEXT,
    
    -- 关联
    knowledge_id TEXT,
    
    -- 时间戳
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    completed_at INTEGER,
    
    -- 租户隔离
    tenant_id TEXT NOT NULL,
    
    -- 元数据
    metadata TEXT DEFAULT '{}'
);

-- 服务人员表
CREATE TABLE service_personnel (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    department TEXT,
    specializations TEXT DEFAULT '[]', -- JSON array
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
    current_ticket_count INTEGER DEFAULT 0,
    max_ticket_count INTEGER DEFAULT 10,
    
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    tenant_id TEXT NOT NULL,
    
    UNIQUE(user_id, tenant_id)
);

-- 索引
CREATE INDEX idx_tickets_status ON service_tickets(status);
CREATE INDEX idx_tickets_assigned ON service_tickets(assigned_to);
CREATE INDEX idx_tickets_created ON service_tickets(created_at DESC);
CREATE INDEX idx_personnel_user ON service_personnel(user_id);
```

### 3. 前端目录结构

```
src/features/service/
├── components/
│   ├── TicketList.tsx              # 工单列表（支持筛选、搜索、分页）
│   ├── TicketCard.tsx              # 工单卡片（Kanban视图用）
│   ├── TicketDetail.tsx            # 工单详情面板
│   ├── TicketForm.tsx              # 工单创建/编辑表单
│   ├── TicketTimeline.tsx          # 工单时间线
│   ├── PersonnelList.tsx            # 服务人员列表
│   ├── PersonnelCard.tsx            # 服务人员卡片
│   ├── ServiceDashboard.tsx         # 售后仪表板
│   ├── StatusBadge.tsx              # 状态徽章
│   └── PriorityTag.tsx              # 优先级标签
├── pages/
│   ├── ServicePage.tsx             # 售后模块主页
│   └── TicketPage.tsx              # 工单详情页
├── api/
│   └── service.ts                  # API调用封装
├── types/
│   └── service.ts                  # TypeScript类型定义
├── stores/
│   └── serviceStore.ts             # Zustand状态管理
├── hooks/
│   ├── useTickets.ts               # 工单相关hook
│   └── usePersonnel.ts             # 服务人员hook
└── index.ts                        # 模块导出
```

### 4. 后端模块结构

```
src-tauri/src/service/
├── mod.rs                          # 模块入口
├── types.rs                        # 类型定义
├── commands.rs                      # Tauri命令
│   ├── ticket_commands.rs           # 工单相关命令
│   └── personnel_commands.rs        # 人员相关命令
├── db.rs                           # 数据库操作
│   ├── ticket_db.rs                # 工单数据库操作
│   └── personnel_db.rs             # 人员数据库操作
├── workflow.rs                     # 状态机和工作流
└── error.rs                        # 错误定义
```

### 5. API设计

#### 工单API

| Method | Endpoint | Request | Response | 说明 |
|--------|----------|---------|----------|------|
| POST | `/api/service/tickets` | `CreateTicketRequest` | `ServiceTicket` | 创建工单 |
| GET | `/api/service/tickets` | `QueryTicketsRequest` | `TicketListResponse` | 查询工单列表 |
| GET | `/api/service/tickets/:id` | - | `ServiceTicket` | 获取工单详情 |
| PUT | `/api/service/tickets/:id` | `UpdateTicketRequest` | `ServiceTicket` | 更新工单 |
| DELETE | `/api/service/tickets/:id` | - | `void` | 删除工单 |
| PUT | `/api/service/tickets/:id/status` | `UpdateStatusRequest` | `ServiceTicket` | 更新状态 |
| PUT | `/api/service/tickets/:id/assign` | `AssignRequest` | `ServiceTicket` | 分配工单 |

#### 服务人员API

| Method | Endpoint | Request | Response | 说明 |
|--------|----------|---------|----------|------|
| GET | `/api/service/personnel` | `QueryPersonnelRequest` | `PersonnelListResponse` | 查询人员列表 |
| GET | `/api/service/personnel/:id` | - | `ServicePersonnel` | 获取人员详情 |
| PUT | `/api/service/personnel/:id` | `UpdatePersonnelRequest` | `ServicePersonnel` | 更新人员信息 |
| PUT | `/api/service/personnel/:id/status` | `UpdateStatusRequest` | `ServicePersonnel` | 更新状态 |

#### 请求/响应类型

```typescript
// 创建工单
interface CreateTicketRequest {
  title: string;
  description?: string;
  type: 'repair' | 'consultation' | 'complaint';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_name: string;
  customer_contact?: string;
  customer_email?: string;
}

// 查询工单
interface QueryTicketsRequest {
  status?: string[];
  type?: string[];
  priority?: string[];
  assigned_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: 'created_at' | 'updated_at' | 'priority';
  sort_order?: 'asc' | 'desc';
}

// 工单列表响应
interface TicketListResponse {
  items: ServiceTicket[];
  total: number;
  page: number;
  page_size: number;
}
```

### 6. 错误码设计

| 错误码 | 说明 | HTTP Status |
|--------|------|-------------|
| `SERVICE_001` | 工单不存在 | 404 |
| `SERVICE_002` | 状态转换无效 | 400 |
| `SERVICE_003` | 权限不足 | 403 |
| `SERVICE_004` | 服务人员不存在 | 404 |
| `SERVICE_005` | 服务人员忙碌 | 400 |
| `SERVICE_006` | 参数校验失败 | 400 |
| `SERVICE_007` | 数据库错误 | 500 |

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| 工单类型扩展性不足 | 中 | 使用枚举+metadata扩展字段，支持未来新增工单类型 |
| 与知识库集成复杂度 | 中 | 预留knowledge_id字段，Story 15.3实现时再深度集成 |
| 多人同时修改工单冲突 | 低 | 使用乐观锁（version字段）处理冲突 |
| 大数据量查询性能 | 中 | 实现分页和索引优化 |

## Migration Plan

### Phase 1: 数据库迁移

```bash
# 执行迁移
sqlite3 app.db < migrations/001_create_service_tables.sql
```

### Phase 2: 后端实现

1. 创建 `src-tauri/src/service/` 目录
2. 实现类型定义 `types.rs`
3. 实现数据库操作 `db.rs`
4. 实现状态机 `workflow.rs`
5. 实现Tauri命令 `commands.rs`
6. 注册模块到 `lib.rs`

### Phase 3: 前端实现

1. 创建 `src/features/service/` 目录
2. 实现类型定义 `types/service.ts`
3. 实现API封装 `api/service.ts`
4. 实现状态管理 `stores/serviceStore.ts`
5. 实现UI组件
6. 集成到Sidebar

### Phase 4: 测试验证

1. 单元测试：状态机逻辑
2. 集成测试：API端到端
3. UI测试：关键用户流程

### Rollback

删除service模块目录，执行回滚SQL：

```sql
DROP TABLE IF EXISTS service_tickets;
DROP TABLE IF EXISTS service_personnel;
```

## Open Questions

1. **客服与客户区分**：是否需要独立的客户模块？
2. **SLA定义**：工单处理时限如何定义？超时如何处理？
3. **评论功能**：是否需要工单评论/讨论功能？
4. **附件支持**：工单是否需要支持附件上传？
