name: openspec-test-acceptance
description: 自动生成 OpenSpec 变更的测试验收标准。当用户想要为 OpenSpec changes 创建测试验收清单、生成测试验收标准、或输出到 to-test.json 时使用此 skill。触发短语包括："创建测试验收标准"、"生成验收清单"、"帮我给 xxx 的 openspec 创建测试验收" 等。
---

# OpenSpec Test Acceptance Generator

自动化生成 OpenSpec 变更对应的测试验收标准。

## 使用场景

- 用户需要为 Epic 的 OpenSpec changes 创建测试验收标准
- 输出格式为 `to-test.json`

## 工作流程

### Step 1: 扫描 OpenSpec Changes

扫描指定 Epic 的所有 OpenSpec 变更目录：

```
openspec/changes/epic-X-* 或 openspec/changes/epic-X-story-Y-*
```

对于每个变更，读取以下文件：
- `proposal.md` - 变更背景和目标
- `design.md` - 技术方案
- `tasks.md` - 任务列表
- `specs/spec.md` - 功能规格

### Step 2: 分析测试需求

根据文件内容，识别：

1. **Rust 相关测试**（如果有 Rust 代码变更）
   - 单元测试：`cargo test --lib`
   - 集成测试：`cargo test --test '*'`

2. **前端相关测试**（如果有前端代码变更）
   - E2E 测试：`npx playwright test`
   - 构建测试：`npm run build`
   - Lint 检查：`npm run lint`

3. **手动测试检查项**（根据功能规格）
   - 功能测试
   - 安全测试
   - 性能测试
   - 兼容性测试

4. **代码质量检查**
   - 技术栈合规
   - 安全规范
   - 架构约束

### Step 3: 生成验收标准

按以下 JSON 结构生成：

```json
{
  "id": <task_id>,
  "epic": "<epic_name>",
  "story": "<story_name>",
  "title": "<task_title>",
  "openspec_change": "<change_name>",
  "test验收": {
    "status": "pending | partial | pass | fail",
    "rust单元测试": {
      "status": "not_run | pass | fail",
      "command": "cd src-tauri && cargo test --lib <module>",
      "items": [
        {
          "name": "<测试项名称>",
          "test": "<测试函数名>",
          "status": "not_run | pass | fail"
        }
      ]
    },
    "rust集成测试": {
      "status": "not_run | pass | fail",
      "command": "cd src-tauri && cargo test --test <test_name>",
      "items": []
    },
    "e2e测试": {
      "status": "not_run | pass | fail | partial",
      "command": "npx playwright test <spec_path>",
      "items": []
    },
    "前端构建测试": {
      "status": "not_run | pass | fail",
      "command": "npm run build",
      "items": [
        {
          "name": "TypeScript 编译无错误",
          "status": "not_run | pass | fail"
        },
        {
          "name": "build 构建成功",
          "status": "not_run | pass | fail"
        }
      ]
    },
    "手动测试检查项": {
      "status": "pending",
      "items": [
        {
          "category": "<测试类别>",
          "checks": [
            {
              "name": "<检查项名称>",
              "expected": "<期望结果>"
            }
          ]
        }
      ]
    },
    "代码质量检查": {
      "status": "pending",
      "items": [
        {
          "name": "<检查项名称>",
          "check": "<检查内容>",
          "status": "pending | pass | fail"
        }
      ]
    }
  },
  "passes": false,
  "notes": "<备注信息>"
}
```

### Step 4: 输出到 to-test.json

将生成的验收标准追加到 `to-test.json` 文件的 `tasks` 数组中。

**注意**：
- 如果 task 已存在，更新其内容
- 保留已有的测试结果
- 只更新未填写的测试项

## 测试项命名规范

### Rust 单元测试
- 结构测试：`<struct_name>_struct_test`
- 方法测试：`<method_name>_test`
- 功能测试：`<feature>_test`

### E2E 测试
- 文件位置：`tests/e2e/<category>/<feature>.spec.ts`
- 测试描述：`<场景名称> - <具体测试>`

### 手动测试检查项
- 类别：功能测试、安全测试、性能测试、兼容性测试、UI测试
- 检查项：具体操作描述
- 期望：预期结果描述

## 示例

用户输入：
```
帮我给 epic2 的所有的 openspec changes 创建测试验收标准
输出到 to-test.json
```

执行流程：
1. 扫描 `openspec/changes/epic-2-*` 目录
2. 解析每个变更的文件内容
3. 根据变更类型生成对应测试项
4. 输出到 `to-test.json`
