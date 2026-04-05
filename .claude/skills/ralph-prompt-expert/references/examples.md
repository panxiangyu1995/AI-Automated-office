# Ralph Prompt 示例

**重要提示**：生成的命令必须保持在一行内，`--completion-promise` 和 `--max-iterations` 直接跟在任务描述字符串后面，不要拆成多行。

## 示例 A：提升测试覆盖率（TDD模式）

**用户输入**："帮我提高 `src/utils` 的测试覆盖率到 90%"

**生成的命令**：
```
/ralph-loop:ralph-loop "任务：提升测试覆盖率到 90%

### 1. 初始准备
- 生成时间戳（如 20250124_143052）
- 创建 .plan/fix_plan_{timestamp}.md 记录执行步骤

### 2. 执行
1. 运行覆盖率报告识别盲点
2. 为未覆盖代码编写测试用例
3. 运行测试并确保通过
4. 重复直到覆盖率 >= 90%
完成后输出 <promise>COVERAGE_ACHIEVED</promise>" --completion-promise "COVERAGE_ACHIEVED" --max-iterations 20
```

**关键点**：
- 明确的数字目标（90%）
- 自愈循环：识别盲点 → 编写测试 → 验证 → 重复
- 合理的迭代次数上限（避免无限循环）

---

## 示例 B：安全漏洞修复

**用户输入**："修复 SonarCloud 扫描出的 SQL 注入风险"

**生成的命令**：
```
/ralph-loop:ralph-loop "任务：修复 SQL 注入

### 1. 初始准备
- 生成时间戳（如 20250124_143052）
- 创建 .plan/fix_plan_{timestamp}.md 记录执行步骤

### 2. 执行
1. 定位漏洞代码
2. 使用参数化查询重构
3. 运行静态扫描工具验证修复
4. 确保不破坏原有逻辑
完成后输出 <promise>SECURITY_FIX_DONE</promise>" --completion-promise "SECURITY_FIX_DONE" --max-iterations 10
```

**关键点**：
- 验证驱动：修复后必须通过静态扫描
- 不破坏原有逻辑：保护现有功能
- 较低的迭代上限（此类任务通常较简单）

---

## 示例 C：文档自动化

**用户输入**："为所有 API 接口生成 OpenAPI 文档"

**生成的命令**：
```
/ralph-loop:ralph-loop "任务：生成 API 文档

### 1. 初始准备
- 生成时间戳（如 20250124_143052）
- 创建 .plan/fix_plan_{timestamp}.md 记录执行步骤

### 2. 执行
1. 扫描 src/api 获取路由
2. 生成 swagger.yaml
3. 运行文档校验器
4. 确保文档与代码 100% 同步
完成后输出 <promise>DOCS_GENERATED</promise>" --completion-promise "DOCS_GENERATED" --max-iterations 15
```

**关键点**：
- 100% 同步：严格的质量标准
- 校验步骤：确保生成的文档符合OpenAPI规范
- 中等迭代上限（包含扫描、生成、验证多个步骤）

---

## 示例 D：批量重构

**用户输入**："将所有回调函数转换为 async/await"

**生成的命令**：
```
/ralph-loop:ralph-loop "任务：批量转换回调到 async/await

### 1. 初始准备
- 生成时间戳（如 20250124_143052）
- 创建 .plan/fix_plan_{timestamp}.md 记录执行步骤

### 2. 执行
1. 使用 grep 找到所有包含回调的文件
2. 逐个文件重构：移除 callback 参数，添加 async/await
3. 运行测试确保功能不变
4. 运行 lint 确保代码风格一致
5. 每完成一个文件进行 git commit
完成后输出 <promise>REFACTOR_COMPLETE</promise>" --completion-promise "REFACTOR_COMPLETE" --max-iterations 50 --allowed-tools "Write,Bash(git *),Read,Grep"
```

**关键点**：
- 使用 grep 识别工作范围
- 阶段性提交：每完成一个文件就commit，便于回滚
- 明确的验证步骤（测试 + lint）
- 工具限制：限制为必要的工具，减少风险
- 更高的迭代上限（处理多个文件）

---

## 示例 E：依赖升级

**用户输入**："升级 React 到最新版本并修复破坏性变更"

**生成的命令**：
```
/ralph-loop:ralph-loop "任务：升级 React

### 1. 初始准备
- 生成时间戳（如 20250124_143052）
- 创建 .plan/fix_plan_{timestamp}.md 记录执行步骤

### 2. 执行
1. 安装最新版本 React
2. 运行 npm test 识别失败的测试
3. 分析失败的测试，更新代码以适配新版本
4. 重复测试和修复直到所有测试通过
5. 运行构建确保生产环境正常
完成后输出 <promise>REACT_UPGRADE_DONE</promise>" --completion-promise "REACT_UPGRADE_DONE" --max-iterations 30 --allowed-tools "Write,Bash(npm *,git *),Read,Grep"
```

**关键点**：
- 自愈循环：测试失败 → 分析 → 修复 → 重测
- 最终验证：确保构建成功
- 允许npm和git操作
- 合理的迭代上限（可能涉及多处修复）
