# Remotion 场景选择说明

## 为什么是这 4 个

这些场景不是随意挑的，而是从 PRD、架构和 UX 铁律里，优先选择最能让目标客户一眼看懂产品定位、业务价值和界面特色的部分。

### 1. 产品定位篇

- 对应铁律重点：
  - PRD Executive Summary
  - UX Executive Summary
  - Epic 中关于通用 Agent Runtime、动态承载与工作台的方向
- 为什么必须做：
- 这是最快解释“我们不是工具集合，而是 AI 办公系统”的场景
  - 适合在 5 秒内建立差异化认知

### 2. 销售联动篇

- 对应铁律重点：
  - PRD 销售自动化用户旅程
  - 跨部门联动价值
  - 动态工作台卡片与 Agent 写回方向
- 为什么必须做：
  - 最直观体现“说一句话，系统自动带动多个部门动作”
  - 很适合老板、销售负责人、渠道客户一起看

### 3. 财务自动化篇

- 对应铁律重点：
  - PRD 财务 OCR、台账生成、应收应付
  - UX 中对透明可控、关键确认的要求
- 为什么必须做：
  - 财务场景最容易量化 ROI
  - 容易形成“原来 2 天的工作，30 分钟完成”的强感知

### 4. 老板驾驶舱篇

- 对应铁律重点：
  - 管理层模块
  - 统一数据中台
  - 跨部门数据汇总与 AI 洞察
- 为什么必须做：
  - 这是最终购买决策者最关心的价值
  - 同时最适合展示 VSCode 风格四栏桌面端界面

## 当前实现特点

- 统一采用桌面端四栏界面语言：
  - 活动栏
  - 侧边栏
  - 工作区
  - AI 对话面板
- 统一采用品牌深蓝色 `#1E3A5F`
- AI 对话始终作为主入口
- 所有场景都强调“透明调用”和“部门联动”
- `ProductShowreel` 已串联片头、4 个核心场景、片尾，并使用统一淡入淡出转场
- 4 个场景文案已改为更适合对外销售演示的口吻，重点突出定位、价值和界面辨识度

## 当前 Remotion 入口

- `src/remotion/index.ts`
- `src/remotion/Root.tsx`
- `src/remotion/scenes/ProductStory.tsx`

## 可直接渲染的场景

- `ProductPositioning`
- `SalesDepartmentFlow`
- `FinanceAutomation`
- `ExecutiveCockpit`
- `ProductShowreel`
