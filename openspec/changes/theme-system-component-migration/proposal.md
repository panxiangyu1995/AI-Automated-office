# Proposal: 主题系统组件迁移

## 变更类型
- [ ] 新功能
- [x] 重构
- [ ] 优化
- [ ] 修复

## 背景

当前组件中存在大量硬编码颜色，主题切换无法生效。需要将硬编码颜色迁移到 CSS 变量。

## 目标

迁移核心组件的硬编码颜色到 CSS 变量：
- Button 组件
- Card 组件
- TopBar 组件
- Sidebar 组件

## 范围

### 包含
- 定义按钮颜色
- 定义卡片颜色
- 定义侧边栏颜色
- 定义顶部栏颜色
- 迁移 Button 组件
- 迁移 Card 组件
- 迁移 TopBar 组件
- 迁移 Sidebar 组件

### 不包含
- 预设主题定义
- 其他非核心组件

## 影响范围

### 前端
- `src/theme/colors/buttonColors.ts`（新建）
- `src/theme/colors/cardColors.ts`（新建）
- `src/theme/colors/sidebarColors.ts`（新建）
- `src/theme/colors/topbarColors.ts`（新建）
- `src/components/ui/button.tsx`（修改）
- `src/components/ui/card.tsx`（修改）
- `src/components/common/TopBar.tsx`（修改）
- `src/components/common/Sidebar.tsx`（修改）

### 后端
- 无

### 数据库
- 无

## 硬编码颜色清单

### button.tsx (当前)
```typescript
variant: {
  default: "bg-[#238636] text-white hover:bg-[#2EA043] border border-[#238636]",
  destructive: "bg-[#DA3633] text-white hover:bg-[#F85149] border border-[#DA3633]",
  outline: "border border-[#30363D] bg-transparent hover:bg-[#21262D] hover:border-[#484F58] text-[#C9D1D9]",
  secondary: "bg-[#21262D] text-[#C9D1D9] hover:bg-[#30363D] border border-[#30363D]",
  ghost: "hover:bg-[#21262D] hover:text-[#C9D1D9] text-[#C9D1D9]",
  link: "text-[#58A6FF] underline-offset-4 hover:underline",
}
```

### card.tsx (当前)
```typescript
style={{
  backgroundColor: '#161B22',
  border: '1px solid #30363D',
}}
```

### TopBar.tsx (当前)
```typescript
style={{ backgroundColor: '#1C2128' }}
style={{ color: '#C9D1D9' }}
style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}
```

### Sidebar.tsx (当前)
```typescript
style={{ backgroundColor: '#161B22' }}
style={{ borderBottom: '1px solid #21262D' }}
style={{ backgroundColor: '#0D1117' }}
```

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|-----|-------|------|---------|
| 迁移后样式不一致 | 中 | 中 | 逐个组件验证 |
| Tailwind 与 CSS 变量冲突 | 低 | 中 | 使用 var() 格式 |

## 依赖

- **前置依赖**:
  - theme-system-foundation
  - theme-system-react-integration
- **后置依赖**:
  - theme-system-preset-themes
