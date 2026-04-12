# Specification: workbench-tab-integration

## 需求来源

依据 `ux-design-specification.md` **"工作台层级导航体系 (L1–L4)"** 中 L3 工作区的路由集成要求。

## 功能规格

### 用户故事

As a **用户**,
I want **通过路由导航打开 Tab，并在 Tab 间切换时同步路由**,
So that **可以使用浏览器的后退/前进功能，并分享特定 Tab 的 URL**。

As a **AI**,
I want **通过 openTabByRoute 方法打开 Tab**,
So that **可以响应用户的导航需求**。

### 验收场景

#### Scenario 1: 路由导航打开 Tab

- **GIVEN** 用户在地址栏输入 `/sales/quotes/123`
- **WHEN** 路由变化
- **THEN** 系统打开报价单详情 Tab 并激活

#### Scenario 2: Tab 切换同步路由

- **GIVEN** 用户点击报价单 Tab
- **WHEN** Tab 激活
- **THEN** 路由更新为 `/sales/quotes/123`

#### Scenario 3: 已有 Tab 激活而非新建

- **GIVEN** 报价单 Tab 已打开，用户再次导航到相同路由
- **WHEN** 路由变化
- **THEN** 系统激活现有 Tab，而非新建

#### Scenario 4: AI 打开 Tab

- **GIVEN** 用户对 AI 说"帮我打开销售报价单"
- **WHEN** AI 处理请求
- **THEN** 系统打开销售报价单 Tab

## 路由规格

### 路由键定义

| 路由键 | 路由路径 | Tab 类型 | 说明 |
|--------|----------|----------|------|
| sales.quote.list | /sales/quotes | list | 报价单列表 |
| sales.quote.detail | /sales/quotes/:id | detail | 报价单详情 |
| sales.contract.list | /sales/contracts | list | 合同列表 |
| sales.contract.detail | /sales/contracts/:id | detail | 合同详情 |
| finance.invoice.list | /finance/invoices | list | 发票列表 |
| finance.invoice.detail | /finance/invoices/:id | detail | 发票详情 |
| approval.list | /approval | list | 审批列表 |
| approval.detail | /approval/:id | detail | 审批详情 |
| hr.employee.list | /hr/employees | list | 员工列表 |
| hr.employee.detail | /hr/employees/:id | detail | 员工详情 |
| warehouse.stock.list | /warehouse/stock | list | 库存列表 |
| warehouse.stock.detail | /warehouse/stock/:id | detail | 库存详情 |

## 边界条件

1. **同一路由的多个 Tab**: 使用不同的 tab id 区分
2. **路由参数变化**: 视为不同 Tab
3. **非法路由**: 显示 404 页面，不创建 Tab

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| 路由匹配失败 | 显示 NotFound 页面 |
| Tab 渲染失败 | 显示错误占位符 |
| 路由参数缺失 | 显示参数缺失提示 |
