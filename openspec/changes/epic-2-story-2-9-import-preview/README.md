# Epic 2, Story 2.9: Import Preview and Conflict Detection

## 概述

实现用户导入预览和冲突检测功能，支持 Excel 批量导入用户前的数据校验、冲突识别和预览报告生成。这是导入导出流程的第一步，确保数据导入的准确性和安全性。

## 铁律映射

### PRD 需求
- **FR33**: 管理员可以导入和导出用户数据
- **FR107**: 管理员可以导入员工信息（Excel批量导入）

### 架构需求
- **ADR-005**: 多租户采用数据库级隔离，导入数据需遵循租户隔离原则

### NFR 需求
- **NFR16**: 数据导入需进行完整性和一致性校验

## 验收标准

- [ ] 定义导入模板和字段映射规则
- [ ] 解析上传文件并验证数据结构
- [ ] 检测重复账号、工号冲突和组织架构映射冲突
- [ ] 生成预览报告（包含成功/冲突/错误数据）

## 技术方案

### 后端模块结构

```
cloud-server/internal/module/admin/
├── application/
│   ├── service/
│   │   └── import_service.go    # 导入服务
│   └── dto/
│       ├── import_request.go     # 导入请求 DTO
│       ├── import_preview.go     # 预览响应 DTO
│       └── import_conflict.go    # 冲突详情 DTO
├── domain/
│   └── entity/
│       └── import_batch.go       # 导入批次实体
└── infrastructure/
    └── parser/
        ├── excel_parser.go       # Excel 解析器
        └── field_mapper.go       # 字段映射器
```

### 核心功能

1. **模板定义**
   - 标准 Excel 模板下载
   - 必填字段标注
   - 数据格式说明

2. **文件解析**
   - 支持 .xlsx 格式
   - 字段自动映射
   - 数据类型转换

3. **冲突检测**
   - 重复账号检测
   - 工号重复检测
   - 部门不存在检测
   - 岗位不存在检测
   - 上级不存在检测

4. **预览报告**
   - 成功数据统计
   - 冲突数据详情
   - 错误数据列表
   - 修复建议

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`