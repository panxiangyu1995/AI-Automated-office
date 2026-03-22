---
name: openspec-test-runner
description: 自动化测试运行器。从 to-test.json 获取未测试的任务，执行测试验证，标记完成状态，并记录 bug 修复信息到 debug.txt。使用此 skill 当用户要求运行测试、验证任务、或执行自动化测试流程时。
---

# OpenSpec Test Runner

自动化测试执行器，用于验证 OpenSpec 变更的测试验收标准。

## 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│                    自动化测试流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 读取 to-test.json                                  │
│     → 筛选 passes: false 或 status != "pass" 的任务         │
│     ↓                                                       │
│  Step 2: 选择下一个待测试任务                                │
│     → 按任务 ID 顺序                                         │
│     → 检查依赖关系是否满足                                   │
│     ↓                                                       │
│  Step 3: 读取 OpenSpec 变更文档                              │
│     → proposal.md / design.md / tasks.md / specs/spec.md    │
│     ↓                                                       │
│  Step 4: 执行测试验收                                        │
│     → Go/Rust 单元测试                                       │
│     → Go/Rust 集成测试                                       │
│     → E2E 测试 (Playwright)                                  │
│     → 前端构建测试                                           │
│     → 代码质量检查                                           │
│     ↓                                                       │
│  Step 5: 处理测试结果                                        │
│     ├── 通过 → 更新 to-test.json (passes: true)             │
│     └── 失败 → 修复 Bug → 记录到 debug.txt                   │
│     ↓                                                       │
│  Step 6: 更新进度文件                                        │
│     → progress.txt 记录工作内容                              │
│     → debug.txt 记录 Bug 修复（如有）                        │
│     ↓                                                       │
│  Step 7: 提交变更                                            │
│     → git commit 包含所有修改                                │
│     ↓                                                       │
│  Step 8: 返回 Step 2，处理下一个任务                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 执行步骤

### Step 1: 读取任务列表

读取 `to-test.json`，筛选待测试任务：

```json
{
  "id": 25,
  "epic": "Epic 2",
  "story": "Story 2.4",
  "title": "Direct manager relation",
  "test验收": {
    "status": "pending",
    "passes": false
  }
}
```

筛选条件：
- `passes: false` 或
- `test验收.status` 为 "pending" 或 "partial" 或 "not_run"

### Step 2: 选择任务

优先级规则：
1. 按 ID 升序
2. 检查依赖关系（tasks.md 中的 dependencies）
3. 选择第一个满足依赖的任务

### Step 3: 读取 OpenSpec 文档

从 `openspec/changes/<openspec_change>/` 读取：
- `proposal.md` - 变更提案
- `design.md` - 技术设计
- `tasks.md` - 任务清单
- `specs/spec.md` - 功能规格

### Step 4: 执行测试

**重要：首先检查测试是否存在！**

#### 4.0 测试缺失处理

在执行测试前，必须先检查测试内容是否存在：

1. **检查现有测试文件**：
   - Go 项目：检查 `cloud-server/internal/module/<module>/*_test.go` 文件
   - Rust 项目：检查 `src-tauri/src/**/*_test.rs` 或 `src-tauri/tests/` 目录
   - E2E 测试：检查 `tests/e2e/` 目录下的 spec 文件

2. **如果测试不存在或测试项为空**：
   - **根据 OpenSpec 文档创建测试**
   - 必须使用项目现有测试框架（参考 `tests/README.md`）
   - 测试必须尽可能贴近真实使用场景

3. **创建测试的原则**：
   - 基于 `specs/spec.md` 中的验收场景编写测试用例
   - 模拟真实的用户操作流程
   - 覆盖正常流程和异常流程
   - 包含边界条件测试
   - 对于 API 测试：模拟真实的请求/响应场景
   - 对于 UI 测试：模拟真实的用户交互（点击、输入、导航等）

4. **测试框架参考**：
   - Go 单元测试：使用标准 `testing` 包
   - Go 集成测试：使用 `testify` 断言库
   - Rust 测试：使用 `#[cfg(test)]` 和 `#[test]`
   - E2E 测试：使用 Playwright（参考 `playwright.config.ts`）
   - 前端单元测试：使用 Vitest（参考 `vitest.config.ts`）

5. **外部依赖配置获取**：
   如果测试需要外部 API Key、密钥等配置：
   
   **步骤 1**：读取 `file-for-test.md` 获取配置信息
   ```markdown
   # file-for-test.md 示例
   embedding模型提供商：本地ollama
   地址：http://localhost:11434
   模型id：nomic-embed-text
   Qdrant URL：https://xxx.hf.space
   Qdrant密钥：xxxx
   ```
   
   **步骤 2**：如果 `file-for-test.md` 中有所需配置，使用该配置运行测试
   
   **步骤 3**：如果 `file-for-test.md` 中没有所需配置，**停止执行**并询问用户：
   ```
   🚫 缺少测试配置 - 需要人工提供
   
   **当前任务**: [任务名称]
   **缺少的配置**: [具体说明需要什么配置]
   
   请提供以下配置信息：
   1. [配置项 1 名称]: [说明]
   2. [配置项 2 名称]: [说明]
   
   您可以将配置添加到 file-for-test.md 文件中，或直接在对话中提供。
   ```

#### 4.1 后端单元测试

**Go 项目：**
```bash
cd cloud-server && go test ./internal/module/<module>/... -v -coverprofile=coverage.out
```

**Rust 项目：**
```bash
cd src-tauri && cargo test --lib
```

#### 4.2 后端集成测试

**Go 项目：**
```bash
cd cloud-server && go test -tags=integration ./internal/module/<module>/...
```

**Rust 项目：**
```bash
cd src-tauri && cargo test --test '*'
```

#### 4.3 E2E 测试

```bash
npx playwright test tests/e2e/<category>/<test-file>.spec.ts
```

对于 UI 相关变更，**必须**在浏览器中测试：
- 使用 playwright mcp 工具
- 或使用 chrome devtools mcp 工具
- 验证页面正确加载和渲染
- 验证交互功能正常

#### 4.4 前端构建测试

```bash
npm run build
```

验证：
- TypeScript 编译无错误
- 构建产物生成成功

#### 4.5 代码质量检查

```bash
npm run lint
```

### Step 5: 更新测试状态

#### 测试通过

更新 `to-test.json`：
```json
{
  "id": 25,
  "test验收": {
    "status": "pass",
    "go单元测试": {
      "status": "pass",
      "coverage": "85%"
    },
    "passes": true
  }
}
```

#### 测试失败

1. **分析失败原因**
2. **修复 Bug**
3. **记录到 debug.txt**：
```markdown
## [2026-03-20] - Bug Fix: <任务标题>

### 任务信息
- Task ID: 25
- Epic: Epic 2
- Story: Story 2.4
- OpenSpec: epic-2-story-2-4-manager-relationship

### Bug 描述
<描述发现的 Bug>

### 根因分析
<分析 Bug 的根本原因>

### 修复方案
<描述修复方案>

### 修改的文件
- `path/to/file1.go` - 修改说明
- `path/to/file2.ts` - 修改说明

### 验证
- 单元测试：X 个测试通过
- 集成测试：通过
- 构建测试：通过

### 防止回归
<说明如何防止此 Bug 再次出现>
```

4. **重新运行测试**

### Step 6: 更新进度文件

#### progress.txt

```markdown
## [2026-03-20] - Task: <任务标题> (<openspec_change>)

### 铁律合规检查：
- PRD 合规：[FR-XX - 功能描述]
- 架构合规：[ADR-XX - 架构约束]
- UX 合规：[UX-XX - 设计规范]
- Epic 合规：Epic X / Story X.X

### What was done:
- <具体完成的工作>
- <修改的文件>

### Testing:
- 单元测试：X 个测试通过
- 集成测试：通过
- E2E 测试：通过
- 构建测试：通过

### Notes:
- <注意事项>
```

### Step 7: 提交变更

**重要：所有变更必须在同一个 commit 中提交！**

```bash
git add .
git commit -m "[测试]+[系统模块]+[任务名称验证通过]"
```

提交信息规范：
- `[测试]+[后端]+[登录API测试通过]`
- `[测试]+[前端]+[用户管理页面E2E测试通过]`
- `[修复]+[后端]+[修复权限检查逻辑Bug]`

## 测试命令参考

### Go 测试命令

```bash
# 运行所有单元测试
cd cloud-server && go test ./... -v

# 运行特定模块测试
cd cloud-server && go test ./internal/module/auth/... -v

# 运行集成测试
cd cloud-server && go test -tags=integration ./...

# 查看覆盖率
cd cloud-server && go test ./... -coverprofile=coverage.out && go tool cover -html=coverage.out
```

### Rust 测试命令

```bash
# 运行单元测试
cd src-tauri && cargo test --lib

# 运行集成测试
cd src-tauri && cargo test --test '*'

# 运行特定测试
cd src-tauri && cargo test --test session_integration_test
```

### 前端测试命令

```bash
# 运行所有 E2E 测试
npx playwright test

# 运行特定测试文件
npx playwright test tests/e2e/auth/login.spec.ts

# 运行 lint
npm run lint

# 运行构建
npm run build
```

## 状态定义

| 状态 | 含义 |
|------|------|
| `not_run` | 未运行测试 |
| `pending` | 待执行 |
| `partial` | 部分通过（有些测试跳过或需要特定环境） |
| `pass` | 全部通过 |
| `fail` | 测试失败 |

## 注意事项

1. **测试优先级**：单元测试 → 集成测试 → E2E 测试 → 构建测试
2. **UI 变更必须浏览器测试**：新建页面或大幅修改 UI 必须使用浏览器验证
3. **一个任务一个 commit**：所有变更（代码、to-test.json、progress.txt、debug.txt）在同一 commit
4. **依赖检查**：确保前置任务已完成
5. **阻塞处理**：遇到无法解决的问题时，停止并输出阻塞信息

## 阻塞处理

如果遇到以下情况，停止执行并输出阻塞信息：

### 1. 测试内容缺失

如果 OpenSpec 中定义的功能尚未实现或测试文件不存在：
```
🚫 测试阻塞 - 功能未实现

**当前任务**: [任务名称]
**阻塞原因**: 功能代码尚未实现，无法进行测试

**需要先完成**:
1. 根据 OpenSpec 文档实现功能代码
2. 完成后再执行测试验证
```

### 2. 配置信息缺失

如果测试需要外部配置但 `file-for-test.md` 中没有：
```
🚫 测试阻塞 - 缺少配置

**当前任务**: [任务名称]
**缺少的配置**: [具体说明需要什么配置，如 API Key、URL 等]

**解决方式**:
方式一：将配置添加到 file-for-test.md 文件中
方式二：在对话中直接提供配置信息

请提供以下配置：
- [配置项 1]: [说明用途]
- [配置项 2]: [说明用途]
```

### 3. 环境问题

- 外部依赖不可用：第三方服务宕机、需要人工授权
- 测试环境问题：Tauri 运行时不可用、数据库连接失败

```
🚫 测试阻塞 - 环境问题

**当前任务**: [任务名称]
**阻塞原因**: [具体说明环境问题]

**需要人工帮助**:
1. [步骤 1]
2. [步骤 2]
```

### 阻塞处理原则

- **不要跳过**：遇到阻塞必须停止，不能跳过继续执行
- **不要猜测**：不要猜测配置信息，必须从 file-for-test.md 或用户获取
- **记录状态**：在 progress.txt 中记录阻塞信息
- **不要提交**：阻塞状态下不要提交 git commit

## 文件位置

- 任务列表：`to-test.json`
- 进度记录：`progress.txt`
- Bug 记录：`debug.txt`
- OpenSpec 变更：`openspec/changes/<openspec_change>/`
- 测试配置：`file-for-test.md`
- 测试框架说明：`tests/README.md`

## 测试创建指南

### 从 OpenSpec 创建测试

当测试不存在时，按照以下步骤创建：

#### 1. 分析 OpenSpec 文档

从 `specs/spec.md` 提取：
- **验收场景**：每个 Scenario 对应一个测试用例
- **输入输出**：定义测试的输入数据和期望输出
- **边界条件**：定义边界测试用例
- **错误处理**：定义异常场景测试用例

#### 2. 选择测试类型

| 场景类型 | 推荐测试类型 |
|----------|-------------|
| API 端点测试 | Go 单元测试 + 集成测试 |
| 业务逻辑测试 | Go 单元测试 |
| 数据库操作测试 | Go 集成测试 |
| 前端组件测试 | Vitest 单元测试 |
| 用户交互流程 | Playwright E2E 测试 |
| 全链路流程 | E2E 测试 |

#### 3. 编写真实场景测试

**原则：测试应该模拟真实用户行为**

```go
// ✅ 好的测试：模拟真实登录场景
func TestLogin_Success(t *testing.T) {
    // 1. 准备真实用户数据
    user := createTestUser(t, "testuser", "password123")
    
    // 2. 发送真实的登录请求
    req := LoginRequest{
        Username: "testuser",
        Password: "password123",
    }
    resp, err := authService.Login(ctx, req)
    
    // 3. 验证响应符合预期
    assert.NoError(t, err)
    assert.NotEmpty(t, resp.AccessToken)
    assert.Equal(t, user.ID, resp.User.ID)
}

// ❌ 不好的测试：只测试函数返回值
func TestLogin_ReturnsToken(t *testing.T) {
    // 只 mock 了返回值，没有测试真实流程
    mockService.On("Login").Return(&LoginResponse{Token: "xxx"}, nil)
    // ...
}
```

#### 4. E2E 测试场景设计

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('登录流程', () => {
  test('用户可以成功登录', async ({ page }) => {
    // 1. 访问登录页面
    await page.goto('/login');
    
    // 2. 填写真实表单
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'password123');
    
    // 3. 点击登录按钮
    await page.click('button[type="submit"]');
    
    // 4. 验证跳转到主页
    await expect(page).toHaveURL('/dashboard');
    
    // 5. 验证用户信息显示
    await expect(page.locator('.user-name')).toContainText('Test User');
  });
  
  test('密码错误显示友好提示', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 验证错误提示
    await expect(page.locator('.error-message')).toContainText('用户名或密码错误');
  });
});
```

#### 5. 测试文件命名规范

| 测试类型 | 文件位置 | 命名规范 |
|----------|----------|----------|
| Go 单元测试 | `cloud-server/internal/module/<module>/` | `<file>_test.go` |
| Go 集成测试 | `cloud-server/internal/module/<module>/integration/` | `<feature>_integration_test.go` |
| Rust 单元测试 | `src-tauri/src/<module>/` | 内联 `#[test]` |
| Rust 集成测试 | `src-tauri/tests/` | `<feature>_test.rs` |
| E2E 测试 | `tests/e2e/<category>/` | `<feature>.spec.ts` |
| 前端单元测试 | `src/<feature>/` | `<file>.test.ts` |
