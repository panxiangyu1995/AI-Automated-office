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
  1. 检查代码实现与PRD文档的差距（首要维度）
  2. 分析代码问题（6大维度）
     - 代码质量问题（含TODO分类）
     - 前后端集成问题（命令契约/API类型/错误处理）
     - 云端集成问题（API配置/同步/离线/认证）
     - 业务逻辑问题（边界条件/状态机/并发/一致性）
     - 安全漏洞（注入/XSS/权限/敏感数据泄露）
     - UX/交互反人类问题（反馈/确认/路径/快捷键/空状态）
  3. 根据分析结果生成task.json任务条目
  4. 为任务生成/检查OpenSpec change
  5. 使用openspec-apply-change执行
  6. 更新task.json passes状态
  7. 记录实施情况到progress.txt

  如果用户只想做代码分析（不生成任务），请使用openspec-explore skill。
  如果用户只想读取现有task.json执行，请使用openspec-apply-change skill。
compatibility: 需要访问 _bmad-output/planning-artifacts/ 目录、openspec CLI
metadata:
  author: AI-Automated-office
  version: "4.0"
  language: zh
---

# PRD驱动优化迭代执行器

**目标：** 先分析代码问题，根据分析结果生成task.json任务，再执行OpenSpec变更完成迭代优化。

**核心工作流：**
```
分析代码问题（7大维度：0首要+6核心）→ 生成task.json → 生成OpenSpec → 执行实现 → 更新task.json → 记录progress.txt
```

**7大分析维度（第0维度为首要维度）：**
0. **PRD需求覆盖度检查（首要维度）** - 检查代码实现与PRD文档的差距
1. 代码质量问题（TODO/FIXME/unwrap/DRY，含TODO分类）
2. 前后端集成问题（命令契约/API类型/错误处理）
3. 云端集成问题（API配置/同步/离线/认证）
4. 业务逻辑问题（边界条件/状态机/并发/一致性）
5. 安全漏洞（注入/XSS/权限/敏感数据泄露）
6. UX/交互反人类问题（反馈/确认/路径/快捷键/空状态）

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
- 确定前后端文件范围：前端(Frontend)、后端(Tauri/Rust)、云端(Cloud/API)

#### 0.1 PRD需求覆盖度检查（首要维度）

**重要性：** 在分析任何代码问题前，必须先确认代码实现与PRD需求的差距。这是迭代优化的基准线。

**执行步骤：**

```bash
# Step 1: 读取PRD文档，获取该模块对应的FR编号
# PRD文档位置：_bmad-output/planning-artifacts/prd.md
# 搜索模块相关需求，如 "agent"、"工具系统"、"记忆" 等关键词

# Step 2: 扫描代码实现，识别已实现的功能
grep -rn "fn\|struct\|impl\|pub" src-tauri/src/[模块]/ --include="*.rs"
grep -rn "function\|const\|interface\|export" src/[模块]/ --include="*.ts" --include="*.tsx"

# Step 3: 交叉对比，输出覆盖度报告
```

**TODO分类标准：**

| 分类 | 定义 | 处理方式 |
|------|------|----------|
| **PRD内** | TODO对应PRD中定义的FR需求 | 必须实现，生成task.json任务 |
| **PRD后续** | TODO是PRD中未包含但合理的功能建议 | 记录到"后续迭代"清单，暂不实现 |
| **不必实现** | TODO是过度设计/YAGNI违规/已过时的需求 | 直接删除，不计入任务 |

**PRD覆盖度分析输出模板：**

```markdown
### 第零维度：PRD需求覆盖度检查

#### 扫描范围
- 模块：[模块名称]
- PRD参考：_bmad-output/planning-artifacts/prd.md
- 代码范围：
  - Backend: src-tauri/src/[模块]/
  - Frontend: src/[模块]/

#### PRD需求列表（该模块相关FR）
| FR编号 | 需求描述 | 状态 | 代码位置 | 说明 |
|--------|----------|------|----------|------|
| FR-XX | [需求1] | ✅已实现 | [文件:行号] | - |
| FR-XX | [需求2] | ⚠️部分实现 | [文件:行号] | 缺少[某个功能] |
| FR-XX | [需求3] | ❌未实现 | - | - |

#### TODO分类统计
| 分类 | 数量 | 说明 |
|------|------|------|
| **PRD内** | X个 | 必须实现，已加入任务清单 |
| **PRD后续** | X个 | 合理但非当前迭代范围 |
| **不必实现** | X个 | YAGNI违规/已过时/过度设计 |

#### PRD内TODO详情（必须实现）
| 位置 | TODO内容 | 对应FR | 实现建议 |
|------|----------|--------|----------|
| [文件:行号] | [TODO描述] | FR-XX | [实现方案] |

#### PRD后续TODO详情（暂不实现）
| 位置 | TODO内容 | 分析理由 |
|------|----------|----------|
| [文件:行号] | [TODO描述] | [为何不是当前优先级] |

#### 不必实现TODO详情（可直接删除）
| 位置 | TODO内容 | 移除理由 |
|------|----------|----------|
| [文件:行号] | [TODO描述] | [YAGNI/过时/过度设计] |
```

**关键原则：**
- TODO分类必须对照PRD文档，不能凭主观判断
- 优先确保PRD定义的FR都已实现或计划实现
- 严格遵循YAGNI原则：不是PRD需求的，原则上不实现
- 只有PRD后续分类的TODO需要人工确认后才可延后

#### 1.1 执行代码扫描

**基础代码扫描：**
```bash
# Rust代码扫描
grep -rn "TODO\|FIXME\|XXX\|HACK" src-tauri/src/[模块]/ --include="*.rs"
grep -rn "unwrap()\|expect(" src-tauri/src/[模块]/ --include="*.rs"
grep -rn "unsafe\|println!\|dbg!" src-tauri/src/[模块]/ --include="*.rs"

# TypeScript代码扫描
grep -rn "TODO\|FIXME\|XXX\|HACK" src/[模块]/ --include="*.ts" --include="*.tsx"
grep -rn "// @ts-ignore\|console.log" src/[模块]/ --include="*.ts" --include="*.tsx"
```

**TODO分类分析：**

```bash
# 提取所有TODO及其上下文（用于PRD对照分析）
grep -rn -B2 -A2 "TODO\|FIXME" src-tauri/src/[模块]/ --include="*.rs"
grep -rn -B2 -A2 "TODO\|FIXME" src/[模块]/ --include="*.ts" --include="*.tsx"
```

**TODO分类决策树：**

```
发现TODO
    │
    ▼
该TODO对应的功能是否在PRD文档中有定义？
    │
    ├─→ 是（FR编号）→ PRD内TODO → 生成task.json任务
    │
    ├─→ 否 → 该功能是否合理/有价值？
    │    │
    │    ├─→ 是（合理但非当前迭代）→ PRD后续TODO → 记录清单
    │    │
    │    └─→ 否（YAGNI/过时/过度设计）→ 不必实现TODO → 直接删除
    │
    └─→ 不确定 → 标记为"需人工确认"
```

#### 1.2 DRY原则分析

识别重复代码：
- 相同逻辑出现3次以上
- 结构相似但变量名不同的代码
- 不同文件实现相同功能

#### 1.3 前后端集成问题分析

**检查前后端契约一致性：**
```bash
# 检查Tauri命令定义 vs 前端调用
grep -rn "invoke\|command" src/[模块]/ --include="*.ts" --include="*.tsx"
grep -rn "#\[tauri::command\]" src-tauri/src/[模块]/ --include="*.rs"

# 检查类型定义一致性
grep -rn "interface\|type\|class" src/[模块]/types/ --include="*.ts"
grep -rn "struct\|enum" src-tauri/src/[模块]/ --include="*.rs"
```

**识别集成问题：**
- 命令名称不匹配（前端调用 vs 后端定义）
- 参数类型不一致（TS类型 vs Rust类型）
- 返回值结构不匹配
- 错误处理不一致（前端期望 vs 后端返回）
- 异步处理差异（Promise vs Result）
- 缺少必要的命令导出

#### 1.4 云端集成问题分析

**检查API调用层：**
```bash
# 检查API调用
grep -rn "fetch\|axios\|api\." src/lib/ --include="*.ts"
grep -rn "BASE_URL\|API_URL\|endpoint" src/[模块]/ --include="*.ts"

# 检查云端同步逻辑
grep -rn "sync\|upload\|download\|pull\|push" src-tauri/src/[模块]/ --include="*.rs"
grep -rn "sync\|offline\|online\|connectivity" src/[模块]/ --include="*.ts" --include="*.tsx"
```

**识别云端集成问题：**
- API端点配置缺失或错误
- 认证/鉴权token处理不一致
- 网络错误处理不完善
- 离线场景未处理
- 数据同步冲突未处理
- 超时/重试逻辑缺失
- 请求/响应拦截器缺失

#### 1.5 业务逻辑问题分析

**检查业务规则实现：**
```bash
# 检查业务规则/验证
grep -rn "validate\|verify\|check\|assert" src/[模块]/ --include="*.ts" --include="*.tsx"
grep -rn "validate\|verify\|check" src-tauri/src/[模块]/ --include="*.rs"

# 检查状态机/流程控制
grep -rn "state\|status\|flow\|process" src/[模块]/ --include="*.ts" --include="*.tsx"
grep -rn "State\|Status" src-tauri/src/[模块]/ --include="*.rs"
```

**识别业务逻辑问题：**
- 边界条件未处理
- 状态转换缺少校验
- 业务规则分散/重复
- 并发控制缺失
- 事务边界不清晰
- 数据一致性保证缺失

#### 1.6 UX/交互反人类问题分析

**检查用户体验问题：**
```bash
# 检查加载状态
grep -rn "loading\|spinner\|skeleton\|placeholder" src/[模块]/ --include="*.tsx"

# 检查错误提示
grep -rn "error\|Error\|alert\|toast\|notification" src/[模块]/ --include="*.tsx"

# 检查表单交互
grep -rn "onChange\|onSubmit\|onClick\|disabled\|readonly" src/[模块]/ --include="*.tsx"
```

**识别UX反人类问题：**
- 加载中无反馈（无spinner/骨架屏）
- 错误信息不友好（显示技术错误而非用户友好信息）
- 操作无确认（删除/修改无二次确认）
- 表单验证时机不当（提交后才提示）
- 必填项未标注
- 按钮状态混乱（可点击但实际不可用）
- 操作路径过长（需要多步才能完成任务）
- 缺少快捷操作/快捷键
- 导航层级过深
- 数据分页/搜索不直观
- 空状态无引导
- 移动端适配问题

#### 1.6 安全漏洞分析

**检查认证鉴权：**
```bash
# 检查JWT/token处理
grep -rn "token\|jwt\|auth\|bearer" src/lib/ --include="*.ts"
grep -rn "Authorization\|Bearer" src/[模块]/ --include="*.ts" --include="*.tsx"

# 检查密码/敏感数据处理
grep -rn "password\|secret\|credential\|api_key\|apikey" src/ --include="*.ts" --include="*.tsx"
grep -rn "password\|secret\|credential" src-tauri/src/ --include="*.rs"
```

**检查输入验证与SQL注入：**
```bash
# 检查原始SQL拼接
grep -rn "SELECT\|INSERT\|UPDATE\|DELETE" src-tauri/src/[模块]/ --include="*.rs"
grep -rn "query\|execute" src-tauri/src/[模块]/ --include="*.rs"

# 检查用户输入处理
grep -rn "innerHTML\|dangerouslySetInnerHTML" src/[模块]/ --include="*.tsx"
grep -rn "eval\|new Function\|script" src/[模块]/ --include="*.ts" --include="*.tsx"
```

**检查XSS/CSRF防护：**
```bash
# 检查XSS风险
grep -rn "innerHTML\|dangerouslySetInnerHTML" src/[模块]/ --include="*.tsx"
grep -rn "localStorage\|sessionStorage" src/[模块]/ --include="*.ts" --include="*.tsx"

# 检查CORS配置
grep -rn "CORS\|Access-Control-Allow-Origin" src-tauri/src/ --include="*.rs"
```

**检查权限控制：**
```bash
# 检查权限验证
grep -rn "permission\|authorize\|role\|admin\|root" src-tauri/src/[模块]/ --include="*.rs"
grep -rn "role\|permission\|isAdmin" src/[模块]/ --include="*.ts" --include="*.tsx"
```

**识别安全漏洞：**
- 敏感信息硬编码（API密钥、密码、token明文存储）
- SQL注入风险（原始SQL拼接而非参数化查询）
- XSS漏洞（用户输入未转义直接渲染）
- CSRF漏洞（缺少token验证）
- 权限绕过（关键操作缺少权限校验）
- 敏感数据泄露（localStorage存token、错误信息泄露敏感路径）
- 不安全的随机数（用于安全用途）
- 加密算法不安全（使用已知不安全的算法）

#### 1.7 输出分析报告

```markdown
## [模块名] 代码分析报告

### 扫描范围
- backend: src-tauri/src/[模块]/
- frontend: src/[模块]/
- cloud: src/lib/api.ts, cloud-server/
- PRD: _bmad-output/planning-artifacts/prd.md

### 第零维度：PRD需求覆盖度检查

#### PRD需求实现状态
| FR编号 | 需求描述 | 实现状态 | 代码位置 | 差距说明 |
|--------|----------|----------|----------|----------|
| FR-XX | [需求1] | ✅已实现 | [文件:行号] | - |
| FR-XX | [需求2] | ⚠️部分实现 | [文件:行号] | 缺少[某个功能] |
| FR-XX | [需求3] | ❌未实现 | - | - |

#### TODO分类汇总
| 分类 | 数量 | 处理方式 |
|------|------|----------|
| **PRD内** | X个 | 必须实现，已加入任务清单 |
| **PRD后续** | X个 | 暂不实现，记录后续迭代清单 |
| **不必实现** | X个 | 直接删除 |

#### PRD内TODO详情
| 位置 | TODO内容 | 对应FR | 优先级 |
|------|----------|--------|--------|
| [文件:行号] | [TODO描述] | FR-XX | 🔴高/🟡中/🟢低 |

#### PRD后续TODO详情
| 位置 | TODO内容 | 延后理由 |
|------|----------|----------|
| [文件:行号] | [TODO描述] | [合理性分析] |

#### 不必实现TODO详情
| 位置 | TODO内容 | 移除理由 |
|------|----------|----------|
| [文件:行号] | [TODO描述] | [YAGNI/过时/过度设计] |

### 一、代码质量问题

| 类型 | 数量 | 严重性 |
|------|------|--------|
| TODO/FIXME | X个 | 🟡中 |
| unwrap()无处理 | X个 | 🔴高 |
| DRY违规 | X处 | 🟡中 |
| 安全漏洞 | X个 | 🔴高 |

### 二、前后端集成问题

| 问题 | 位置 | 严重性 | 影响 |
|------|------|--------|------|
| [问题描述] | [文件:行号] | 🔴/🟡 | [影响描述] |

**常见集成问题类型：**
- 命令名称不一致
- 参数类型不匹配
- 缺少错误处理
- 异步处理差异

### 三、云端集成问题

| 问题 | 位置 | 严重性 | 影响 |
|------|------|--------|------|
| [问题描述] | [文件:行号] | 🔴/🟡 | [影响描述] |

**常见云端问题类型：**
- API端点配置错误
- 网络错误处理缺失
- 离线场景未处理
- 认证token处理不一致
- 数据同步冲突

### 四、业务逻辑问题

| 问题 | 位置 | 严重性 | 影响 |
|------|------|--------|------|
| [问题描述] | [文件:行号] | 🔴/🟡 | [影响描述] |

**常见业务逻辑问题：**
- 边界条件未处理
- 状态转换缺少校验
- 并发控制缺失
- 数据一致性不保证

### 五、安全漏洞

| 问题 | 位置 | 严重性 | 风险 |
|------|------|--------|------|
| [问题描述] | [文件:行号] | 🔴/🟡 | [安全风险描述] |

**常见安全漏洞类型：**
- 敏感信息硬编码（API密钥、密码、token明文）
- SQL注入风险（原始SQL拼接）
- XSS漏洞（用户输入未转义）
- CSRF漏洞（缺少token验证）
- 权限绕过（关键操作缺少权限校验）
- 敏感数据泄露（localStorage存token）
- 不安全的随机数
- 加密算法不安全

### 六、UX/交互反人类问题

| 问题 | 位置 | 严重性 | 用户影响 |
|------|------|--------|---------|
| [问题描述] | [文件:行号] | 🔴/🟡 | [用户困扰描述] |

**常见UX问题类型：**
- 🔴 无加载反馈
- 🔴 错误信息不友好
- 🔴 操作无确认
- 🟡 表单验证时机不当
- 🟡 按钮状态混乱
- 🟡 操作路径过长
- 🟡 缺少快捷操作
- 🟡 空状态无引导

### 七、问题汇总

| 严重性 | 数量 |
|--------|------|
| 🔴 高 | X个 |
| 🟡 中 | X个 |
| 🟢 低 | X个 |

**P0问题（安全/阻塞问题）：**
1. [问题1]
2. [问题2]

**P1问题（影响体验）：**
1. [问题1]
2. [问题2]

**P2问题（可优化）：**
1. [问题1]
2. [问题2]

**任务生成建议：**
- 🔴 P0问题 → 立即生成task.json任务，优先执行
- 🟡 P1问题 → 生成task.json任务，排入迭代计划
- 🟢 P2问题 → 可选实现，资源允许时处理
- PRD后续TODO → 记录到后续迭代清单，需人工确认后才延后
- 不必实现TODO → 直接删除，遵循YAGNI原则
```

---

### 第二步：根据分析结果生成task.json

**读取当前task.json获取下一个可用ID：**

```bash
# 获取当前最大task ID
grep -o '"id": [0-9]*' task.json | sort -t: -k2 -n | tail -1
```

**根据分析结果生成任务条目：**

**注意：** TODO分类决定任务生成策略：
- **PRD内TODO** → 必须生成task.json任务
- **PRD后续TODO** → 不生成任务，仅记录到后续清单（需人工确认后才延后）
- **不必实现TODO** → 直接删除，不生成任务

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
  "prdCoverage": {
    "frs": ["FR-XX"],  // 对应的PRD FR编号
    "todoCategory": "prd_inner|prd_future|not_needed",  // TODO分类
    "todoReason": "[分类理由]"
  },
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
  "frs_covered": ["FR-XX"],
  "nfrs_covered": ["NFR1"],
  "arch_covered": ["ARCH-01"],
  "ux_covered": [],
  "dependencies": [],
  "passes": false
}
```

**生成的多个任务时：**

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

【Step 1】分析代码问题（7大维度）

【第零维度】PRD需求覆盖度检查（首要）
扫描范围：src-tauri/src/agent/, src/features/agent/
PRD参考：_bmad-output/planning-artifacts/prd.md

PRD需求实现状态：
| FR编号 | 需求描述 | 状态 | 代码位置 |
|--------|----------|------|----------|
| FR-01 | Agent核心框架 | ✅已实现 | agent/mod.rs |
| FR-02 | LLM适配器 | ✅已实现 | agent/llm/ |
| FR-03 | 工具系统 | ⚠️部分实现 | agent/tools/ 缺少MCP支持 |
| FR-04 | 记忆系统 | ❌未实现 | - |

TODO分类：
| 分类 | 数量 | 说明 |
|------|------|------|
| **PRD内** | 3个 | 必须实现 |
| **PRD后续** | 2个 | 暂不实现 |
| **不必实现** | 1个 | 直接删除 |

【第一维度】代码质量问题
| 类型 | 数量 | 严重性 |
|------|------|--------|
| TODO/FIXME | 6个 | 🟡中 |
| unwrap()无处理 | 8个 | 🔴高 |
| DRY违规 | 3处 | 🟡中 |
| 安全问题 | 1个 | 🔴高 |

【Step 2】生成task.json任务
- Task 221: 消除unwrap()调用（critical，PRD内）
- Task 222: 实现记忆系统FR-04（critical，PRD内）
- Task 223: 消除TODO遗留-PRD内部分（medium，PRD内）
- Task 224: DRY优化-统一错误处理（high）
- [PRD后续TODO记录到后续清单，需人工确认]
- [不必实现TODO已直接删除]

[已写入task.json]

【Step 3】生成OpenSpec
- agent-unwrap-elimination/
- agent-memory-system/
- agent-todo-cleanup/
- agent-error-handling-dry/

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
【Step 1】分析代码问题（7大维度）
    │
    ├─→ 第零维度：PRD需求覆盖度检查（首要）
    │    │
    │    ├─→ 读取PRD文档，获取该模块相关FR编号
    │    ├─→ 扫描代码实现，对照FR检查覆盖度
    │    ├─→ TODO分类：
    │    │    ├─→ PRD内TODO → 必须实现
    │    │    ├─→ PRD后续TODO → 暂不实现（需人工确认）
    │    │    └─→ 不必实现 → 直接删除
    │    └─→ 输出PRD覆盖度报告
    │
    ├─→ 第一维度：代码质量问题（TODO/FIXME/unwrap/DRY）
    ├─→ 第二维度：前后端集成问题（命令契约/API类型/错误处理）
    ├─→ 第三维度：云端集成问题（API配置/同步/离线/认证）
    ├─→ 第四维度：业务逻辑问题（边界条件/状态机/并发/一致性）
    ├─→ 第五维度：安全漏洞（注入/XSS/权限/敏感数据泄露）
    └─→ 第六维度：UX/交互反人类问题（反馈/确认/路径/快捷键/空状态）
    │
    └─→ 输出6维度分析报告
    │
    ▼
【Step 2】生成task.json
    │
    ├─→ 读取当前最大ID
    ├─→ PRD内TODO → 必须生成任务
    ├─→ PRD后续TODO → 仅记录清单，不生成任务
    ├─→ 不必实现TODO → 直接删除
    ├─→ 根据其他维度问题生成任务（按优先级）
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

**第零维度（首要）：PRD需求覆盖度检查**
- [ ] 读取PRD文档，获取该模块相关的FR编号
- [ ] 扫描代码实现，识别已实现的功能
- [ ] 对比PRD需求与代码实现，输出覆盖度报告
- [ ] 对TODO进行分类：PRD内/PRD后续/不必实现
- [ ] PRD后续TODO记录到后续清单（需人工确认）
- [ ] 不必实现TODO直接删除

**6大核心维度**
- [ ] 执行代码质量问题扫描（TODO/FIXME/unwrap/DRY）
- [ ] 执行前后端集成问题分析（命令契约/API类型/错误处理）
- [ ] 执行云端集成问题分析（API配置/同步/离线/认证）
- [ ] 执行业务逻辑问题分析（边界条件/状态机/并发/一致性）
- [ ] 执行安全漏洞分析（注入/XSS/权限/敏感数据泄露）
- [ ] 执行UX/交互反人类问题分析（反馈/确认/路径/快捷键/空状态）
- [ ] 输出7维度分析报告

**后续步骤**
- [ ] 根据分析结果生成task.json任务
- [ ] 将任务写入task.json
- [ ] 为任务生成/检查OpenSpec change
- [ ] 使用openspec-apply-change执行
- [ ] 运行验证命令确认通过
- [ ] 更新task.json的passes状态
- [ ] 记录实施情况到progress.txt
- [ ] 提交git commit
