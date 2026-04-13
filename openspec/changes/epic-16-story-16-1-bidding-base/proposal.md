# Epic 16 Story 16.1: Bidding 招投标模块基础架构

## Why

招投标是企业获取项目的重要渠道，直接影响企业营收。当前系统缺少专业的招投标管理能力，导致：
- 资质管理混乱，过期资质导致投标失败
- 业绩案例分散，难以快速查找
- 投标流程不规范，效率低下

实现招投标模块可以：
- 集中管理公司资质和业绩案例
- 规范化投标流程
- 避免资质过期导致的投标失败
- 提升中标率

**业务价值：** 根据行业数据，规范化招投标管理可提升中标率15-20%。

## What Changes

实现招投标模块的基础架构：

1. **资质库管理**
   - 资质类型定义（营业执照、安全许可证等）
   - 资质有效期管理
   - 到期提醒机制
   - 资质文件管理

2. **业绩库管理**
   - 业绩案例录入
   - 行业分类
   - 关键词标签
   - 案例搜索

3. **前后端实现**
   - Rust后端：`src-tauri/src/tender/` 模块
   - React前端：`src/features/tender/` 模块
   - 数据库Schema和迁移

## Capabilities

### New Capabilities

- `bidding-qualification`: 资质库管理，支持资质上传、到期提醒
- `bidding-case`: 业绩库管理，支持业绩案例上传和展示
- `bidding-base-ui`: 招投标模块前端UI

### Modified Capabilities

- 无

## Impact

### 受影响代码

| 路径 | 操作 | 说明 |
|------|------|------|
| `src/features/tender/` | 新增 | 招投标模块前端 |
| `src-tauri/src/tender/` | 新增 | 招投标模块后端 |
| `src/components/layout/Sidebar.tsx` | 修改 | 添加动态入口 |

### 依赖模块

| 模块 | 依赖类型 | 说明 |
|------|----------|------|
| `notification` | 软依赖 | 资质到期提醒 |
| `storage` | 硬依赖 | 资质文件存储 |

### 权限模型

```
招投标权限 = 人事权限(read) + 招投标权限(full) + 审批发起权限
```

### 数据库影响

- 新增表：`tender_qualifications`, `tender_cases`
- 无破坏性变更

## Open Questions

1. 资质文件存储位置？本地还是云存储？
2. 业绩案例是否需要审核流程？
3. 是否需要资质借用功能？
