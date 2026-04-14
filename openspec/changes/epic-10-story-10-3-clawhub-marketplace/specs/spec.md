# Specs: ClawHub生态 - 市场集成与资源管理

## 功能规格

### 1. 市场浏览 (marketplace_browse)

**输入：** category?: string, page?: number
**输出：** `MarketResource[]`

### 2. 资源搜索 (marketplace_search)

**输入：** `SearchRequest { query, resourceType?, category?, tags?, sortBy, page, pageSize }`
**输出：** `MarketResource[]`

### 3. 资源详情 (marketplace_detail)

**输入：** resourceId: string
**输出：** `MarketResourceDetail`

### 4. 上传审核 (marketplace_upload)

**输入：** resource: UploadResource
**输出：** ApprovalRequest

### 5. 审核处理 (marketplace_review_process)

**输入：** uploadId: string, decision: ApprovalDecision
**输出：** void

## 接口规格

| 命令 | 参数 | 返回值 |
|------|------|--------|
| marketplace_browse | category?, page | MarketResource[] |
| marketplace_search | SearchRequest | MarketResource[] |
| marketplace_detail | resourceId | MarketResourceDetail |
| marketplace_upload | UploadResource | ApprovalRequest |
| marketplace_review_process | uploadId, decision | void |

## 错误码

| 错误码 | 说明 |
|--------|------|
| MARKET_NOT_FOUND | 市场不存在 |
| RESOURCE_NOT_FOUND | 资源不存在 |
| REVIEW_FAILED | 审核失败 |
