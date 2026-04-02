# Specification: 主题系统预设主题

## 需求来源

### PRD 需求
- FR1-FR6: 桌面端 UI 基本框架

### 架构约束
- 技术栈：React + TypeScript

### UX 规范
- 主题应有明确的视觉区分
- 高对比度主题应满足无障碍要求

## 功能规格

### 主题数据接口

```typescript
interface ThemeData {
  id: string
  name: string
  type: 'light' | 'dark' | 'hc'
  extends?: string
  colors: Record<string, string>
}
```

### 亮色主题 (lightModern)

适用于白天或明亮环境使用的浅色界面。

### 暗色主题 (darkModern)

适用于夜间或低光环境使用的深色界面，基于 GitHub Dark 配色。

### 高对比度主题 (highContrast)

适用于视力障碍用户的无障碍主题，对比度满足 WCAG AAA 标准。

## 颜色覆盖要求

每个主题必须覆盖以下颜色分类：
1. 基础颜色（foreground, background, border, errorForeground, focusBorder）
2. 按钮颜色（button.*）
3. 卡片颜色（card.*）
4. 侧边栏颜色（sidebar.*）
5. 顶部栏颜色（topbar.*）

## 边界条件

1. **颜色缺失**: 使用 fallback 到已注册颜色的默认值
2. **主题 ID 重复**: 抛出错误

## 错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| 颜色 ID 未注册 | 忽略，跳过该颜色 |
| 主题数据格式错误 | 抛出 TypeError |
