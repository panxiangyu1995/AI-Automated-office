# 第2章：UI层规范 (UI Specification)

> UI层负责插件的界面展示，包括路由、组件、侧边栏、样式等。

---

## 2.1 目录结构

```
ui/
├── index.tsx               # UI入口，导出路由和组件
├── routes/                 # 路由组件
│   ├── Dashboard.tsx       # 仪表盘/概览页
│   ├── Contracts.tsx       # 合同管理页
│   ├── Orders.tsx          # 订单管理页
│   └── Customers.tsx       # 客户管理页
├── components/             # 共享组件
│   ├── ContractCard.tsx    # 合同卡片组件
│   ├── OrderTable.tsx      # 订单表格组件
│   └── CustomerForm.tsx    # 客户表单组件
├── sidebar/                # 侧边栏配置
│   └── index.ts
├── hooks/                  # 插件专属Hooks
│   ├── useContracts.ts
│   └── useOrders.ts
└── styles/                 # 样式文件
    └── sales.css
```

---

## 2.2 路由规范

### 2.2.1 路由定义

在 `plugin.json` 中声明：

```json
{
  "ui": {
    "routes": [
      {
        "path": "/sales",
        "component": "Dashboard",
        "title": "销售概览",
        "auth": ["sales:view"],
        "layout": "sidebar"
      },
      {
        "path": "/sales/contracts",
        "component": "Contracts",
        "title": "合同管理",
        "auth": ["sales:contract:read"]
      },
      {
        "path": "/sales/contracts/:id",
        "component": "ContractDetail",
        "title": "合同详情",
        "auth": ["sales:contract:read"]
      }
    ]
  }
}
```

### 2.2.2 路由字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `path` | string | ✅ | 路由路径，以插件ID为前缀 |
| `component` | string | ✅ | 组件名称，对应 `routes/` 下的文件 |
| `title` | string | ✅ | 页面标题，显示在浏览器标签页 |
| `auth` | string[] | 否 | 所需权限，无权限时显示403 |
| `layout` | enum | 否 | 布局类型：`sidebar`(默认) / `full` / `minimal` |
| `exact` | boolean | 否 | 是否精确匹配，默认false |

### 2.2.3 路由组件规范

```tsx
// routes/Contracts.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Button, Input } from '@/components/ui';
import { Search, Plus } from 'lucide-react';
import { useContracts } from '../hooks/useContracts';

export default function Contracts() {
  const { t } = useTranslation('sales');
  const { contracts, loading, error } = useContracts();
  const [searchTerm, setSearchTerm] = useState('');

  // 组件实现...

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('contracts.title')}</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {t('contracts.new')}
        </Button>
      </div>
      
      {/* 内容... */}
    </div>
  );
}
```

### 2.2.4 路由守卫

```tsx
// 路由守卫自动处理权限检查
<Route
  path="/sales/contracts"
  element={
    <ProtectedRoute auth={['sales:contract:read']}>
      <Contracts />
    </ProtectedRoute>
  }
/>
```

---

## 2.3 组件规范

### 2.3.1 组件命名

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| 页面组件 | PascalCase | `Contracts.tsx` |
| 共享组件 | PascalCase | `ContractCard.tsx` |
| Hook | camelCase + use前缀 | `useContracts.ts` |
| 样式文件 | kebab-case | `contract-card.css` |

### 2.3.2 组件模板

```tsx
// components/ContractCard.tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User } from 'lucide-react';
import type { Contract } from '../types';

interface ContractCardProps {
  contract: Contract;
  onClick?: () => void;
  className?: string;
}

export function ContractCard({ contract, onClick, className }: ContractCardProps) {
  return (
    <Card className={className} onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <h3 className="font-semibold">{contract.title}</h3>
          <StatusBadge status={contract.status} />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{contract.customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(contract.signedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>¥{formatNumber(contract.amount)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button variant="ghost" size="sm">查看详情</Button>
      </CardFooter>
    </Card>
  );
}
```

### 2.3.3 组件库使用

所有UI组件必须使用 **Shadcn/ui**，基于 Radix UI：

```tsx
// ✅ 正确：使用Shadcn/ui组件
import { Button, Card, Dialog, DropdownMenu } from '@/components/ui';

// ❌ 错误：直接使用Radix UI
import * as Dialog from '@radix-ui/react-dialog';

// ❌ 错误：使用其他UI库
import { Button } from 'antd';
```

---

## 2.4 侧边栏规范

### 2.4.1 侧边栏配置

在 `plugin.json` 中声明：

```json
{
  "ui": {
    "sidebar": {
      "title": "销售管理",
      "icon": "briefcase",
      "order": 2,
      "items": [
        {
          "title": "销售概览",
          "path": "/sales",
          "icon": "layout-dashboard"
        },
        {
          "title": "合同管理",
          "path": "/sales/contracts",
          "icon": "file-text",
          "badge": "3"  // 可选：显示数字徽章
        },
        {
          "title": "订单管理",
          "path": "/sales/orders",
          "icon": "shopping-cart",
          "children": [
            { "title": "全部订单", "path": "/sales/orders" },
            { "title": "待发货", "path": "/sales/orders?status=pending" },
            { "title": "已完成", "path": "/sales/orders?status=completed" }
          ]
        }
      ]
    }
  }
}
```

### 2.4.2 侧边栏字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `title` | string | ✅ | 显示名称 |
| `path` | string | ✅ | 路由路径 |
| `icon` | string | ✅ | 图标名称（Lucide图标） |
| `badge` | string | 否 | 徽章内容 |
| `children` | array | 否 | 子菜单 |
| `auth` | string[] | 否 | 显示所需权限 |

### 2.4.3 图标规范

使用 **Lucide React** 图标库：

```tsx
// ✅ 正确：使用Lucide图标
import { Briefcase, FileText, ShoppingCart, Users } from 'lucide-react';

// ❌ 错误：使用emoji
<Briefcase /> ❌  <span>💼</span>

// ❌ 错误：使用其他图标库
import { Icon } from '@iconify/react';
```

### 2.4.4 图标映射表

| 常用图标 | Lucide名称 |
|---------|-----------|
| 首页 | `home` |
| 仪表盘 | `layout-dashboard` |
| 文档 | `file-text` |
| 用户 | `users` |
| 设置 | `settings` |
| 购物车 | `shopping-cart` |
| 日历 | `calendar` |
| 图表 | `bar-chart-2` |
| 消息 | `message-square` |
| 通知 | `bell` |

---

## 2.5 样式规范

### 2.5.1 主题令牌

```css
/* 使用CSS变量，遵循UX设计规范 */
:root {
  /* 品牌色 */
  --brand-primary: #1E3A5F;
  --brand-secondary: #3B82F6;
  
  /* 状态色 */
  --status-success: #10B981;
  --status-warning: #F59E0B;
  --status-error: #EF4444;
  --status-info: #3B82F6;
  
  /* 中性色 */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-900: #111827;
  
  /* 间距 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* 圆角 */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
}
```

### 2.5.2 Tailwind CSS 使用

```tsx
// ✅ 正确：使用Tailwind类名
<div className="flex items-center justify-between p-4 bg-card rounded-lg shadow-sm">
  <span className="text-lg font-semibold text-foreground">标题</span>
  <Button variant="primary" size="sm">操作</Button>
</div>

// ❌ 错误：内联样式
<div style={{ display: 'flex', padding: '16px' }}>

// ❌ 错误：自定义CSS类（除非必要）
<div className="my-custom-class">
```

### 2.5.3 响应式设计

```tsx
// 使用Tailwind响应式断点
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {cards.map(card => (
    <ContractCard key={card.id} contract={card} />
  ))}
</div>
```

### 2.5.4 深色模式支持

```tsx
// 自动适配深色模式
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  内容
</div>
```

---

## 2.6 国际化规范

### 2.6.1 翻译文件结构

```
ui/
└── locales/
    ├── zh-CN.json    # 简体中文
    ├── zh-TW.json    # 繁体中文
    └── en-US.json    # 英文
```

### 2.6.2 翻译文件格式

```json
// locales/zh-CN.json
{
  "contracts": {
    "title": "合同管理",
    "new": "新建合同",
    "edit": "编辑合同",
    "delete": "删除合同",
    "status": {
      "draft": "草稿",
      "signed": "已签订",
      "executing": "执行中",
      "completed": "已完成"
    }
  }
}
```

### 2.6.3 使用方式

```tsx
import { useTranslation } from 'react-i18next';

export function Contracts() {
  const { t } = useTranslation('sales');
  
  return (
    <div>
      <h1>{t('contracts.title')}</h1>
      <Badge>{t('contracts.status.signed')}</Badge>
    </div>
  );
}
```

---

## 2.7 布局规范

### 2.7.1 页面布局类型

| 布局类型 | 说明 | 适用场景 |
|---------|------|---------|
| `sidebar` | 标准侧边栏布局 | 大多数管理页面 |
| `full` | 全屏布局（无侧边栏） | 报表、大屏展示 |
| `minimal` | 最小布局（仅顶部导航） | 登录、设置 |

### 2.7.2 标准页面结构

```tsx
// 标准管理页面结构
export function Contracts() {
  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <header className="flex-shrink-0 border-b bg-card p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">合同管理</h1>
            <p className="text-muted-foreground">管理所有销售合同</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">导出</Button>
            <Button>新建合同</Button>
          </div>
        </div>
      </header>
      
      {/* 工具栏 */}
      <div className="flex-shrink-0 border-b bg-card p-4">
        <div className="flex gap-4">
          <Input placeholder="搜索合同..." className="w-64" />
          <Select>
            <SelectTrigger>状态筛选</SelectTrigger>
            <SelectContent>...</SelectContent>
          </Select>
        </div>
      </div>
      
      {/* 内容区 */}
      <main className="flex-1 overflow-auto p-4">
        {/* 数据表格或卡片列表 */}
      </main>
      
      {/* 分页 */}
      <footer className="flex-shrink-0 border-t bg-card p-4">
        <Pagination />
      </footer>
    </div>
  );
}
```

---

## 2.8 状态管理规范

### 2.8.1 本地状态

使用 React 内置 hooks：

```tsx
const [isOpen, setIsOpen] = useState(false);
const [selectedId, setSelectedId] = useState<string | null>(null);
```

### 2.8.2 服务端状态

使用 TanStack Query (React Query)：

```tsx
// hooks/useContracts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useContracts(filters?: ContractFilters) {
  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => api.getContracts(filters),
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}
```

### 2.8.3 全局状态

使用 Zustand（跨组件共享状态）：

```tsx
// stores/contractStore.ts
import { create } from 'zustand';

interface ContractStore {
  selectedContract: Contract | null;
  setSelectedContract: (contract: Contract | null) => void;
}

export const useContractStore = create<ContractStore>((set) => ({
  selectedContract: null,
  setSelectedContract: (contract) => set({ selectedContract: contract }),
}));
```

---

## 2.9 无障碍规范

### 2.9.1 ARIA属性

```tsx
// ✅ 正确：添加ARIA属性
<button
  aria-label="删除合同"
  aria-describedby="delete-tooltip"
>
  <Trash className="w-4 h-4" />
</button>

<span id="delete-tooltip" role="tooltip">
  删除后无法恢复
</span>
```

### 2.9.2 键盘导航

```tsx
// 支持键盘操作
<Table>
  <TableBody>
    {contracts.map((contract) => (
      <TableRow
        key={contract.id}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleOpen(contract);
          if (e.key === 'Delete') handleDelete(contract);
        }}
      >
        ...
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 2.10 性能优化

### 2.10.1 懒加载

```tsx
// 路由级懒加载
const Contracts = lazy(() => import('./routes/Contracts'));
const Orders = lazy(() => import('./routes/Orders'));

// 组件级懒加载
const HeavyChart = lazy(() => import('./components/HeavyChart'));
```

### 2.10.2 虚拟列表

```tsx
// 大数据量使用虚拟列表
import { VirtualList } from '@tanstack/react-virtual';

<VirtualList
  count={10000}
  estimateSize={() => 50}
>
  {(index) => <ContractRow contract={contracts[index]} />}
</VirtualList>
```

### 2.10.3 图片优化

```tsx
// 使用懒加载图片
<img
  src={contract.attachmentUrl}
  loading="lazy"
  alt={contract.title}
/>
```

---

## 下一步

- [第3章：工具层规范](./03-tools-spec.md)
- [第4章：数据层规范](./04-data-spec.md)
