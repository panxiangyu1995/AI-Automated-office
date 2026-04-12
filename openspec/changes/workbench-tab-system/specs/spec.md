# Specification: workbench-tab-system

## 需求来源

### UX 规范

依据 `ux-design-specification.md` 第 937-1023 行 **"工作台层级导航体系 (L1–L4)"**：

| 层级 | 组件 | 显示面板 | 职责定位 |
|:----:|------|----------|----------|
| L1 | ActivityBar | 最左侧图标选项栏 | 切换活动域 |
| L2 | Sidebar | L1 右侧侧边栏 | 当前域内的视图切换和二级导航 |
| L3 | Workbench（Tab + 内容区） | 最中间工作区 | 主内容渲染区，支持**多标签页** |
| L4 | Bottom Panel | 底部面板 | L3 工作区内容的更详细信息展示 |

### L3 多标签页规范

> L3 = Tab（多标签页）+ 内容区（Workbench Content），共同构成 L3 层

**标签页行为：**

| 行为 | 规范 |
|------|------|
| 新建标签 | 点击「+」或通过 AI/导航打开新内容时创建新 Tab |
| 切换标签 | 点击 Tab 或使用快捷键 |
| 关闭标签 | 点击 `×` 关闭当前 Tab |
| 多标签展示 | Tab 栏横向排列，超出时支持滚动 |
| 标签溢出策略 | 当 Tab 总宽度超过可用空间时，显示左右滚动按钮 |
| 未保存提示 | 有未保存内容时，Tab 标题显示圆点指示器 |
| 标签重排 | 支持拖拽调整 Tab 顺序 |

## 功能规格

### 用户故事

As a **用户**,
I want **在工作区同时打开多个文件、报表、详情**,
So that **可以方便地在不同内容之间切换对比**。

### 验收场景

#### Scenario 1: 打开新 Tab

- **GIVEN** 用户在工作区
- **WHEN** 用户点击「+」或通过导航打开新内容
- **THEN** 系统创建新 Tab 并激活

#### Scenario 2: 切换 Tab

- **GIVEN** 用户有多个打开的 Tab
- **WHEN** 用户点击另一个 Tab
- **THEN** 系统激活该 Tab 并显示对应内容

#### Scenario 3: 关闭 Tab

- **GIVEN** 用户有多个打开的 Tab
- **WHEN** 用户点击 Tab 的关闭按钮
- **THEN** 系统关闭该 Tab 并激活相邻 Tab

#### Scenario 4: 未保存提示

- **GIVEN** 用户编辑了某个 Tab 的内容但未保存
- **WHEN** 用户尝试关闭该 Tab
- **THEN** 系统弹出确认对话框

#### Scenario 5: Tab 溢出滚动

- **GIVEN** 打开的 Tab 数量超出容器宽度
- **WHEN** 用户点击左右滚动按钮
- **THEN** 系统滚动 Tab 列表显示更多 Tab

## 数据规格

### 输入

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | string (UUID) | 是 | 自动生成 |
| title | string | 是 | 最大 50 字符 |
| type | TabType | 是 | 枚举值 |
| icon | LucideIcon | 否 | 可选 |
| closable | boolean | 否 | 默认 true |
| dirty | boolean | 否 | 默认 false |
| routeKey | string | 否 | 可选 |
| meta | object | 否 | 可选 |

### 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| tabs | WorkbenchTab[] | 当前打开的 Tab 列表 |
| activeTabId | string | 当前激活的 Tab ID |

## 边界条件

1. **最大 Tab 数量**: 超过 maxTabs 时，提示用户关闭旧 Tab
2. **关闭最后一个 Tab**: 显示空工作区
3. **关闭中间 Tab**: 自动激活下一个 Tab
4. **同一路由多次打开**: 生成不同的 Tab ID

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| Tab 数量超限 | Toast 提示"请先关闭不需要的 Tab" |
| 关闭未保存 Tab | 弹出确认对话框 |
| Tab 渲染失败 | 显示错误占位符，允许关闭 |
