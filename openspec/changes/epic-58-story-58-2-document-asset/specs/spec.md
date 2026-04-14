# Specs: 文档资产与修订链

## 功能规格

### 1. 创建文档 (doc_asset_create)

**输入：** title, content, contentType, sourceType
**输出：** string (document_id)

### 2. 修订历史 (doc_asset_revision_list)

**输入：** documentId
**输出：** `RevisionEntry[]`

### 3. 版本对比 (doc_asset_diff)

**输入：** documentId, fromVersion, toVersion
**输出：** VersionDiff

### 4. 提交Staged Review (doc_staged_review_submit)

**输入：** documentId
**输出：** string (review_id)

### 5. Review决策 (doc_staged_review_decide)

**输入：** reviewId, decision
**输出：** void

## 接口规格

| 命令 | 参数 | 返回值 |
|------|------|--------|
| doc_asset_create | title, content, contentType, sourceType | string |
| doc_asset_revision_list | documentId | RevisionEntry[] |
| doc_asset_diff | documentId, fromVersion, toVersion | VersionDiff |
| doc_staged_review_submit | documentId | string |
| doc_staged_review_decide | reviewId, decision | void |

## 错误码

| 错误码 | 说明 |
|--------|------|
| DOCUMENT_NOT_FOUND | 文档不存在 |
| VERSION_NOT_FOUND | 版本不存在 |
| REVIEW_FAILED | 审核失败 |
