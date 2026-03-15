# Design: 离线模式支持

## 技术方案

### 网络状态检测

```typescript
// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'

export interface NetworkStatus {
  isOnline: boolean
  lastOnlineTime: Date | null
  pendingSyncCount: number
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    pendingSyncCount: 0,
  })

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: true,
        lastOnlineTime: new Date(),
      }))
    }

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 监听 Tauri 后端网络状态
    const unlisten = listen('network-status-change', (event) => {
      setStatus((prev) => ({
        ...prev,
        isOnline: event.payload as boolean,
        lastOnlineTime: event.payload ? new Date() : prev.lastOnlineTime,
      }))
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unlisten.then((fn) => fn())
    }
  }, [])

  return status
}
```

### 离线提示组件

```typescript
// src/components/common/OfflineIndicator.tsx
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { WifiOff, CloudSync } from 'lucide-react'

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount } = useNetworkStatus()

  if (isOnline && pendingSyncCount === 0) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>离线模式 - 部分功能可能不可用</span>
        </div>
      )}
      {isOnline && pendingSyncCount > 0 && (
        <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-center gap-2">
          <CloudSync className="w-4 h-4 animate-spin" />
          <span>正在同步 {pendingSyncCount} 条数据...</span>
        </div>
      )}
    </div>
  )
}
```

### 同步队列管理

```rust
// src-tauri/src/sync/queue.rs
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncItem {
    pub id: i64,
    pub entity_type: String,
    pub entity_id: String,
    pub action: String, // create, update, delete
    pub data: String,   // JSON
    pub created_at: i64,
}

pub struct SyncQueue {
    pool: SqlitePool,
}

impl SyncQueue {
    pub async fn add(&self, item: SyncItem) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "INSERT INTO sync_queue (entity_type, entity_id, action, data, created_at) VALUES (?, ?, ?, ?, ?)",
            item.entity_type, item.entity_id, item.action, item.data, item.created_at
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn get_pending(&self) -> Result<Vec<SyncItem>, sqlx::Error> {
        sqlx::query_as!(SyncItem, "SELECT * FROM sync_queue ORDER BY created_at")
            .fetch_all(&self.pool)
            .await
    }

    pub async fn remove(&self, id: i64) -> Result<(), sqlx::Error> {
        sqlx::query!("DELETE FROM sync_queue WHERE id = ?", id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
```

## 数据库设计

```sql
-- 同步队列表
CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- 创建索引
CREATE INDEX idx_sync_queue_created ON sync_queue(created_at);
```

## 性能考虑

1. 网络状态检测使用防抖
2. 同步队列批量处理
3. 本地操作优先，同步异步执行
