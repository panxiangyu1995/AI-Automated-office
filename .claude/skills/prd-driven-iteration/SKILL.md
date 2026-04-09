---
name: prd-driven-iteration
description: |
  PRD驱动的功能优化迭代执行器。先分析代码问题，根据分析结果生成task.json任务，再执行OpenSpec变更。

  触发场景：
  - 用户说"优化agent模块"、"迭代工具系统"、"改进记忆系统"
  - 用户说"分析代码问题"、"扫描XXX模块的代码"
  - 用户说"生成优化任务"、"创建迭代任务清单"
  - 用户说"执行优化迭代"、"运行优化流程"

  核心工作流：
  1. 分析代码问题（扫描TODO/FIXME/DRY/安全）
  2. 根据分析结果生成task.json任务条目
  3. 为任务生成/检查OpenSpec change
  4. 使用openspec-apply-change执行
  5. 更新task.json passes状态
  6. 记录实施情况到progress.txt

  如果用户只想做代码分析（不生成任务），请使用openspec-explore skill。
  如果用户只想读取现有task.json执行，请使用openspec-apply-change skill。
compatibility: 需要访问 _bmad-output/planning-artifacts/ 目录、openspec CLI
metadata:
  author: AI-Automated-office
  version: "3.0"
  language: zh
---

# PRD驱动优化迭代执行器

**目标：** 先分析代码问题，根据分析结果生成task.json任务，再执行OpenSpec变更完成迭代优化。

**核心工作流：**
```
分析代码问题 → 生成task.json → 生成OpenSpec → 执行实现 → 更新task.json → 记录progress.txt
```

---

## 一、PRD铁律

本项目的PRD文档是铁律：

- **PRD文档：** `_bmad-output/planning-artifacts/prd.md`（FR1-FR1558）
- **架构文档：** `_bmad-output/planning-artifacts/architecture.md`
- **UX规范：** `_bmad-output/planning-artifacts/ux-design-specification.md`
- **Epic文档：** `_bmad-output/planning-artifacts/epics.md`

---

## 二、核心工作流

### 第一步：分析代码问题

**确定扫描范围：**
- 根据用户指定的模块（如"agent模块"、"工具系统"）
- 定位对应的源代码目录
- 确定前后端文件范围

#### 1.1 执行代码扫描

```bash
# Rust代码扫描
grep -rn "TODO\|FIXME\|XXX\|HACK" src-tauri/src/[模块]/ --include="*.rs"
grep -rn "unwrap()\|expect(" src-tauri/src/[模块]/ --include="*.rs"
grep -rn "unsafe\|println!\|dbg!" src-tauri/src/[模块]/ --include="*.rs"

# TypeScript代码扫描
grep -rn "TODO\|FIXME\|XXX\|HACK" src/[模块]/ --include="*.ts" --include="*.tsx"
grep -rn "// @ts-ignore\|console.log" src/[模块]/ --include="*.ts" --include="*.tsx"
```

#### 1.2 DRY原则分析

识别重复代码：
- 相同逻辑出现3次以上
- 结构相似但变量名不同的代码
- 不同文件实现相同功能

#### 1.3 输出扫描报告

```markdown
## [模块名] 代码分析报告

### 扫描范围
- backend: src-tauri/src/[模块]/
- frontend: src/[模块]/

### 发现的问题

| 类型 | 数量 | 严重性 |
|------|------|--------|
| TODO/FIXME | X个 | 🟡中 |
| unwrap()无处理 | X个 | 🔴高 |
| DRY违规 | X处 | 🟡中 |
| 安全问题 | X个 | 🔴高 |

### 问题详情

#### 🔴 高优先级问题
- [问题1描述及位置]
- [问题2描述及位置]

#### 🟡 中优先级问题
- [问题描述及位置]
```

---

### 第二步：根据分析结果生成task.json

**读取当前task.json获取下一个可用ID：**

```bash
# 获取当前最大task ID
grep -o '"id": [0-9]*' task.json | sort -t: -k2 -n | tail -1
```

**根据分析结果生成任务条目：**

```json
{
  "id": [下一个可用ID],
  "epic": "[Epic X]",
  "story": "[Story X.X]",
  "title": "[基于分析结果的优化任务标题]",
  "description": "[基于分析结果的详细描述]",
  "implementationType": "optimize|refactor|fix",
  "phase": "Phase X - 迭代名称",
  "priority": "[critical|high|medium|low]",
  "backendRequired": true|false,
  "existingCode": {
    "frontend": ["相关前端文件"],
    "backend": ["相关后端文件"],
    "note": "[分析发现的问题总结]"
  },
  "openspec_change": "[待生成的openspec名称]",
  "steps": [
    "[基于分析结果的修复步骤1]",
    "[修复步骤2]",
    "[修复步骤3]"
  ],
  "frs_covered": [],
  "nfrs_covered": ["NFR1"],
  "arch_covered": ["ARCH-01"],
  "ux_covered": [],
  "dependencies": [],
  "passes": false
}
```

**生成多个任务时：**

```markdown
## 生成的task.json任务

### 元数据更新

```json
{
  "lastUpdated": "[日期]",
  "activeNote": "新增X个优化任务：[模块名]代码优化"
}
```

### 新增任务

**Task [ID]: [任务标题]**
```json
{
  "id": [ID],
  "title": "[标题]",
  "description": "[描述]",
  "priority": "[优先级]",
  "steps": ["步骤1", "步骤2"],
  ...
}
```

[重复为每个分析出的问题生成任务...]
```

**将任务写入task.json：**
1. 读取当前task.json
2. 将新任务追加到tasks数组末尾
3. 更新元数据（version、lastUpdated、activeNote）
4. 保存task.json

---

### 第三步：生成/检查OpenSpec Change

**为每个新生成的任务创建OpenSpec：**

#### 3.1 检查OpenSpec是否已存在

```bash
ls openspec/changes/[openspec_change]/
```

#### 3.2 如果OpenSpec不存在，使用openspec-propose生成

```
使用 openspec-propose skill 为任务生成OpenSpec：
- 任务ID：[ID]
- 任务标题：[标题]
- 分析发现的问题：[问题列表]
- 建议的解决方案：[步骤]
```

**生成的OpenSpec目录结构：**
```
openspec/changes/[openspec_change]/
├── proposal.md    # 提案文档
├── design.md      # 设计文档  
├── tasks.md       # 任务分解
└── specs/
    └── spec.md    # 详细规格
```

#### 3.3 OpenSpec内容模板

**proposal.md:**
```markdown
# [任务标题]

## 概述
[基于分析报告的概述]

## 问题分析
- 问题1：[描述]
- 问题2：[描述]

## 解决方案
[基于分析结果的解决方案]

## 影响范围
- [相关文件列表]

## PRD对齐
- [ARCH编号]
- [DRY/KISS原则应用说明]
```

**tasks.md:**
```markdown
## 实施任务

### 任务分解

| # | 任务 | 验证方法 |
|---|------|---------|
| 1 | [任务1] | [验证命令] |
| 2 | [任务2] | [验证命令] |

### 验收标准
- [ ] [标准1]
- [ ] [标准2]
```

---

### 第四步：执行OpenSpec变更

**使用openspec-apply-change skill执行：**

```
检测到OpenSpec已生成：openspec/changes/[openspec_change]/
使用 openspec-apply-change skill 执行...

执行步骤：
1. 读取 openspec/changes/[openspec_change]/
2. 按tasks.md中的任务分解执行
3. 每完成一个步骤执行验证
4. 完成后更新task.json
```

**执行验证命令：**
```bash
# 每个步骤完成后执行
cargo clippy -- -D warnings
npm run lint
cargo build
```

---

### 第五步：更新task.json

**任务完成后更新：**

1. 找到对应ID的任务
2. 将`passes`改为`true`
3. 更新`lastUpdated`
4. 保存task.json

```markdown
## 任务完成

**Task [ID] 已完成**
- 验证通过：cargo clippy, npm run lint, cargo build
- 更新task.json：passes = true
```

---

### 第六步：记录实施情况到progress.txt

**读取progress.txt格式，追加新记录：**

```bash
# 读取progress.txt末尾，确认格式
tail -30 progress.txt
```

**追加记录模板：**

```markdown
## [日期 YYYY-MM-DD] - Task [ID]: [任务标题]

### 铁律合规检查：
- PRD 合规：[FR编号]
- 架构合规：[ARCH编号]
- UX 合规：[UX编号]

### 代码分析：
- 发现问题：X个（TODO: X, unwrap: X, DRY违规: X, 安全问题: X）
- 严重性分布：🔴高 X个, 🟡中 X个, 🟢低 X个

### 实施内容：
- 分析范围：[扫描的目录]
- 生成任务：[task.json任务ID]
- OpenSpec变更：[openspec_change名称]
- 具体修改：
  - [修改1]
  - [修改2]

### 验证结果：
- cargo clippy：✅ 通过
- npm run lint：✅ 通过
- cargo build：✅ 成功

### 遗留问题：
- [如有遗留问题，记录原因]

### 注意事项：
- [供后续agent参考的信息]
```

**写入progress.txt：**
1. 读取当前progress.txt
2. 在文件末尾追加新记录
3. 保持现有格式一致性

---

## 三、完整执行示例

### 示例：优化agent模块

**用户说：** "优化agent模块的代码"

**Agent响应：**

```
收到。将对agent模块进行代码分析，生成优化任务，执行迭代优化。

【Step 1】分析代码问题
扫描范围：src-tauri/src/agent/, src/features/agent/

发现的问题：
| 类型 | 数量 | 严重性 |
|------|------|--------|
| TODO/FIXME | 5个 | 🟡中 |
| unwrap()无处理 | 8个 | 🔴高 |
| DRY违规 | 3处 | 🟡中 |
| 安全问题 | 1个 | 🔴高 |

【Step 2】生成task.json任务
- Task 221: 消除unwrap()调用（critical）
- Task 222: DRY优化-统一错误处理（high）
- Task 223: 消除TODO遗留（medium）

[已写入task.json]

【Step 3】生成OpenSpec
- agent-unwrap-elimination/
- agent-error-handling-dry/
- agent-todo-cleanup/

【Step 4】执行OpenSpec
开始执行Task 221...
[执行中...]

【Step 5】更新task.json
Task 221 passes = true

继续执行Task 222...
[执行中...]

Task 222 passes = true

【Step 6】记录实施情况到progress.txt

agent模块优化完成！
```

---

## 四、决策树

```
用户触发优化迭代
    │
    ▼
【Step 1】分析代码问题
    │
    ├─→ 扫描TODO/FIXME/unwrap
    ├─→ DRY原则分析
    ├─→ 安全问题检查
    └─→ 输出分析报告
    │
    ▼
【Step 2】生成task.json
    │
    ├─→ 读取当前最大ID
    ├─→ 根据问题生成任务
    ├─→ 按优先级排序
    └─→ 写入task.json
    │
    ▼
【Step 3】生成/检查OpenSpec
    │
    ├─→ 检查OpenSpec是否存在
    ├─→ 不存在 → openspec-propose生成
    └─→ 存在 → 直接使用
    │
    ▼
【Step 4】执行openspec-apply-change
    │
    ├─→ 按tasks.md执行
    ├─→ 验证通过
    └─→ 直到完成
    │
    ▼
【Step 5】更新task.json
    │
    ├─→ passes = true
    └─→ 更新lastUpdated
    │
    ▼
【Step 6】记录progress.txt
    │
    └─→ 追加实施记录到progress.txt
```

---

## 五、与其他Skill的配合

### 5.1 openspec-propose

为生成的任务创建OpenSpec：
```
使用 openspec-propose skill 为新任务生成 openspec/changes/[name]/
```

### 5.2 openspec-apply-change

执行任务实现：
```
读取 openspec/changes/[name]/
按tasks.md执行 → 验证 → 完成后更新task.json
```

### 5.3 openspec-explore

只需要分析，不需要生成任务：
```
使用 openspec-explore skill 进行探索式分析
输出分析报告，但不生成task.json
```

---

## 六、验证标准

**任务完成的验证标准：**

| 验证项 | 命令 | 标准 |
|--------|------|------|
| Rust编译 | `cargo build` | 成功无错误 |
| Rust检查 | `cargo clippy -- -D warnings` | 无警告 |
| TypeScript检查 | `npm run lint` | 无错误 |
| TypeScript构建 | `npm run build` | 成功 |
| 代码扫描 | 无分析中发现的TODO/unwrap遗留 | - |

---

## 七、执行检查清单

- [ ] 确定扫描范围（用户指定的模块）
- [ ] 执行代码扫描（TODO/FIXME/unwrap/DRY/安全）
- [ ] 输出分析报告
- [ ] 根据分析结果生成task.json任务
- [ ] 将任务写入task.json
- [ ] 为任务生成/检查OpenSpec change
- [ ] 使用openspec-apply-change执行
- [ ] 运行验证命令确认通过
- [ ] 更新task.json的passes状态
- [ ] 记录实施情况到progress.txt
- [ ] 提交git commit
