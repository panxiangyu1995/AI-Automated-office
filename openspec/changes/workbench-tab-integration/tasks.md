# Tasks: workbench-tab-integration

## 实现类型

- **类型**: new
- **优先级**: medium
- **阶段**: Phase X - L3 多标签页系统
- **状态**: ✅ 已完成 (2026-04-10)

## 前置依赖

- `workbench-tab-system`（已完成）

## 任务列表

### Task 1: 定义路由键常量

**描述**: 定义所有业务路由的键常量

**文件**:
- `src/lib/routes.ts`

**验收**:
- [x] 定义 ROUTE_KEYS 常量对象
- [x] 定义 Tab 类型常量
- [x] 导出路由辅助函数

**子任务**:
- [x] 1.1 创建路由键定义
- [x] 1.2 创建路由到键的映射函数
- [x] 1.3 导出辅助函数

### Task 2: 扩展 workbenchStore

**描述**: 扩展 workbenchStore，添加路由集成方法

**文件**:
- `src/stores/workbenchStore.ts`

**验收**:
- [x] 添加 openTabByRoute 方法
- [x] 添加 closeTabByRoute 方法
- [x] 添加 findTabByRouteKey 方法
- [x] 添加 closeOtherTabsExcept 方法

**子任务**:
- [x] 2.1 添加路由相关方法
- [x] 2.2 更新类型定义
- [x] 2.3 测试路由方法

### Task 3: 实现路由监听

**描述**: 在 Workbench 中监听路由变化

**文件**:
- `src/components/common/Workbench.tsx`

**验收**:
- [x] 使用 useLocation 监听路由
- [x] 路由变化时自动激活/打开 Tab
- [x] 处理路由参数

**子任务**:
- [x] 3.1 导入 useLocation
- [x] 3.2 实现 useEffect 监听
- [x] 3.3 处理路由匹配逻辑

### Task 4: 实现 Tab 切换同步路由

**描述**: Tab 切换时同步更新路由

**文件**:
- `src/components/common/Tab.tsx`
- `src/components/common/Workbench.tsx`

**验收**:
- [x] 点击 Tab 时使用 navigate 更新路由（可选，非强制）
- [x] 处理浏览器前进/后退

**子任务**:
- [x] 4.1 路由监听实现
- [x] 4.2 浏览器导航处理

### Task 5: 实现 AI 打开 Tab

**描述**: 在 Agent 交互中支持打开 Tab

**文件**:
- `src/stores/workbenchStore.ts`

**验收**:
- [x] Agent 可调用 openTabByRoute
- [x] 支持通过 AI 导航打开页面

**子任务**:
- [x] 5.1 workbenchStore 提供 openTabByRoute 方法
- [x] 5.2 AI 工具可调用该方法

## 测试要点

- [x] 单元测试: workbenchStore 路由方法
- [x] 单元测试: 路由键辅助函数
- [x] E2E 测试: Tab 与路由集成
- [x] 浏览器测试: 路由导航

## 验收标准

1. [x] 通过路由导航可以打开/激活 Tab
2. [x] 点击 Tab 可以同步更新路由
3. [x] AI 可以通过 openTabByRoute 打开 Tab
4. [x] 同一路由的多个 Tab 可以区分
5. [x] Tab 关闭后可以继续通过路由打开

## 实现文件清单

```
新建文件：
├── src/lib/routes.ts                  # 路由键常量定义

修改文件：
├── src/stores/workbenchStore.ts        # 添加路由相关方法
└── src/components/common/Workbench.tsx  # 添加路由监听
```
