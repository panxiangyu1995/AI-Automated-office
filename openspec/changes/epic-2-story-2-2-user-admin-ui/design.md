# Design: User Admin UI

## Context (上下文)

- **Change**: `epic-2-story-2-2-user-admin-ui`
- **Story**: Story 2.2 - 用户管理工作台
- **Capability**: `admin-ui`
- **相关约束**: FR(FR28)、NFR(NFR16)、UX(UX-02, UX-04)

本变更构建用户管理的前端界面，遵循 React + TypeScript + Shadcn/ui 技术栈。

## Goals / Non-Goals (目标与非目标)

### Goals (目标)
- 构建用户列表页面，支持分页和筛选
- 实现创建和编辑用户表单
- 符合 UX 设计规范（颜色系统、组件库、图标库）
- 提供良好的用户体验和状态反馈

### Non-Goals (非目标)
- 不实现后端 API（由 E2-S2.2-01 负责）
- 不实现权限校验（由 E2-S2.7-02 负责）
- 不实现批量导入功能（由 E2-S2.9-03 负责）

## Architecture Decisions (架构决策)

### 1. 组件结构
**决策**: 采用页面 + 组件的分层结构
**理由**:
- 页面负责路由和布局
- 组件负责 UI 展示和交互
- 易于复用和测试

### 2. 状态管理
**决策**: 使用 Zustand 管理用户列表状态
**理由**:
- 与项目现有状态管理方案一致
- 支持缓存和乐观更新
- 易于跨组件共享状态

### 3. 表单处理
**决策**: 使用 react-hook-form + zod 进行表单处理
**理由**:
- 类型安全的表单校验
- 与 Shadcn/ui 良好集成
- 减少样板代码

## Component Design (组件设计)

### 文件结构
```
src/features/admin/
├── components/
│   ├── UserTable.tsx          # 用户数据表格
│   ├── UserFilters.tsx        # 筛选器组件
│   ├── UserForm.tsx           # 用户表单
│   ├── UserStatusBadge.tsx    # 状态徽章
│   └── UserAvatar.tsx         # 用户头像
├── pages/
│   ├── UserListPage.tsx       # 用户列表页
│   ├── UserCreatePage.tsx     # 创建用户页
│   └── UserEditPage.tsx       # 编辑用户页
├── hooks/
│   ├── useUsers.ts            # 用户数据 Hook
│   └── useUserMutations.ts    # 用户变更 Hook
├── types/
│   └── user.types.ts          # 类型定义
└── api/
    └── userApi.ts             # API 调用封装
```

### UserListPage 设计

```tsx
// UserListPage 布局结构
<div className="p-6">
  <header className="mb-6">
    <h1>用户管理</h1>
    <Button>创建用户</Button>
  </header>
  
  <UserFilters 
    onFilter={handleFilter} 
    departments={departments} 
  />
  
  <UserTable 
    users={users}
    loading={isLoading}
    onEdit={handleEdit}
    onStatusChange={handleStatusChange}
  />
  
  <Pagination 
    current={page}
    total={total}
    pageSize={pageSize}
    onChange={handlePageChange}
  />
</div>
```

### UserTable 设计

| 列名 | 字段 | 说明 |
|------|------|------|
| 头像 | avatar | 用户头像缩略图 |
| 姓名 | real_name | 用户真实姓名 |
| 工号 | employee_code | 员工工号 |
| 部门 | departments | 所属部门（可能多个） |
| 角色 | roles | 分配的角色 |
| 状态 | status | 启用/停用/锁定 |
| 创建时间 | created_at | 账号创建时间 |
| 操作 | - | 编辑、状态变更按钮 |

### UserFilters 设计

筛选条件：
- **姓名**: 文本输入，模糊搜索
- **工号**: 文本输入，精确匹配
- **部门**: 下拉选择，支持搜索
- **状态**: 下拉选择（全部/启用/停用/锁定）

### UserForm 设计

```tsx
// 表单字段
interface UserFormData {
  username: string;       // 用户名（必填）
  real_name: string;      // 真实姓名（必填）
  employee_code: string;  // 工号（必填）
  email?: string;         // 邮箱
  phone?: string;         // 手机号
  department_ids: string[]; // 所属部门
  role_ids: string[];     // 分配角色
  send_notification: boolean; // 发送通知
}
```

## UI Specifications (UI 规格)

### 颜色使用

| 元素 | 颜色 | 说明 |
|------|------|------|
| 主按钮背景 | #1E3A5F | 品牌色 |
| 主按钮文字 | #FFFFFF | 白色 |
| 状态-启用 | #16A34A | 成功绿 |
| 状态-停用 | #6B7280 | 灰色 |
| 状态-锁定 | #DC2626 | 警告红 |
| 表头背景 | #F3F4F6 | 浅灰 |
| 边框 | #E5E7EB | 边框灰 |

### 图标使用

| 场景 | 图标 (Lucide) |
|------|---------------|
| 创建用户 | UserPlus |
| 编辑用户 | Pencil |
| 筛选 | Filter |
| 搜索 | Search |
| 启用 | CheckCircle |
| 停用 | XCircle |
| 锁定 | Lock |
| 更多操作 | MoreHorizontal |

### 响应式设计

| 断点 | 布局 |
|------|------|
| >= 1280px | 完整表格，所有列显示 |
| 768-1279px | 隐藏部分列，操作按钮收缩 |
| < 768px | 卡片视图 |

## Error Handling (错误处理)

### API 错误处理
```tsx
// 使用 toast 展示错误信息
const { toast } = useToast();

const handleError = (error: ApiError) => {
  toast({
    title: "操作失败",
    description: error.message,
    variant: "destructive",
  });
};
```

### 表单校验错误
- 字段下方显示错误提示
- 提交时滚动到第一个错误字段
- 使用 zod 定义校验规则

## Risks / Trade-offs (风险与权衡)

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 大量数据渲染卡顿 | 中 | 实现分页，限制每页数量 |
| 部门树选择器复杂 | 低 | 使用现有 TreeSelect 组件 |
| 表单校验规则变更 | 低 | zod schema 集中管理 |

## Testing Strategy (测试策略)

### 单元测试
- 组件渲染测试
- 表单校验测试
- Hook 逻辑测试

### 集成测试
- 用户列表加载流程
- 创建用户完整流程
- 编辑用户完整流程

### E2E 测试
- 用户管理 CRUD 流程
- 筛选和分页功能

## Open Questions (待解决问题)

1. 是否需要支持批量操作？
2. 用户头像上传组件是否复用现有组件？
3. 是否需要导出用户列表功能？