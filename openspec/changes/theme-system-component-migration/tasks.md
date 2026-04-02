# Tasks: 主题系统组件迁移

## 实现类型
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 3

## 任务列表

### Task 1: 定义按钮颜色
- **描述**: 创建按钮颜色定义
- **文件**: `src/theme/colors/buttonColors.ts`
- **验收**:
  - [ ] 定义 buttonBackground
  - [ ] 定义 buttonHoverBackground
  - [ ] 定义 buttonForeground
  - [ ] 定义 destructive 系列颜色
  - [ ] 定义 outline 系列颜色
  - [ ] 定义 secondary 系列颜色
  - [ ] 定义 ghost 系列颜色
  - [ ] 定义 link 系列颜色

### Task 2: 定义卡片颜色
- **描述**: 创建卡片颜色定义
- **文件**: `src/theme/colors/cardColors.ts`
- **验收**:
  - [ ] 定义 cardBackground
  - [ ] 定义 cardBorder
  - [ ] 定义 cardForeground
  - [ ] 定义 cardHeaderBorder
  - [ ] 定义 cardFooterBorder

### Task 3: 定义侧边栏颜色
- **描述**: 创建侧边栏颜色定义
- **文件**: `src/theme/colors/sidebarColors.ts`
- **验收**:
  - [ ] 定义 sidebarBackground
  - [ ] 定义 sidebarBorder
  - [ ] 定义 sidebarForeground
  - [ ] 定义侧边栏搜索相关颜色
  - [ ] 定义侧边栏激活状态颜色

### Task 4: 定义顶部栏颜色
- **描述**: 创建顶部栏颜色定义
- **文件**: `src/theme/colors/topbarColors.ts`
- **验收**:
  - [ ] 定义 topbarBackground
  - [ ] 定义顶部栏菜单相关颜色
  - [ ] 定义顶部栏危险操作颜色

### Task 5: 迁移 Button 组件
- **描述**: 将 Button 组件的硬编码颜色迁移到 CSS 变量
- **文件**: `src/components/ui/button.tsx`
- **验收**:
  - [ ] default variant 使用 CSS 变量
  - [ ] destructive variant 使用 CSS 变量
  - [ ] outline variant 使用 CSS 变量
  - [ ] secondary variant 使用 CSS 变量
  - [ ] ghost variant 使用 CSS 变量
  - [ ] link variant 使用 CSS 变量

### Task 6: 迁移 Card 组件
- **描述**: 将 Card 组件的硬编码颜色迁移到 CSS 变量
- **文件**: `src/components/ui/card.tsx`
- **验收**:
  - [ ] Card 使用 CSS 变量
  - [ ] CardHeader 使用 CSS 变量
  - [ ] CardTitle 使用 CSS 变量
  - [ ] CardDescription 使用 CSS 变量
  - [ ] CardFooter 使用 CSS 变量

### Task 7: 迁移 TopBar 组件
- **描述**: 将 TopBar 组件的硬编码颜色迁移到 CSS 变量
- **文件**: `src/components/common/TopBar.tsx`
- **验收**:
  - [ ] TopBar 背景使用 CSS 变量
  - [ ] 菜单 Trigger 使用 CSS 变量
  - [ ] 菜单 Content 使用 CSS 变量
  - [ ] 菜单 Item 使用 CSS 变量
  - [ ] 菜单 Separator 使用 CSS 变量
  - [ ] 危险操作使用 CSS 变量

### Task 8: 迁移 Sidebar 组件
- **描述**: 将 Sidebar 组件的硬编码颜色迁移到 CSS 变量
- **文件**: `src/components/common/Sidebar.tsx`
- **验收**:
  - [ ] Sidebar 背景使用 CSS 变量
  - [ ] 搜索框使用 CSS 变量
  - [ ] 分类按钮使用 CSS 变量
  - [ ] 激活状态使用 CSS 变量
  - [ ] 指示条使用 CSS 变量

### Task 9: 更新颜色导出
- **描述**: 更新 colors/index.ts 导出所有颜色
- **文件**: `src/theme/colors/index.ts`
- **验收**:
  - [ ] 导出按钮颜色
  - [ ] 导出卡片颜色
  - [ ] 导出侧边栏颜色
  - [ ] 导出顶部栏颜色

### Task 10: 验证迁移
- **描述**: 验证所有组件迁移正确
- **验收**:
  - [ ] Button 组件功能正常
  - [ ] Card 组件功能正常
  - [ ] TopBar 组件功能正常
  - [ ] Sidebar 组件功能正常
  - [ ] 主题切换正常生效

## 测试要点

- [ ] Button 组件渲染测试
- [ ] Card 组件渲染测试
- [ ] TopBar 组件渲染测试
- [ ] Sidebar 组件渲染测试
- [ ] 亮色主题切换测试
- [ ] 暗色主题切换测试
- [ ] 高对比度主题切换测试
- [ ] 浏览器测试（UI 变更）

## 实现检查清单

- [ ] 代码风格符合项目规范
- [ ] TypeScript strict mode 通过
- [ ] 组件功能不受影响
- [ ] 浏览器测试通过
