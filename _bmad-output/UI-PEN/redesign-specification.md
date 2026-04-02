# AI-Automated-office UI Redesign Specification

Based on the settings page design style (`_bmad-output/UI-PEN/设置页.pen`), this document outlines the complete UI redesign for all existing UI pages and components.

---

## Design System Overview

### Color Palette (GitHub Dark Style)

| Token | Hex Code | Usage |
|-------|----------|-------|
| `background` | `#0F1419` | Main app background |
| `backgroundSecondary` | `#161B22` | Cards, panels, sidebars |
| `backgroundTertiary` | `#21262D` | Hover states, inputs |
| `border` | `#30363D` | Borders, dividers |
| `textPrimary` | `#C9D1D9` | Primary text |
| `textSecondary` | `#8B949E` | Secondary text, labels |
| `textMuted` | `#6E7681` | Muted text, placeholders |
| `primary` | `#238636` | Primary actions (green) |
| `primaryLight` | `#2EA043` | Primary hover |
| `info` | `#58A6FF` | Links, focus states (blue) |
| `success` | `#3FB950` | Success states |
| `warning` | `#D29922` | Warning states |
| `error` | `#F85149` | Error states, destructive |

### Typography

- **Font Family**: Inter (fallback: system-ui, sans-serif)
- **Font Sizes**:
  - `xs`: 12px
  - `sm`: 13px
  - `base`: 14px
  - `lg`: 16px
  - `xl`: 18px
- **Font Weights**:
  - `normal`: 400
  - `medium`: 500
  - `semibold`: 600
  - `bold`: 700

### Spacing System

| Name | Value |
|------|-------|
| `small` | 4px |
| `medium` | 8px |
| `large` | 16px |
| `xlarge` | 24px |

### Border Radius

| Name | Value |
|------|-------|
| `small` | 6px |
| `medium` | 8px |
| `large` | 12px |

---

## Layout Components

### 1. TopBar (Menu Bar)

**Structure:**
```
┌──────────────────────────────────────────────────────────────────┐
│ Realline │ 文件 | 编辑 | 视图 | 助手 | 插件 | 工具 | 硬件 | 帮助 │    [Account] [Layout Controls] │
└──────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Height: 40px (h-10)
- Background: `#1C2128`
- Menu text: `#C9D1D9`, 13px
- Menu hover: `#30363D` background
- Menu border radius: 6px

**Files Updated:**
- `src/components/common/TopBar.tsx`

### 2. ActivityBar

**Structure:**
```
┌────┐
│ 🏠 │  <- 仪表盘
│ 👥 │  <- 人事部
│ 📄 │  <- 财务部
│ 💬 │  <- 销售部
│ ✅ │  <- 审批中心
│ 🛒 │  <- 售后服务
│ 📦 │  <- 仓储部
│ 📚 │  <- 知识库
├────┤
│ 👤 │  <- 账号
│ ⚙️ │  <- 设置
└────┘
```

**Specifications:**
- Width: 48px
- Background: `#1C2128`
- Icon color inactive: `#C9D1D9`
- Icon color active: `#FFFFFF`
- Active background: `#0F1419`
- Icon size: 22px
- Item size: 40x40px
- Gap between icons: 4px
- Divider line: `#30363D`

**Files Updated:**
- `src/components/common/ActivityBar.tsx`

### 3. Sidebar

**Structure:**
```
┌──────────────────────────┐
│ 资源浏览器               │  <- Header 56px
├──────────────────────────┤
│ 🔍 搜索...              │  <- Search 44px
├──────────────────────────┤
│ 固定导航                │  <- Section title
│  ├── 用户管理           │
│  └── 组织架构           │
│                          │
│ 动态资源                │
│  ├── ...                │
│                          │
│ 编辑器                  │
│  └── ...                │
│                          │
│ 最近打开                │
│  └── ...                │
└──────────────────────────┘
```

**Specifications:**
- Width: 280px (default, resizable 220-320)
- Background: `#161B22`
- Header background: `#161B22`
- Header border: 1px `#21262D`
- Header text: `#C9D1D9`, 16px semibold
- Search background: `#0D1117`
- Search icon: `#8B949E`
- Section title: `#8B949E`, 12px semibold
- Item text: `#C9D1D9`
- Item hover background: `#21262D`
- Item active background: `#21262D`

**Files Updated:**
- `src/components/common/Sidebar.tsx`

### 4. Workbench (Main Content Area)

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    工作区内容                                │
│                    (settings page / dashboard / etc.)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Background: `#0F1419`
- Padding: 24px

**Files Updated:**
- `src/components/common/Workbench.tsx`

### 5. StatusBar

**Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ 系统就绪                    │ 已同步 │ v2.1.0 │ 深色主题 🌙   │
└────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Height: 24px (h-6)
- Background: `#161B22`
- Text: `#8B949E`, 11px
- Sync icon: `#3FB950`
- Theme icon: `#8B949E`

**Files Updated:**
- `src/components/common/StatusBar.tsx`

### 6. BottomPanel

**Specifications:**
- Background: `#161B22`
- Header height: 36px
- Header text: `#8B949E`, uppercase
- Header border: 1px `#21262D`
- Content text: `#8B949E`

**Files Updated:**
- `src/components/common/BottomPanel.tsx`

### 7. AiChatPanel

**Specifications:**
- Background: `#0F1419`
- Border: 1px `#30363D`

**Files Updated:**
- `src/components/common/AiChatPanel.tsx`

---

## UI Components

### Button Variants

| Variant | Background | Text | Border | Hover |
|---------|------------|------|--------|-------|
| `default` | `#238636` | white | `#238636` | `#2EA043` |
| `destructive` | `#DA3633` | white | `#DA3633` | `#F85149` |
| `outline` | transparent | `#C9D1D9` | `#30363D` | `#21262D` |
| `secondary` | `#21262D` | `#C9D1D9` | `#30363D` | `#30363D` |
| `ghost` | transparent | `#C9D1D9` | - | `#21262D` |

**Files Updated:**
- `src/components/ui/button.tsx`

### Input

**Specifications:**
- Background: `#0D1117`
- Border: 1px `#30363D`
- Text: `#C9D1D9`
- Placeholder: `#8B949E`
- Focus border: `#58A6FF`

**Files Updated:**
- `src/components/ui/input.tsx`

### Card

**Specifications:**
- Background: `#161B22`
- Border: 1px `#30363D`
- Border radius: 8px
- Header background: `#161B22`
- Header border: 1px `#21262D`
- Title color: `#C9D1D9`
- Description color: `#8B949E`

**Files Updated:**
- `src/components/ui/card.tsx`

### Select

**Specifications:**
- Same as Input for trigger
- Dropdown background: `#161B22`
- Dropdown border: `#30363D`
- Item hover: `#21262D`
- Item text: `#C9D1D9`
- Check icon: `#58A6FF`

**Files Updated:**
- `src/components/ui/select.tsx`

### Dialog/Modal

**Specifications:**
- Overlay: `rgba(0, 0, 0, 0.7)`
- Content background: `#161B22`
- Content border: 1px `#30363D`
- Title color: `#C9D1D9`
- Description color: `#8B949E`

**Files Updated:**
- `src/components/ui/dialog.tsx`

### Checkbox

**Specifications:**
- Unchecked border: `#30363D`
- Unchecked background: `#0D1117`
- Checked background: `#58A6FF`
- Check icon: `#58A6FF`

**Files Updated:**
- `src/components/ui/checkbox.tsx`

### Switch

**Specifications:**
- Track unchecked: `#30363D`
- Thumb unchecked: `#8B949E`
- Track checked: `#238636`
- Thumb checked: white

**Files Updated:**
- `src/components/ui/switch.tsx`

### Tabs

**Specifications:**
- List background: `#21262D`
- Inactive text: `#8B949E`
- Active text: `#C9D1D9`
- Active indicator: white

**Files Updated:**
- `src/components/ui/tabs.tsx`

### Table

**Specifications:**
- Row hover: `#161B22`
- Header text: `#8B949E`
- Cell border: `#30363D`
- Footer background: `#0D1117`

**Files Updated:**
- `src/components/ui/table.tsx`

### Badge Variants

| Variant | Background | Text |
|---------|------------|------|
| `default` | `#238636` | white |
| `secondary` | `#21262D` | `#C9D1D9` |
| `destructive` | `#DA3633` | white |
| `outline` | transparent | `#C9D1D9` |
| `success` | `#238636` | white |
| `warning` | `#D29922` | white |
| `info` | `#1F6FEB` | white |

**Files Updated:**
- `src/components/ui/badge.tsx`

### Tooltip

**Specifications:**
- Background: `#161B22`
- Border: 1px `#30363D`
- Text: `#C9D1D9`

**Files Updated:**
- `src/components/ui/tooltip.tsx`

### Alert

**Specifications:**
| Variant | Border | Text |
|---------|--------|------|
| `destructive` | `#F85149` | `#F85149` |
| `warning` | `#D29922` | `#D29922` |
| `success` | `#3FB950` | `#3FB950` |
| `info` | `#58A6FF` | `#58A6FF` |

**Files Updated:**
- `src/components/ui/alert.tsx`

### Progress/Slider

**Specifications:**
- Track background: `#21262D`
- Fill color: `#238636`
- Thumb border: `#238636`

**Files Updated:**
- `src/components/ui/progress.tsx`, `slider.tsx`

---

## Chat Components

### SessionPanel

**Specifications:**
- Main background: `#0F1419`
- Side panel background: `#161B22`
- Side panel border: 1px `#30363D`
- Overlay: `rgba(0, 0, 0, 0.3)`

**Files Updated:**
- `src/features/agent/components/SessionPanel.tsx`

### ChatPanel

**Specifications:**
- Header background: `#161B22`
- Header height: 56px
- Header border: 1px `#30363D`
- Logo background: `#238636`
- Primary button: `#238636`

**Files Updated:**
- `src/features/agent/components/chat/ChatPanel.tsx`

### ChatInput

**Specifications:**
- Input background: `#0D1117`
- Input border: `#30363D`
- Input focus border: `#58A6FF`
- Send button: `#238636`
- Send button hover: `#2EA043`
- Stop button: `#F85149`

**Files Updated:**
- `src/features/agent/components/chat/ChatInput.tsx`

---

## Design Implementation Files

### Files Modified:

1. **Layout Components:**
   - `src/components/common/AppLayout.tsx`
   - `src/components/common/TopBar.tsx`
   - `src/components/common/ActivityBar.tsx`
   - `src/components/common/Sidebar.tsx`
   - `src/components/common/Workbench.tsx`
   - `src/components/common/StatusBar.tsx`
   - `src/components/common/BottomPanel.tsx`
   - `src/components/common/AiChatPanel.tsx`
   - `src/components/common/ResizablePanel.tsx`

2. **UI Components:**
   - `src/components/ui/button.tsx`
   - `src/components/ui/input.tsx`
   - `src/components/ui/card.tsx`
   - `src/components/ui/checkbox.tsx`
   - `src/components/ui/switch.tsx`
   - `src/components/ui/select.tsx`
   - `src/components/ui/tabs.tsx`
   - `src/components/ui/separator.tsx`
   - `src/components/ui/label.tsx`
   - `src/components/ui/textarea.tsx`
   - `src/components/ui/badge.tsx`
   - `src/components/ui/dialog.tsx`
   - `src/components/ui/alert-dialog.tsx`
   - `src/components/ui/dropdown-menu.tsx`
   - `src/components/ui/alert.tsx`
   - `src/components/ui/table.tsx`
   - `src/components/ui/slider.tsx`
   - `src/components/ui/progress.tsx`
   - `src/components/ui/collapsible.tsx`
   - `src/components/ui/tooltip.tsx`
   - `src/components/ui/menubar.tsx`
   - `src/components/ui/avatar.tsx`
   - `src/components/ui/radio-group.tsx`
   - `src/components/ui/scroll-area.tsx`

3. **Agent Components:**
   - `src/features/agent/components/SessionPanel.tsx`
   - `src/features/agent/components/chat/ChatPanel.tsx`
   - `src/features/agent/components/chat/ChatInput.tsx`
   - `src/features/agent/components/chat/constants.ts`
   - `src/features/agent/components/chat/utils.ts`

---

## Verification

### Build Status
✅ Build completed successfully with no TypeScript errors

### Components Redesigned
- ✅ All layout components redesigned
- ✅ All UI components redesigned  
- ✅ Chat components redesigned
- ✅ Color palette applied consistently
- ✅ Typography system applied
- ✅ Spacing system applied
