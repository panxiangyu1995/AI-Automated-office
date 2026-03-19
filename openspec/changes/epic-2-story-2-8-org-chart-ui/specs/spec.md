# Specification: Org Chart View

## 需求来源

### PRD 需求

**FR106 - 员工可以查看组织架构图**

用户可以通过组织架构图直观了解企业的部门层级结构和员工汇报关系，支持折叠展开和搜索定位。

### 架构约束

**ADR-001 - 分层微内核架构**
- UI逻辑位于 Presentation Layer
- 前端 React 负责可视化展示
- 数据来源于云端 Go 后端

### UX 规范

**UX-02**: 使用 Shadcn/ui 组件库
**UX-03**: VSCode 风格四栏布局
**UX-04**: 交互透明可控

## 功能规格

### 用户故事

As a **员工或管理层**,
I want **查看组织架构图**,
So that **我能直观了解企业的部门层级和员工汇报关系**。

### 验收场景

#### Scenario 1: 查看组织架构树
- **GIVEN** 用户已登录系统
- **WHEN** 用户进入组织架构页面
- **THEN** 显示完整的组织架构树
  - 根节点为企业/CEO
  - 显示所有部门和部门负责人
  - 部门按层级关系排列
  - 支持折叠/展开子节点

#### Scenario 2: 查看部门详情
- **GIVEN** 组织架构树已显示
- **WHEN** 用户点击某个部门节点
- **THEN** 在右侧面板显示部门详情
  - 部门名称和编码
  - 部门负责人信息
  - 部门成员数量
  - 上级部门链接
  - 部门成员列表

#### Scenario 3: 查看员工汇报关系
- **GIVEN** 组织架构树已显示
- **WHEN** 用户点击某个员工节点
- **THEN** 显示员工卡片和汇报关系
  - 员工基本信息
  - 直属上级
  - 直接下属列表
  - 虚线汇报关系（如有）

#### Scenario 4: 搜索定位员工
- **GIVEN** 组织架构页面已打开
- **WHEN** 用户在搜索框输入员工姓名
- **THEN** 
  - 实时显示匹配结果
  - 点击结果可定位到对应节点
  - 高亮显示匹配节点

#### Scenario 5: 折叠展开部门
- **GIVEN** 组织架构树已显示
- **WHEN** 用户点击部门的折叠/展开按钮
- **THEN** 
  - 部门节点折叠或展开
  - 状态持久化到本地存储
  - 页面刷新后保持状态

#### Scenario 6: 大型组织性能
- **GIVEN** 组织架构超过 500 个节点
- **WHEN** 用户浏览组织架构
- **THEN** 
  - 初始加载时间 < 2秒
  - 滚动流畅（FPS > 30）
  - 内存占用 < 200MB

#### Scenario 7: 布局切换
- **GIVEN** 组织架构树已显示
- **WHEN** 用户切换布局模式
- **THEN** 
  - 树形布局：纵向展示层级关系
  - 矩阵布局：横向展示部门分布

## 数据规格

### 输入

| 输入 | 类型 | 描述 | 必填 |
|------|------|------|------|
| layout | string | 布局模式（tree/matrix） | 否 |
| keyword | string | 搜索关键词 | 否 |
| deptId | string | 选中的部门ID | 否 |

### 输出

| 输出 | 类型 | 描述 |
|------|------|------|
| 组织架构树 | OrgNode[] | 完整的组织架构树结构 |
| 部门详情 | Department | 选中部门的详细信息 |
| 员工列表 | Employee[] | 部门成员列表 |

### 数据结构

```typescript
// 组织架构节点
interface OrgNode {
  id: string;
  type: 'department' | 'employee';
  data: Department | Employee;
  children: OrgNode[];
  parentId: string | null;
  level: number;
  isCollapsed?: boolean;
}

// 部门信息
interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  managerId?: string;
  manager?: Employee;
  parentId?: string;
  memberCount: number;
  children?: Department[];
}

// 员工信息（简化）
interface Employee {
  id: string;
  name: string;
  avatar?: string;
  positionId: string;
  positionName: string;
  departmentId: string;
  departmentName: string;
  managerId?: string;
  managerName?: string;
  status: 'active' | 'inactive';
}
```

## 边界条件

1. **权限边界**: 所有登录用户可查看组织架构
2. **数据边界**: 仅显示本租户的组织架构数据
3. **性能边界**: 超过 1000 节点启用虚拟滚动

## 错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| 数据加载失败 | 显示错误提示，提供重试按钮 |
| 网络断开 | 显示离线提示，使用缓存数据 |
| 搜索无结果 | 显示空状态，提示调整搜索条件 |

## 质量属性

### 性能要求
- 初始加载时间 < 2秒（500节点）
- 节点展开/折叠响应 < 100ms
- 滚动帧率 > 30 FPS

### 可访问性要求
- 支持键盘导航（方向键、Enter）
- 屏幕阅读器兼容
- 颜色对比度符合 WCAG AA 标准

### 响应式要求
- 支持 1280px 以上桌面分辨率
- 支持缩放 50% - 200%

## 依赖关系

### 上游依赖
- E2-S2.3-02: Department and position UI（部门数据接口）
- E2-S2.4-01: Direct manager relation（汇报关系数据）

### API 依赖
- `GET /api/admin/departments/tree` - 获取部门树
- `GET /api/admin/departments/:id/members` - 获取部门成员
- `GET /api/admin/users` - 搜索员工

## 验收标准

| 标准 | 验证方式 |
|------|---------|
| 组织架构树正确显示 | 手动测试 |
| 部门详情面板正确显示 | 手动测试 |
| 搜索功能正常 | 自动化测试 |
| 折叠展开功能正常 | 自动化测试 |
| 性能指标达标 | 性能测试 |
| 无控制台错误 | 手动检查 |