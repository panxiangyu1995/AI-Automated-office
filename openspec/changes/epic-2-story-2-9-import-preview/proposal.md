# Proposal: Import Preview and Conflict Detection

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

Epic 2 用户认证与部门权限系统需要支持批量导入用户数据，以支持企业快速初始化员工数据或批量更新员工信息。本提案实现导入预览和冲突检测功能，确保数据导入前用户能够看到完整的预览和冲突报告。

### 业务背景
- 管理员需要批量导入用户数据（FR33）
- 管理员可以导入员工信息 Excel 批量导入（FR107）
- 导入前需要检测数据冲突和错误

### 技术背景
- 后端采用 Go 语言（ADR-005）
- 多租户数据库级隔离
- 需要支持 Excel 文件解析

## 目标

实现用户导入的预览和冲突检测功能：
1. 定义标准导入模板和字段映射
2. 解析上传的 Excel 文件
3. 检测重复账号、工号和组织架构冲突
4. 生成详细的预览报告

## 范围

### 包含
- 定义用户导入模板（Excel 格式）
- 文件上传和解析 API
- 字段映射和数据验证
- 冲突检测逻辑
- 预览报告生成
- 导入模板下载 API

### 不包含
- 导入确认和提交（E2-S2.9-02）
- 导入 UI 界面（E2-S2.9-03）
- 导出功能（E2-S2.9-03）

## 影响范围

### 后端
- `cloud-server/internal/module/admin/application/service/import_service.go` - 导入服务
- `cloud-server/internal/module/admin/infrastructure/parser/` - Excel 解析器
- `cloud-server/api/admin/import.go` - API Handler

### 数据库
- 新增 `user_import_batches` 表记录导入批次

### 前端
- 无直接影响（UI 在 E2-S2.9-03 实现）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 大文件解析内存溢出 | 中 | 高 | 限制文件大小，流式解析 |
| Excel 格式不兼容 | 中 | 中 | 提供标准模板，严格格式校验 |
| 字段映射错误 | 低 | 中 | 提供列名映射配置 |

## 实施计划

1. **Step 1**: 设计导入模板格式
2. **Step 2**: 创建导入批次数据表
3. **Step 3**: 实现 Excel 解析器
4. **Step 4**: 实现字段映射逻辑
5. **Step 5**: 实现冲突检测逻辑
6. **Step 6**: 实现预览报告生成
7. **Step 7**: 创建 API 接口

## 依赖关系

### 前置依赖
- E2-S2.2-01: User admin APIs
- E2-S2.3-01: Department and position domain model

### 后置依赖
- E2-S2.9-02: Import commit and receipt
- E2-S2.9-03: Import and export UI