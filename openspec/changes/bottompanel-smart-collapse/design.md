# Design: bottompanel-smart-collapse

## 上下文

UX 规范明确要求：

> "L4 是 L3 的信息延伸：展示 L3 工作区内容的更详细信息，如属性面板、日志、诊断、预览等"

当前 BottomPanel 默认展开，4 个 tab 等用户手动切换。用户可能根本不需要这个面板。

## 目标

将 BottomPanel 改为：
- 默认折叠（节省屏幕空间）
- AI 执行任务时智能展开诊断面板
- 用户点击"查看详情"时展开相关面板
- 保留所有现有内容

## 决策

### 智能展开触发

```typescript
type CollapseTrigger = 
  | { type: 'ai-execution', panelType: 'diagnostics' }
  | { type: 'user-action', panelType: PanelType }
  | { type: 'manual' }

// 事件总线触发
eventBus.emit('bottompanel:expand', {
  type: 'ai-execution',
  panelType: 'diagnostics'
})
```

### 默认状态

```typescript
// uiStore.ts
const bottomPanelCollapsed = ref(true)  // 改为默认折叠
```

### 展开动画

```css
.bottom-panel {
  transform: translateY(100%);
  transition: transform 200ms ease-out;
}
.bottom-panel.expanded {
  transform: translateY(0);
}
```

## 实现步骤

1. 修改 bottomPanelCollapsed 默认值为 true
2. 实现智能展开事件总线
3. AI 执行时触发自动展开
4. 添加"查看详情"按钮触发展开
5. 优化展开动画
6. 测试验证

## 风险

[Risk] 用户习惯了默认展开
→ [Mitigation] 提供设置选项，允许切换默认状态

## 开放问题

1. 是否需要记录用户偏好？
2. 展开高度是否可配置？
