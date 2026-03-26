# Design: AI暂存写回与审阅机制

## 技术方案

### 实现类型
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 4 - 业务模块动态化
- **后端必需**: Yes

### 前端实现

#### 目录结构
```
src/features/staged-review/
├── components/
│   ├── StagedReviewPanel.tsx       # 审阅主面板
│   ├── StagedContentViewer.tsx      # 暂存内容查看器
│   ├── StagedContentEditor.tsx      # 暂存内容编辑器
│   ├── StagedContentCard.tsx        # 暂存内容卡片
│   ├── ReviewHistory.tsx            # 审阅历史
│   ├── ReviewActions.tsx           # 审阅操作按钮
│   └── StagedContentDiff.tsx       # 内容对比（可选）
├── hooks/
│   ├── useStagedReview.ts           # 审阅Hook
│   ├── useStagedContent.ts          # 暂存内容Hook
│   └── useStagedActions.ts         # 操作Hook
├── stores/
│   └── stagedReviewStore.ts         # 状态管理
├── types/
│   └── index.ts                     # 类型定义
└── utils/
    ├── contentRenderer.ts            # 内容渲染工具
    └── validation.ts                # 验证工具
```

#### 核心类型定义

```typescript
// src/features/staged-review/types/index.ts

export type StagedContentType =
  | 'quotation'      // 报价单
  | 'contract'       // 合同
  | 'customer'        // 客户信息
  | 'invoice'         // 发票
  | 'ledger_entry'    // 台账条目
  | 'custom';         // 自定义类型

export type StagedContentStatus =
  | 'pending'         // 待审阅
  | 'approved'        // 已批准（待写回）
  | 'rejected'        // 已拒绝
  | 'written_back'    // 已写回
  | 'expired';        // 已过期

export type ReviewAction =
  | 'approve'         // 批准
  | 'reject'          // 拒绝
  | 'modify'          // 修改
  | 'write_back'      // 写回
  | 'cancel';         // 取消

export interface StagedContent {
  id: string;
  type: StagedContentType;
  agentId: string;           // 生成该内容的Agent ID
  sessionId: string;          // 所属会话ID
  title: string;              // 标题/摘要
  summary: string;            // 内容摘要
  originalData: unknown;       // 原始数据（JSON）
  modifiedData?: unknown;      // 用户修改后的数据
  status: StagedContentStatus;
  sourceTool: string;         // 来源工具名称
  confidence: number;         // AI生成置信度
  suggestedActions?: string[]; // 建议的后续操作
  createdAt: string;
  expiresAt: string;          // 过期时间
  reviewedAt?: string;        // 审阅时间
  reviewedBy?: string;        // 审阅人
  writeBackTarget?: string;   // 写回目标（如 customer_id）
}

export interface StagedContentQuery {
  type?: StagedContentType;
  status?: StagedContentStatus;
  agentId?: string;
  sessionId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ReviewAuditLog {
  id: string;
  stagedContentId: string;
  action: ReviewAction;
  operatorId: string;
  operatorName: string;
  oldStatus: StagedContentStatus;
  newStatus: StagedContentStatus;
  reason?: string;            // 拒绝/修改原因
  dataSnapshot?: string;      // 操作时的数据快照
  createdAt: string;
}
```

#### 核心组件实现

```typescript
// src/features/staged-review/components/StagedReviewPanel.tsx
interface StagedReviewPanelProps {
  sessionId?: string;
  onWriteBackSuccess?: (result: WriteBackResult) => void;
  onError?: (error: StagedReviewError) => void;
}

const StagedReviewPanel: React.FC<StagedReviewPanelProps> = ({
  sessionId,
  onWriteBackSuccess,
  onError,
}) => {
  const { stagedContents, isLoading, refetch } = useStagedContent({ sessionId });
  const { approve, reject, modify, writeBack, cancel } = useStagedActions();

  const pendingContents = stagedContents.filter(c => c.status === 'pending');
  const approvedContents = stagedContents.filter(c => c.status === 'approved');

  return (
    <div className="staged-review-panel">
      <div className="panel-header">
        <h2>AI内容审阅</h2>
        <Badge variant="warning">{pendingContents.length} 待审阅</Badge>
      </div>

      <Tabs defaultTab="pending">
        <TabList>
          <Tab key="pending">待审阅 ({pendingContents.length})</Tab>
          <Tab key="approved">待写回 ({approvedContents.length})</Tab>
          <Tab key="history">审阅历史</Tab>
        </TabList>

        <TabPanel key="pending">
          {pendingContents.map(content => (
            <StagedContentCard
              key={content.id}
              content={content}
              onApprove={() => approve(content.id)}
              onReject={(reason) => reject(content.id, reason)}
              onModify={(data) => modify(content.id, data)}
            />
          ))}
          {pendingContents.length === 0 && (
            <EmptyState message="暂无待审阅内容" />
          )}
        </TabPanel>

        <TabPanel key="approved">
          {approvedContents.map(content => (
            <StagedContentCard
              key={content.id}
              content={content}
              showWriteBackButton
              onWriteBack={() => writeBack(content.id)}
            />
          ))}
        </TabPanel>

        <TabPanel key="history">
          <ReviewHistory sessionId={sessionId} />
        </TabPanel>
      </Tabs>
    </div>
  );
};
```

```typescript
// src/features/staged-review/components/StagedContentCard.tsx
interface StagedContentCardProps {
  content: StagedContent;
  showWriteBackButton?: boolean;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onModify?: (data: unknown) => void;
  onWriteBack?: () => void;
}

const StagedContentCard: React.FC<StagedContentCardProps> = ({
  content,
  showWriteBackButton,
  onApprove,
  onReject,
  onModify,
  onWriteBack,
}) => {
  return (
    <Card className="staged-content-card">
      <CardHeader>
        <div className="card-title">
          <ContentTypeBadge type={content.type} />
          <span>{content.title}</span>
        </div>
        <ConfidenceIndicator confidence={content.confidence} />
      </CardHeader>

      <CardBody>
        <StagedContentViewer content={content} />
      </CardBody>

      <CardFooter>
        <div className="meta-info">
          <span>来源: {content.sourceTool}</span>
          <span>创建: {formatDateTime(content.createdAt)}</span>
        </div>

        {content.status === 'pending' && (
          <div className="actions">
            <Button size="sm" variant="secondary" onClick={() => onModify?.(content)}>
              修改
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onReject?.('')}>
              拒绝
            </Button>
            <Button size="sm" variant="default" onClick={onApprove}>
              批准
            </Button>
          </div>
        )}

        {content.status === 'approved' && showWriteBackButton && (
          <div className="actions">
            <Button size="sm" variant="default" onClick={onWriteBack}>
              确认写回
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
```

```typescript
// src/features/staged-review/components/StagedContentEditor.tsx
interface StagedContentEditorProps {
  content: StagedContent;
  onSave: (modifiedData: unknown) => void;
  onCancel: () => void;
}

const StagedContentEditor: React.FC<StagedContentEditorProps> = ({
  content,
  onSave,
  onCancel,
}) => {
  const [editedData, setEditedData] = useState(content.originalData);

  const handleFieldChange = (path: string, value: unknown) => {
    setEditedData(updateNestedValue(editedData, path, value));
  };

  const renderEditor = () => {
    switch (content.type) {
      case 'quotation':
        return <QuotationEditor data={editedData} onChange={handleFieldChange} />;
      case 'contract':
        return <ContractEditor data={editedData} onChange={handleFieldChange} />;
      case 'customer':
        return <CustomerEditor data={editedData} onChange={handleFieldChange} />;
      default:
        return <GenericJsonEditor data={editedData} onChange={setEditedData} />;
    }
  };

  return (
    <div className="staged-content-editor">
      <div className="editor-header">
        <h3>编辑{getContentTypeName(content.type)}</h3>
        <div className="diff-indicator">
          {hasChanges(content.originalData, editedData) && (
            <Badge variant="info">已修改</Badge>
          )}
        </div>
      </div>

      <div className="editor-body">
        {renderEditor()}
      </div>

      <div className="editor-footer">
        <Button variant="secondary" onClick={onCancel}>取消</Button>
        <Button onClick={() => onSave(editedData)}>保存修改</Button>
      </div>
    </div>
  );
};
```

#### Hooks实现

```typescript
// src/features/staged-review/hooks/useStagedActions.ts
export const useStagedActions = () => {
  const { addAuditLog } = useAuditLogger();
  const { refetch } = useStagedContent();

  const approve = async (contentId: string) => {
    await invoke('staged_review|update_status', {
      id: contentId,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
    });
    await addAuditLog({
      stagedContentId: contentId,
      action: 'approve',
      oldStatus: 'pending',
      newStatus: 'approved',
    });
    refetch();
  };

  const reject = async (contentId: string, reason: string) => {
    await invoke('staged_review|update_status', {
      id: contentId,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      rejectReason: reason,
    });
    await addAuditLog({
      stagedContentId: contentId,
      action: 'reject',
      oldStatus: 'pending',
      newStatus: 'rejected',
      reason,
    });
    refetch();
  };

  const writeBack = async (contentId: string) => {
    const result = await invoke<WriteBackResult>('staged_review|write_back', {
      id: contentId,
    });
    await addAuditLog({
      stagedContentId: contentId,
      action: 'write_back',
      oldStatus: 'approved',
      newStatus: 'written_back',
      dataSnapshot: JSON.stringify(result),
    });
    refetch();
    return result;
  };

  return { approve, reject, modify, writeBack, cancel };
};
```

### 后端实现

#### 目录结构
```
src-tauri/src/agent/staged_review/
├── mod.rs              # 模块入口
├── manager.rs          # 暂存管理器
├── storage.rs          # 暂存存储
├── commands.rs         # Tauri命令
├── audit.rs           # 审计日志
├── write_back.rs       # 写回处理器
└── errors.rs          # 错误定义
```

#### 核心实现

```rust
// src-tauri/src/agent/staged_review/manager.rs

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, Duration};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StagedContent {
    pub id: String,
    pub content_type: String,
    pub agent_id: String,
    pub session_id: String,
    pub title: String,
    pub summary: String,
    pub original_data: serde_json::Value,
    pub modified_data: Option<serde_json::Value>,
    pub status: StagedContentStatus,
    pub source_tool: String,
    pub confidence: f64,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub reviewed_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StagedContentStatus {
    Pending,
    Approved,
    Rejected,
    WrittenBack,
    Expired,
}

pub struct StagedReviewManager {
    storage: Arc<RwLock<dyn StagedStorage>>,
    write_back_handlers: HashMap<String, Box<dyn WriteBackHandler>>,
    audit_logger: Arc<dyn AuditLogger>,
}

impl StagedReviewManager {
    /// 创建新的暂存内容
    pub async fn create_staged_content(
        &self,
        content_type: String,
        agent_id: String,
        session_id: String,
        title: String,
        summary: String,
        original_data: serde_json::Value,
        source_tool: String,
        confidence: f64,
    ) -> Result<StagedContent, StagedReviewError> {
        let content = StagedContent {
            id: uuid::Uuid::new_v4().to_string(),
            content_type,
            agent_id,
            session_id,
            title,
            summary,
            original_data: original_data.clone(),
            modified_data: None,
            status: StagedContentStatus::Pending,
            source_tool,
            confidence,
            created_at: Utc::now(),
            expires_at: Utc::now() + Duration::hours(24), // 24小时过期
            reviewed_at: None,
            reviewed_by: None,
        };

        self.storage.write().await.save(&content).await?;
        self.audit_logger.log_create(&content).await?;

        Ok(content)
    }

    /// 批准暂存内容
    pub async fn approve(
        &self,
        content_id: String,
        reviewer_id: String,
    ) -> Result<StagedContent, StagedReviewError> {
        let mut content = self.storage.write().await.get(&content_id).await?;

        if content.status != StagedContentStatus::Pending {
            return Err(StagedReviewError::InvalidStatusTransition {
                current: content.status.clone(),
                attempted: "approve".to_string(),
            });
        }

        content.status = StagedContentStatus::Approved;
        content.reviewed_at = Some(Utc::now());
        content.reviewed_by = Some(reviewer_id);

        self.storage.write().await.update(&content).await?;
        self.audit_logger.log_review(&content, "approve").await?;

        Ok(content)
    }

    /// 拒绝暂存内容
    pub async fn reject(
        &self,
        content_id: String,
        reviewer_id: String,
        reason: String,
    ) -> Result<StagedContent, StagedReviewError> {
        let mut content = self.storage.write().await.get(&content_id).await?;

        if content.status != StagedContentStatus::Pending {
            return Err(StagedReviewError::InvalidStatusTransition {
                current: content.status.clone(),
                attempted: "reject".to_string(),
            });
        }

        content.status = StagedContentStatus::Rejected;
        content.reviewed_at = Some(Utc::now());
        content.reviewed_by = Some(reviewer_id);

        self.storage.write().await.update(&content).await?;
        self.audit_logger.log_review(&content, "reject").await?;

        Ok(content)
    }

    /// 写回业务模块
    pub async fn write_back(
        &self,
        content_id: String,
    ) -> Result<WriteBackResult, StagedReviewError> {
        let mut content = self.storage.write().await.get(&content_id).await?;

        if content.status != StagedContentStatus::Approved {
            return Err(StagedReviewError::InvalidStatusTransition {
                current: content.status.clone(),
                attempted: "write_back".to_string(),
            });
        }

        // 获取写回处理器
        let handler = self.write_back_handlers
            .get(&content.content_type)
            .ok_or(StagedReviewError::NoHandlerForType(content.content_type.clone()))?;

        // 执行写回
        let data_to_write = content.modified_data.as_ref().unwrap_or(&content.original_data);
        let result = handler.write_back(content_id.clone(), data_to_write.clone()).await?;

        // 更新状态
        content.status = StagedContentStatus::WrittenBack;
        self.storage.write().await.update(&content).await?;
        self.audit_logger.log_write_back(&content, &result).await?;

        Ok(result)
    }

    /// 获取待审阅内容列表
    pub async fn get_pending_contents(
        &self,
        session_id: Option<String>,
    ) -> Result<Vec<StagedContent>, StagedReviewError> {
        let contents = self.storage.read().await.get_all().await?;
        let filtered: Vec<StagedContent> = contents
            .into_iter()
            .filter(|c| {
                c.status == StagedContentStatus::Pending &&
                (session_id.is_none() || c.session_id == session_id.clone().unwrap())
            })
            .collect();
        Ok(filtered)
    }
}
```

```rust
// src-tauri/src/agent/staged_review/commands.rs

use crate::agent::staged_review::manager::StagedReviewManager;
use tauri::command;

#[command]
pub async fn create_staged_content(
    manager: State<'_, Arc<StagedReviewManager>>,
    content_type: String,
    agent_id: String,
    session_id: String,
    title: String,
    summary: String,
    original_data: serde_json::Value,
    source_tool: String,
    confidence: f64,
) -> Result<StagedContent, String> {
    manager
        .create_staged_content(
            content_type,
            agent_id,
            session_id,
            title,
            summary,
            original_data,
            source_tool,
            confidence,
        )
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_pending_contents(
    manager: State<'_, Arc<StagedReviewManager>>,
    session_id: Option<String>,
) -> Result<Vec<StagedContent>, String> {
    manager
        .get_pending_contents(session_id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn approve_staged_content(
    manager: State<'_, Arc<StagedReviewManager>>,
    content_id: String,
    reviewer_id: String,
) -> Result<StagedContent, String> {
    manager
        .approve(content_id, reviewer_id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn reject_staged_content(
    manager: State<'_, Arc<StagedReviewManager>>,
    content_id: String,
    reviewer_id: String,
    reason: String,
) -> Result<StagedContent, String> {
    manager
        .reject(content_id, reviewer_id, reason)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn modify_staged_content(
    manager: State<'_, Arc<StagedReviewManager>>,
    content_id: String,
    modified_data: serde_json::Value,
) -> Result<StagedContent, String> {
    manager
        .modify(content_id, modified_data)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn write_back_staged_content(
    manager: State<'_, Arc<StagedReviewManager>>,
    content_id: String,
) -> Result<WriteBackResult, String> {
    manager
        .write_back(content_id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_review_history(
    manager: State<'_, Arc<StagedReviewManager>>,
    session_id: Option<String>,
) -> Result<Vec<ReviewAuditLog>, String> {
    manager
        .get_review_history(session_id)
        .await
        .map_err(|e| e.to_string())
}
```

### 数据库设计

```sql
-- 暂存内容表
CREATE TABLE staged_contents (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    original_data TEXT NOT NULL,  -- JSON
    modified_data TEXT,            -- JSON，可选
    status TEXT NOT NULL DEFAULT 'pending',
    source_tool TEXT NOT NULL,
    confidence REAL NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT,
    reject_reason TEXT,
    write_back_result TEXT,        -- JSON
    version INTEGER NOT NULL DEFAULT 1,
    UNIQUE(id)
);

CREATE INDEX idx_staged_contents_session ON staged_contents(session_id);
CREATE INDEX idx_staged_contents_status ON staged_contents(status);
CREATE INDEX idx_staged_contents_type ON staged_contents(content_type);
CREATE INDEX idx_staged_contents_expires ON staged_contents(expires_at);

-- 审阅审计日志表
CREATE TABLE staged_review_audit_logs (
    id TEXT PRIMARY KEY,
    staged_content_id TEXT NOT NULL,
    action TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    reason TEXT,
    data_snapshot TEXT,            -- JSON
    created_at TEXT NOT NULL,
    FOREIGN KEY (staged_content_id) REFERENCES staged_contents(id)
);

CREATE INDEX idx_audit_staged_content ON staged_review_audit_logs(staged_content_id);
CREATE INDEX idx_audit_created ON staged_review_audit_logs(created_at);

-- 暂存内容版本表（用于历史追溯）
CREATE TABLE staged_content_versions (
    id TEXT PRIMARY KEY,
    staged_content_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    data TEXT NOT NULL,            -- JSON快照
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    change_description TEXT,
    FOREIGN KEY (staged_content_id) REFERENCES staged_contents(id),
    UNIQUE(staged_content_id, version)
);
```

## 状态管理

使用Zustand进行暂存审阅状态管理：
- `stagedReviewStore` - 管理待审阅内容列表和当前选中内容
- `stagedContentEditorStore` - 管理编辑器状态和修改数据

## 安全考虑

- 遵循ADR-018安全设计
- 暂存数据使用AES-256加密存储
- 写回操作需要用户确认
- 敏感操作需要权限校验
- 完整的审计日志记录

## 性能考虑

- 遵循NFR3响应性要求（界面响应 < 200ms）
- 暂存内容列表分页加载（默认每页20条）
- 写回操作完成后立即更新列表状态
- 过期内容使用后台任务清理
