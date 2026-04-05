# Tasks: Finance Department Subagent

## 实现类型

- **类型**: new
- **优先级**: critical
- **阶段**: Phase 2 - 核心部门

## 任务列表

### Task 1: Finance Subagent 配置

- **描述**: 创建 Finance Subagent 配置文件
- **文件**: `plugins/finance/agent/config.yaml`
- **验收**: 配置包含所有角色权限

### Task 2: 财务工具实现

- **描述**: 实现 finance_query、finance_ocr、finance_mutate 等工具
- **文件**: `src-tauri/src/agent/tools/department/finance/`
- **验收**: 工具通过权限检查

### Task 3: 角色权限矩阵

- **描述**: 配置各角色的工具权限
- **验收**: 四级权限正确生效

### Task 4: OCR 集成

- **描述**: 集成发票识别服务
- **验收**: 支持增值税发票识别

## 测试要点

- [ ] 单元测试：权限计算
- [ ] 集成测试：发票 OCR
- [ ] E2E 测试：完整报销流程
