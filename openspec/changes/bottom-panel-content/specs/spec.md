# Specification: bottom-panel-content

## 需求来源

### UX 规范

依据 `ux-design-specification.md` **"工作台层级导航体系 (L1–L4)"** 中 L4 Bottom Panel 定义：

> **L4 - Bottom Panel（底部面板）**
> - 展示 L3 工作区内容的更详细信息
> - 如属性面板、日志、诊断、预览等

## 功能规格

### 用户故事

As a **用户**,
I want **在 Bottom Panel 查看当前内容的详细信息**,
So that **可以快速获取属性、诊断和预览信息**。

### 验收场景

#### Scenario 1: 查看属性信息

- **GIVEN** 用户打开了一个报价单 Tab
- **WHEN** 用户切换到属性面板
- **THEN** 系统显示报价单的属性信息

#### Scenario 2: 查看诊断信息

- **GIVEN** 用户打开了一个表单 Tab
- **WHEN** 用户切换到诊断面板
- **THEN** 系统显示表单的验证错误和警告

#### Scenario 3: 查看预览

- **GIVEN** 用户打开了一个图片/PDF Tab
- **WHEN** 用户切换到预览面板
- **THEN** 系统显示图片/PDF 的预览内容

#### Scenario 4: Tab 切换更新面板

- **GIVEN** 用户在 Bottom Panel 查看属性
- **WHEN** 用户切换到另一个 Tab
- **THEN** 系统更新面板内容为新 Tab 的属性

## 面板类型规格

### 1. PropertiesPanel

| 字段 | 类型 | 描述 |
|------|------|------|
| label | string | 属性标签 |
| value | string | 属性值 |
| copyable | boolean | 是否可复制 |

### 2. DiagnosticsPanel

| 字段 | 类型 | 描述 |
|------|------|------|
| severity | 'info' \| 'warning' \| 'error' | 严重程度 |
| message | string | 诊断信息 |
| action | string | 建议操作 |

### 3. PreviewPanel

| 字段 | 类型 | 描述 |
|------|------|------|
| type | 'image' \| 'pdf' \| 'document' | 预览类型 |
| url | string | 资源地址 |
| zoom | number | 缩放比例 |

### 4. AiSuggestionsPanel

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 建议 ID |
| content | string | 建议内容 |
| timestamp | number | 建议时间 |

## 边界条件

1. **无面板数据**: 显示"暂无信息"占位符
2. **面板加载失败**: 显示错误提示，允许重试
3. **大文件预览**: 显示加载中提示，支持取消

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| 属性获取失败 | 显示错误信息 |
| 预览加载失败 | 显示错误占位符，支持重试 |
| 诊断服务不可用 | 显示服务不可用提示 |
