# Epic 10 Story 10.3: ClawHub生态 - 市场集成与资源管理

## Why

ClawHub市场是平台能力的分发枢纽，提供官方认证能力的发现和安装。当前平台缺少统一的市场入口，存在以下痛点：

1. **发现困难**：用户不知道有哪些可用能力
2. **信任缺失**：无法验证能力来源和安全性
3. **上传繁琐**：私有能力无法分享
4. **更新滞后**：能力版本更新无法及时通知

**量化收益**：
- 预计提升能力发现效率 60%
- 降低用户配置时间 40%
- 增加能力复用率 50%

## What Changes

### 新增功能

1. **市场浏览**
   - 官方市场资源列表
   - 分类筛选
   - 排序（评分/下载量/最新）

2. **资源搜索**
   - 名称搜索
   - 标签搜索
   - 全文搜索

3. **资源详情**
   - 能力描述和截图
   - 版本和变更日志
   - 依赖关系
   - 用户评分和评论

4. **私有市场**
   - 私有能力上传
   - 私有市场配置
   - 访问权限控制

5. **上传审核**
   - 提交审核
   - 审核状态跟踪
   - 审核结果通知

### 修改功能

- `clawhub-install`: 增加市场安装入口

### 删除功能

- 无

## Capabilities

### New Capabilities

| Capability | 描述 | 触发场景 |
|-----------|------|----------|
| `clawhub-market-browse` | 浏览市场资源 | 用户打开市场页面 |
| `clawhub-market-search` | 搜索资源 | 用户输入关键词 |
| `clawhub-market-detail` | 获取资源详情 | 用户点击资源 |
| `clawhub-market-upload` | 上传私有能力 | 用户上传ZIP包 |
| `clawhub-market-review-submit` | 提交审核 | 用户提交上传 |
| `clawhub-review-list` | 查看审核列表 | 审核人员操作 |
| `clawhub-review-process` | 处理审核 | 审核人员决策 |

### Modified Capabilities

| Capability | 修改内容 |
|-----------|----------|
| `clawhub-install` | 增加市场安装入口 |

## Impact

### 前端影响

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/features/marketplace/` | 新增 | 市场模块目录 |
| `src/features/marketplace/pages/MarketPage.tsx` | 新增 | 市场主页 |
| `src/features/marketplace/pages/DetailPage.tsx` | 新增 | 资源详情页 |
| `src/features/marketplace/pages/UploadPage.tsx` | 新增 | 上传页面 |
| `src/features/marketplace/components/SearchBar.tsx` | 新增 | 搜索栏 |
| `src/features/marketplace/components/ResourceCard.tsx` | 新增 | 资源卡片 |
| `src/features/marketplace/components/CategoryFilter.tsx` | 新增 | 分类筛选 |
| `src/features/marketplace/components/ReviewDialog.tsx` | 新增 | 审核对话框 |

### 后端影响

| 模块 | 变更类型 | 说明 |
|------|----------|------|
| `src-tauri/src/marketplace/` | 新增 | 市场模块 |
| `src-tauri/src/marketplace/client.rs` | 新增 | 市场API客户端 |
| `src-tauri/src/marketplace/search.rs` | 新增 | 搜索服务 |
| `src-tauri/src/marketplace/upload.rs` | 新增 | 上传审核 |
| `src-tauri/src/commands/marketplace.rs` | 新增 | 市场命令 |

### 依赖

- 前置依赖：Story 10.2 安装管理（FR704-FR710）
- 后端依赖：HTTP客户端、JSON处理

## PRD对齐

### 功能需求（FR）

| FR编号 | 描述 |
|--------|------|
| FR730 | 市场资源浏览 |
| FR731 | 资源搜索 |
| FR732 | 资源详情展示 |
| FR733 | 资源评分评论 |
| FR734 | 私有市场配置 |
| FR735 | 资源上传 |
| FR736 | 审核流程 |
| FR737 | 更新检查 |
| FR738 | 访问权限 |
| FR739 | 安装日志 |

### 非功能需求（NFR）

| NFR编号 | 描述 |
|----------|------|
| NFR1 | 响应时间 < 2s |
| NFR22 | 操作日志 |

## Risks

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 市场API延迟 | 低 | 本地缓存 |
| 资源质量参差 | 中 | 审核机制 |
| 依赖冲突 | 中 | 版本检查 |
