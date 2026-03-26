# Specification: 代码质量与Lint规则

## 需求来源

### PRD 需求
- 无具体FR需求（本Story为代码质量优化）

### NFR约束
- NFR22: 可维护性要求

---

## ESLint配置规格

### 插件列表

```javascript
{
  "plugins": [
    "react",
    "react-hooks",
    "@typescript-eslint",
    "prettier"
  ]
}
```

### 规则配置

#### Error级别（必须修复）

| 规则名 | 配置值 | 说明 |
|--------|--------|------|
| react-hooks/rules-of-hooks | error | 必须遵循Hooks规则 |
| @typescript-eslint/no-floating-promises | error | Promise必须处理 |
| @typescript-eslint/await-thenable | error | await必须有效 |
| no-debugger | error | 禁止debugger |
| no-var | error | 禁止var |
| prettier/prettier | error | Prettier格式化 |

#### Warning级别（建议修复）

| 规则名 | 配置值 | 说明 |
|--------|--------|------|
| react-hooks/exhaustive-deps | warn | 依赖数组必须完整 |
| @typescript-eslint/no-unused-vars | warn | 未使用变量警告 |
| @typescript-eslint/no-explicit-any | warn | 建议避免any |
| no-console | warn | 控制台输出警告 |
| react/display-name | warn | 组件缺少displayName |

---

## Prettier配置规格

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true
}
```

---

## lint-staged配置规格

```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "git add"
  ],
  "*.{json,md}": [
    "prettier --write",
    "git add"
  ]
}
```

---

## Git Hooks规格

### pre-commit hook行为

```
1. git commit触发
2. lint-staged检查暂存文件
3. ESLint检查.ts/.tsx文件
4. Prettier格式化
5. 成功则commit，失败则阻止
```

---

## 验收场景 (Given-When-Then格式)

### Scenario 1: 代码提交前检查
**GIVEN** 开发者修改了src文件并git add
**WHEN** 执行git commit
**THEN** pre-commit hook触发lint检查，通过则commit成功

### Scenario 2: Lint错误阻止提交
**GIVEN** 代码存在Lint错误
**WHEN** 执行git commit
**THEN** commit被阻止，错误信息显示在终端

### Scenario 3: 自动格式化
**GIVEN** 开发者运行npm run lint:fix
**WHEN** 检查自动修复
**THEN** 所有可自动修复的问题被修复

### Scenario 4: Prettier格式化
**GIVEN** 开发者运行npm run format
**WHEN** 检查格式化结果
**THEN** 所有文件符合Prettier配置

---

## 边界条件

### 边界条件 1: 大量Lint错误
- **场景**: 首次配置时大量错误
- **处理**: 分阶段添加规则，逐步修复

### 边界条件 2: 大文件提交
- **场景**: 提交大文件（>1MB）
- **处理**: lint-staged配置排除

### 边界条件 3: 豁免注释滥用
- **场景**: 过度使用eslint-disable
- **处理**: 定期审查豁免注释

### 边界条件 4: pre-commit hook跳过
- **场景**: 开发者使用--no-verify
- **处理**: CI仍会检查，PR会被阻止

---

## 错误码定义

### Lint错误码

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| LINT-001 | ESLint配置解析失败 | 检查.eslintrc.cjs语法 |
| LINT-002 | Prettier配置错误 | 检查.prettierrc语法 |
| LINT-003 | Lint检查失败 | 修复对应错误 |
| LINT-004 | 格式化成环 | 检查ESLint和Prettier集成 |
| LINT-005 | Git hook失败 | 检查npm scripts |

---

## 文件修改规范

### 豁免注释格式

```typescript
// 单行豁免
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = JSON.parse(jsonString);

// 带原因说明的豁免
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Reason: 第三方API返回格式固定，无法定义类型
const data = JSON.parse(jsonString);

// 代码块豁免
/* eslint-disable @typescript-eslint/no-explicit-any */
const data = JSON.parse(jsonString);
/* eslint-enable @typescript-eslint/no-explicit-any */
```

---

## 集成检查清单

- [ ] ESLint规则已更新
- [ ] Prettier配置已创建
- [ ] lint-staged已配置
- [ ] pre-commit hook已设置
- [ ] CI lint job已配置
- [ ] `npm run lint` 无错误
- [ ] `npm run format` 正常工作

---

## 持续维护

### 规则更新流程
1. 在dev分支测试新规则
2. Code Review确认
3. 合并到main
4. 通知团队更新本地配置

### 豁免注释审查
每季度审查一次豁免注释，清理不必要的豁免。
