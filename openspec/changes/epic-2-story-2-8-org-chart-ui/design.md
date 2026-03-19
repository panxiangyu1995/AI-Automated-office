# Design: Org Chart View

## 技术方案

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    OrgChart Page                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Toolbar                          │   │
│  │  [布局切换] [缩放控制] [搜索] [刷新]               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────┬───────────────────────┐   │
│  │                             │                       │   │
│  │    OrgChartTree             │   DepartmentDetail   │   │
│  │    (组织架构树)             │   (部门详情面板)     │   │
│  │                             │                       │   │
│  │    ┌─────┐                  │   部门名称: 销售部   │   │
│  │    │ CEO │                  │   负责人: 张三       │   │
│  │    └──┬──┘                  │   成员数: 12人       │   │
│  │       │                     │   ...                │   │
│  │   ┌───┴───┐                 │                       │   │
│  │   │       │                 │   [成员列表]          │   │
│  │ ┌─┴─┐   ┌─┴─┐               │                       │   │
│  │ │销售│   │财务│              └───────────────────────┘   │
│  │ └───┘   └───┘                                          │
│  │                                                         │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 组件设计

#### 1. OrgChart 主组件

```tsx
// src/features/hr/components/OrgChart/index.tsx
interface OrgChartProps {
  layout?: 'tree' | 'matrix';  // 布局模式
  showEmployees?: boolean;      // 是否显示员工
  collapsedDepartments?: string[]; // 默认折叠的部门
}

export function OrgChart({ 
  layout = 'tree', 
  showEmployees = true 
}: OrgChartProps) {
  const { orgTree, isLoading, error } = useOrgChart();
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  
  return (
    <div className="org-chart-container">
      <OrgChartToolbar />
      <div className="org-chart-main">
        <OrgChartTree 
          data={orgTree}
          layout={layout}
          onNodeClick={setSelectedDept}
        />
        {selectedDept && (
          <DepartmentDetail department={selectedDept} />
        )}
      </div>
    </div>
  );
}
```

#### 2. OrgChartNode 节点组件

```tsx
// src/features/hr/components/OrgChart/OrgChartNode.tsx
interface OrgChartNodeProps {
  node: OrgNode;          // 部门或员工节点
  isCollapsed: boolean;   // 是否折叠
  isSelected: boolean;    // 是否选中
  onToggle: () => void;   // 折叠/展开切换
  onClick: () => void;    // 点击事件
}

export function OrgChartNode({ 
  node, 
  isCollapsed, 
  isSelected,
  onToggle,
  onClick 
}: OrgChartNodeProps) {
  const isDepartment = node.type === 'department';
  
  return (
    <div 
      className={cn(
        "org-node",
        isDepartment ? "org-node--department" : "org-node--employee",
        isSelected && "org-node--selected"
      )}
      onClick={onClick}
    >
      {isDepartment ? (
        <DepartmentNode 
          department={node.data}
          isCollapsed={isCollapsed}
          onToggle={onToggle}
        />
      ) : (
        <EmployeeNode employee={node.data} />
      )}
    </div>
  );
}
```

#### 3. DepartmentDetail 详情面板

```tsx
// src/features/hr/components/OrgChart/DepartmentDetail.tsx
interface DepartmentDetailProps {
  department: Department;
}

export function DepartmentDetail({ department }: DepartmentDetailProps) {
  const { members, isLoading } = useDepartmentMembers(department.id);
  
  return (
    <Card className="department-detail">
      <CardHeader>
        <CardTitle>{department.name}</CardTitle>
        <CardDescription>{department.code}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="info-row">
            <Label>负责人</Label>
            <UserAvatar user={department.manager} />
          </div>
          <div className="info-row">
            <Label>成员数</Label>
            <span>{department.memberCount} 人</span>
          </div>
          <div className="info-row">
            <Label>上级部门</Label>
            <Link to={`/hr/org?dept=${department.parentId}`}>
              {department.parentName}
            </Link>
          </div>
          
          <Separator />
          
          <div className="member-list">
            <h4>部门成员</h4>
            <ScrollArea>
              {members.map(member => (
                <EmployeeCard key={member.id} employee={member} />
              ))}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 数据结构

```typescript
// 组织架构树节点
interface OrgNode {
  id: string;
  type: 'department' | 'employee';
  data: Department | Employee;
  children: OrgNode[];
  parentId: string | null;
  level: number;
}

// 部门数据
interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  managerId?: string;
  manager?: Employee;
  parentId?: string;
  parentName?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// 员工数据（简化版）
interface Employee {
  id: string;
  name: string;
  avatar?: string;
  position: string;
  departmentId: string;
  managerId?: string;
  status: 'active' | 'inactive';
}
```

### API 调用

```typescript
// 获取组织架构树
const { data: orgTree } = useQuery({
  queryKey: ['org-chart'],
  queryFn: () => apiClient.get('/api/admin/departments/tree'),
});

// 获取部门成员
const { data: members } = useQuery({
  queryKey: ['department-members', deptId],
  queryFn: () => apiClient.get(`/api/admin/departments/${deptId}/members`),
  enabled: !!deptId,
});

// 搜索员工
const { data: searchResults } = useQuery({
  queryKey: ['employee-search', keyword],
  queryFn: () => apiClient.get('/api/admin/users', { params: { keyword } }),
  enabled: keyword.length > 0,
});
```

### 性能优化策略

#### 1. 虚拟滚动

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function OrgChartTree({ data }: { data: OrgNode[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 节点高度
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="org-tree-scroll">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <OrgChartNode 
            key={virtualRow.key}
            node={data[virtualRow.index]}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 2. 懒加载子节点

```tsx
function LazyOrgNode({ node }: { node: OrgNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: children, isLoading } = useQuery({
    queryKey: ['org-children', node.id],
    queryFn: () => fetchChildren(node.id),
    enabled: isExpanded && !node.children.length,
  });
  
  return (
    <div>
      <OrgChartNode 
        node={node} 
        isCollapsed={!isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />
      {isExpanded && (
        isLoading 
          ? <Skeleton /> 
          : children?.map(child => <LazyOrgNode key={child.id} node={child} />)
      )}
    </div>
  );
}
```

#### 3. 缓存策略

- 使用 React Query 缓存已加载的数据
- 设置 5 分钟缓存过期时间
- 后台自动刷新过期数据

## UI 设计

### 布局模式

#### 树形布局（默认）
```
          CEO
         /   \
      销售    财务
      /  \      |
   销售1 销售2  出纳
```

#### 矩阵布局
```
CEO    | 销售   | 财务
-------|--------|--------
       | 销售1  | 出纳
       | 销售2  |
```

### 节点样式

```css
.org-node {
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid var(--border);
  background: var(--card);
  transition: all 0.2s ease;
}

.org-node--department {
  background: var(--primary-soft);
  border-color: var(--primary);
}

.org-node--employee {
  background: var(--background);
}

.org-node--selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-20);
}

.org-node:hover {
  box-shadow: var(--shadow-sm);
}
```

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐
│   OrgChart    │────→│ Department    │
│   (本模块)    │     │   Service     │
└───────────────┘     └───────────────┘
        │                     │
        │                     │
        ▼                     ▼
┌───────────────┐     ┌───────────────┐
│    User       │     │   Position    │
│   Service     │     │   Service     │
└───────────────┘     └───────────────┘
```