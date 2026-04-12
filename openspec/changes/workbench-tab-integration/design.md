# Design: workbench-tab-integration

## 上下文

Tab 系统需要与 React Router 集成，实现以下功能：

1. 路由变化时自动打开/激活 Tab
2. Tab 切换时同步路由
3. AI 导航通过 store 方法打开 Tab

**约束：**

- Tab 只管理 UI 状态，不直接操作路由
- 路由变化通过 useEffect 触发 Tab 操作
- 使用 React Router 的 useNavigate 和 useParams

## 目标 / 非目标

**目标：**

- 实现路由到 Tab 的映射
- 实现 Tab 切换同步路由
- 实现 AI 打开 Tab 的便捷方法

**非目标：**

- 不实现 Tab 历史记录
- 不实现 Tab 状态持久化

## 决策

### Decision 1: 路由与 Tab 的关系

**选择：** Tab 持有 routeKey，路由变化时匹配 Tab

```typescript
interface WorkbenchTab {
  // ...
  routeKey?: string  // 关联的路由键，如 'sales/quote'
  params?: Record<string, string>  // 路由参数
}
```

**理由：**

- 清晰的关联关系
- 易于路由匹配
- 支持同一路由的多个 Tab

### Decision 2: 路由到 Tab 的映射

**选择：** 使用 useEffect 监听路由变化

```typescript
// 在 WorkbenchTabs 中
useEffect(() => {
  const routeKey = getRouteKey(location.pathname);
  const tab = findTabByRouteKey(routeKey);
  if (tab && tab.id !== activeTabId) {
    setActiveTab(tab.id);
  }
}, [location.pathname]);
```

**理由：**

- 声明式，易于理解
- 易于调试
- 符合 React 模式

### Decision 3: AI 打开 Tab

**选择：** 在 workbenchStore 中提供 openTabByRoute 方法

```typescript
// workbenchStore
openTabByRoute: (routeKey: string, params?: Record<string, string>) => {
  const existingTab = findTabByRouteKey(routeKey);
  if (existingTab) {
    setActiveTab(existingTab.id);
  } else {
    addTab({ routeKey, params, ... });
  }
}
```

**理由：**

- 便捷的 API
- 自动处理新建/激活逻辑
- 易于 AI 调用

## 路由配置

```typescript
// 路由键定义
const ROUTE_KEYS = {
  // 销售
  'sales.quote.list': '/sales/quotes',
  'sales.quote.detail': '/sales/quotes/:id',
  'sales.contract.list': '/sales/contracts',
  'sales.contract.detail': '/sales/contracts/:id',
  
  // 财务
  'finance.invoice.list': '/finance/invoices',
  'finance.invoice.detail': '/finance/invoices/:id',
  
  // 审批
  'approval.list': '/approval',
  'approval.detail': '/approval/:id',
  
  // ... 其他模块
};
```

## Tab 类型与路由映射

| Tab 类型 | 路由键示例 | 说明 |
|----------|-----------|------|
| file | sales.quote.detail | 报价单详情 |
| report | finance.report.q1 | Q1 财务报告 |
| detail | hr.employee.detail | 员工详情 |
| form | sales.quote.create | 新建报价单 |
