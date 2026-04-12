# Design: workbench-tab-shortcuts

## 上下文

实现 L3 Tab 的键盘快捷键支持，依赖 `workbench-tab-system` 提供的 Tab 状态管理。

**约束：**

- 快捷键在全局范围内生效
- 需要检测焦点元素，避免在输入框中误触发
- 需要处理快捷键冲突

## 目标 / 非目标

**目标：**

- 实现所有定义的 Tab 快捷键
- 实现焦点检测，避免在输入框中误触发
- 实现快捷键覆盖检测

**非目标：**

- 不实现自定义快捷键配置
- 不实现快捷键录制功能

## 快捷键定义

| 快捷键 | 操作 | 描述 |
|--------|------|------|
| `Ctrl+Tab` | nextTab | 切换到下一个 Tab |
| `Ctrl+Shift+Tab` | prevTab | 切换到上一个 Tab |
| `Ctrl+W` | closeTab | 关闭当前 Tab |
| `Ctrl+T` | newTab | 新建空白 Tab |
| `Ctrl+1` | gotoTab1 | 切换到第 1 个 Tab |
| `Ctrl+2` | gotoTab2 | 切换到第 2 个 Tab |
| ... | ... | ... |
| `Ctrl+9` | gotoTab9 | 切换到第 9 个 Tab |
| `Ctrl+Shift+O` | closeOtherTabs | 关闭其他 Tab |

## 决策

### Decision 1: 快捷键处理位置

**选择：** 使用 React 的 useEffect + useCallback 实现

**理由：**

- 组件卸载时自动清理
- 与 React 生命周期集成
- 避免全局事件污染

### Decision 2: 焦点检测

**选择：** 检测 event.target 的 tagName

```typescript
const isInputElement = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return ['input', 'textarea', 'select'].includes(tagName) || 
         target.isContentEditable;
};
```

**理由：**

- 简单有效
- 覆盖常见输入场景
- 性能开销小

### Decision 3: 快捷键注册

**选择：** 在 TabBar 或 AppLayout 中注册

**理由：**

- TabBar 卸载时自动清理
- 全局生效，覆盖所有 Tab

## 实现方案

### 1. 创建 useTabShortcuts Hook

```typescript
// src/hooks/useTabShortcuts.ts
export function useTabShortcuts() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useWorkbenchStore();
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 焦点检测
      if (isInputElement(e.target)) return;
      
      // 快捷键处理
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        // ...
      }
      // ...
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabs, activeTabId, ...]);
}
```

### 2. 注册到 TabBar

```tsx
// src/components/common/TabBar.tsx
export function TabBar() {
  useTabShortcuts(); // 注册快捷键
  
  return (
    <div className="tab-bar">
      {/* ... */}
    </div>
  );
}
```

## 冲突处理

| 场景 | 处理方式 |
|------|----------|
| 浏览器默认 Tab 切换 | e.preventDefault() 阻止 |
| 与 VSCode 快捷键冲突 | 使用 Tauri 快捷键系统 |
| 与其他应用冲突 | 提示用户 |
