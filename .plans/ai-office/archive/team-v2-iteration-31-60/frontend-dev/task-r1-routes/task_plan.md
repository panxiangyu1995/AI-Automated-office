# 任务：G8 部门路由补充 + G9 颜色硬编码修复

## G8 路由现状分析

### 已有的 Sidebar 入口 (defaultMenuItems)
- hr: /hr (人事管理)
- finance: /finance (财务管理)
- sales: /sales (销售管理)
- approval: /approval (审批中心)
- warehouse: /warehouse (仓库管理)
- service: /service (售后服务)
- group-chat: /chat/group (群组聊天)
- tender: /tender (招投标)
- marketing: /marketing (市场宣传)

### 缺失的 Sidebar 入口
- knowledge: 只有 /admin/knowledge (admin 路由下)，没有非 admin 入口

### 已有的 workbenchRoutes
- hr, finance, sales, approval, warehouse (5个核心部门)
- service, tender, marketing (3个扩展部门)
- group-chat

### 缺失的 workbenchRoutes
- knowledge: 没有 workbenchRoute，需要添加

### pluginSidebarRegistry 已有注册
所有6核心部门+扩展部门都已有 pluginSidebarRegistry 注册

## G9 颜色硬编码分析

非 theme/ 目录下几乎没有硬编码 hex 颜色。
features/settings/components/KnowledgeEntryManagement.tsx 中的 #1234 是工单号文本，不是颜色。

## 实施计划

### G8 补充项
1. 为 knowledge 添加 KnowledgePage 主页面
2. 在 workbenchRoutes 中添加 knowledge 路由
3. 在 Sidebar defaultMenuItems 中添加 knowledge 入口（在核心部门分组中）

### G9 确认项
- 非 theme/ 目录无硬编码 hex 颜色，无需修复
