# Tasks: 代码质量与Lint规则

## 任务列表

### Task 140: 代码质量与Lint规则

| 属性 | 值 |
|------|-----|
| **描述** | 统一代码风格，完善ESLint规则，提升代码质量 |
| **Epic** | Epic 56 - 技术债务与优化 |
| **Story** | Story 56.5 |
| **implementationType** | polish |
| **优先级** | low |
| **阶段** | 技术债务与优化 |
| **是否需要后端** | 否 |
| **依赖** | 无 |

### 验收标准

- [ ] ESLint配置更新完成
- [ ] React Hooks规则添加并生效
- [ ] Prettier配置完成并与ESLint集成
- [ ] lint-staged配置完成
- [ ] Git pre-commit hook配置完成
- [ ] 现有Lint错误修复
- [ ] `npm run lint` 无新增错误

---

## 详细任务步骤

### Step 1: 审查现有ESLint配置
**预估时间**: 1小时
- 检查当前.eslintrc.cjs
- 分析现有规则
- 记录待改进项

**验收标准**:
- [ ] 现有配置审查完成
- [ ] 改进清单记录

### Step 2: 安装新ESLint插件
**预估时间**: 1小时
- 安装eslint-plugin-react-hooks
- 安装eslint-plugin-prettier

**验收标准**:
- [ ] 插件安装成功
- [ ] package.json更新

```bash
npm install --save-dev eslint-plugin-react-hooks eslint-plugin-prettier
```

### Step 3: 更新ESLint配置
**预估时间**: 2小时
- 添加React Hooks规则
- 添加TypeScript规则
- 添加最佳实践规则
- 配置Prettier集成

**验收标准**:
- [ ] .eslintrc.cjs更新
- [ ] 规则配置合理

### Step 4: 配置Prettier
**预估时间**: 1小时
- 创建/更新.prettierrc
- 配置与ESLint集成

**验收标准**:
- [ ] .prettierrc创建/更新
- [ ] 格式化规则明确

### Step 5: 配置lint-staged
**预估时间**: 1小时
- 安装lint-staged
- 创建.lintstagedrc
- 配置pre-commit hook

**验收标准**:
- [ ] lint-staged配置完成
- [ ] Git hooks配置完成

### Step 6: 修复现有Lint错误
**预估时间**: 4小时
- 统计现有错误
- 自动修复
- 手动修复复杂问题

**验收标准**:
- [ ] 自动修复执行
- [ ] 手动修复完成
- [ ] `npm run lint` 通过

### Step 7: 验证配置
**预估时间**: 1小时
- 运行完整lint检查
- 验证pre-commit hook
- 确保规则合理

**验收标准**:
- [ ] lint检查通过
- [ ] pre-commit hook正常
- [ ] CI配置正常

---

## 测试要点

### Lint检查测试
- [x] `npm run lint` 无错误
- [x] `npm run lint:fix` 自动修复正常
- [x] `npm run format` 格式化正常

### Git Hooks测试
- [x] git commit时触发lint
- [x] lint失败时commit被阻止
- [x] lint成功时commit正常

### CI集成测试
- [x] PR检查lint状态
- [x] lint失败阻止合并

---

## 规则清单

### Error级别规则

| 规则名 | 说明 | 当前状态 |
|--------|------|---------|
| react-hooks/rules-of-hooks | Hooks使用规则 | 新增 |
| @typescript-eslint/no-floating-promises | Promise错误处理 | 新增 |
| @typescript-eslint/await-thenable | await有效性 | 新增 |
| no-debugger | 禁用debugger | 已有 |
| no-var | 禁用var | 已有 |

### Warning级别规则

| 规则名 | 说明 | 当前状态 |
|--------|------|---------|
| react-hooks/exhaustive-deps | 依赖数组完整 | 新增 |
| @typescript-eslint/no-unused-vars | 未使用变量 | 已有 |
| @typescript-eslint/no-explicit-any | 禁用any | 新增 |
| no-console | 控制台输出 | 已有 |
| react/display-name | 组件displayName | 新增 |

---

## 修复错误分类

### 自动修复类 (预计80%)
- 代码格式化问题
- 简单的声明未使用
- 引号、分号等风格问题

### 手动修复类 (预计20%)
- 复杂的逻辑问题
- 需要重构的代码
- 需要添加eslint-disable的情况

---

## 豁免注释使用指南

### 允许使用豁免的场景
1. 测试文件中的mock代码
2. 第三方库的类型声明
3. 复杂的类型转换（需注释说明）

### 不允许使用豁免的场景
1. 代码逻辑问题
2. 安全相关问题
3. Hooks规则

---

## 维护指南

### 新增规则流程
1. 在本地分支测试新规则
2. 确认规则合理后更新.eslintrc.cjs
3. 添加到lint-staged
4. 通知团队更新

### 规则豁免流程
1. 使用eslint-disable-next-line
2. 添加注释说明原因
3. 创建TODO标记后续处理
