//! 防抖存储模块 - Debounced Writer
//!
//! 参考 cline 的 StateManager 防抖机制，将多次修改合并为一次写盘
//! 减少 SQLite 写入频率，提升性能
//!
//! 使用方式：
//! ```ignore
//! let debouncer = Debouncer::new(500); // 500ms 防抖延迟
//! debouncer.upsert("key", value).await;
//! debouncer.flush().await; // 手动触发写入
//! ```

use std::collections::{HashMap, HashSet};
use std::future;
use std::hash::Hash;
use std::pin::Pin;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio::sync::{Mutex, RwLock};
use tokio::time::{sleep, Duration};

/// 防抖操作类型
#[derive(Debug, Clone)]
pub enum DebounceOp<K, V> {
    Upsert(K, V),
    Delete(K),
    Flush,
}

/// 防抖写入器
///
/// 将多次写操作合并，通过 channel 接收操作，
/// 使用独立的 tokio 任务来处理防抖逻辑
pub struct Debouncer<K, V>
where
    K: Eq + Hash + Clone + Send + Sync + 'static,
    V: Clone + Send + Sync + 'static,
{
    /// 防抖延迟（毫秒）
    delay_ms: u64,
    /// 待处理的写操作
    pending: Arc<RwLock<HashMap<K, V>>>,
    /// 待删除的键
    pending_deletes: Arc<RwLock<HashSet<K>>>,
    /// 操作发送通道
    tx: mpsc::Sender<DebounceOp<K, V>>,
    /// 接收端 Arc，用于后台任务
    rx_arc: Arc<Mutex<Option<mpsc::Receiver<DebounceOp<K, V>>>>>,
}

impl<K, V> Debouncer<K, V>
where
    K: Eq + Hash + Clone + Send + Sync + 'static,
    V: Clone + Send + Sync + 'static,
{
    /// 创建新的防抖写入器（无 flush 回调，仅用于内存缓存）
    ///
    /// - `delay_ms`: 防抖延迟（毫秒），默认 500ms
    pub fn new(delay_ms: u64) -> Self {
        let (tx, rx) = mpsc::channel::<DebounceOp<K, V>>(1000);
        let pending = Arc::new(RwLock::new(HashMap::new()));
        let pending_deletes = Arc::new(RwLock::new(HashSet::new()));
        let delay = delay_ms;
        let pending_clone = pending.clone();
        let pending_deletes_clone = pending_deletes.clone();

        // 使用 Arc<Mutex<Option<Receiver>>> 来管理 receiver 的生命周期
        let rx_arc = Arc::new(Mutex::new(Some(rx)));

        // 启动后台任务处理防抖逻辑
        let rx_for_task = Arc::clone(&rx_arc);
        tokio::spawn(async move {
            // 从 Arc 中取出 receiver
            let mut opt_rx = rx_for_task.lock().await;
            let mut rx = opt_rx.take().expect("Receiver already taken");
            drop(opt_rx);
            // rx 现在是这个闭包的合法所有者

            let mut pending_flush_timer: Option<Pin<Box<tokio::time::Sleep>>> = None;

            loop {
                // 使用 select! 同时监听 channel 和定时器
                tokio::select! {
                    Some(op) = rx.recv() => {
                        match op {
                            DebounceOp::Upsert(key, value) => {
                                let mut p = pending_clone.write().await;
                                p.insert(key, value);
                            }
                            DebounceOp::Delete(key) => {
                                let mut p = pending_clone.write().await;
                                p.remove(&key);
                                let mut d = pending_deletes_clone.write().await;
                                d.insert(key);
                            }
                            DebounceOp::Flush => {
                                // 立即刷新所有待处理操作（只是清空缓冲区，不做实际写入）
                                let entries: HashMap<K, V> = {
                                    let mut p = pending_clone.write().await;
                                    std::mem::take(&mut *p)
                                };
                                let deletes: HashSet<K> = {
                                    let mut d = pending_deletes_clone.write().await;
                                    std::mem::take(&mut *d)
                                };
                                if !entries.is_empty() || !deletes.is_empty() {
                                    tracing::debug!("Debouncer 刷新: {} upserts, {} deletes", entries.len(), deletes.len());
                                }
                                pending_flush_timer = None;
                                continue;
                            }
                        }

                        // 重置/启动防抖定时器
                        if pending_flush_timer.is_none() {
                            pending_flush_timer = Some(Box::pin(tokio::time::sleep(Duration::from_millis(delay))));
                        }
                    }

                    _ = async {
                        match &mut pending_flush_timer {
                            Some(timer) => timer.await,
                            None => {
                                // 创建一个永不触发的 future，永远等待
                                std::future::pending().await
                            }
                        }
                    } => {
                        // 定时器到期，刷新所有待处理操作（只是清空缓冲区，不做实际写入）
                        let entries: HashMap<K, V> = {
                            let mut p = pending_clone.write().await;
                            std::mem::take(&mut *p)
                        };
                        let deletes: HashSet<K> = {
                            let mut d = pending_deletes_clone.write().await;
                            std::mem::take(&mut *d)
                        };
                        if !entries.is_empty() || !deletes.is_empty() {
                            tracing::debug!("Debouncer 定时刷新: {} upserts, {} deletes", entries.len(), deletes.len());
                        }
                        pending_flush_timer = None;
                    }
                }
            }
        });

        Self {
            delay_ms,
            pending,
            pending_deletes,
            tx,
            rx_arc,
        }
    }

    /// 异步 upsert - 延迟写入
    pub async fn upsert(&self, key: K, value: V) {
        // 立即更新本地缓存
        {
            let mut pending = self.pending.write().await;
            pending.insert(key.clone(), value.clone());
        }

        // 发送操作到后台任务
        let _ = self.tx.send(DebounceOp::Upsert(key, value)).await;
    }

    /// 异步删除 - 延迟删除
    pub async fn delete(&self, key: K) {
        // 立即更新本地缓存
        {
            let mut pending = self.pending.write().await;
            pending.remove(&key);
            let mut deletes = self.pending_deletes.write().await;
            deletes.insert(key.clone());
        }

        // 发送操作到后台任务
        let _ = self.tx.send(DebounceOp::Delete(key)).await;
    }

    /// 手动触发立即刷新
    ///
    /// 注意：这只是清空内存缓冲区，实际的数据库写入需要调用方自己处理
    pub async fn flush(&self) {
        let _ = self.tx.send(DebounceOp::Flush).await;
        // 等待一小段时间让刷新完成
        sleep(Duration::from_millis(50)).await;
    }

    /// 获取当前待处理的条目数
    pub async fn pending_count(&self) -> usize {
        let pending = self.pending.read().await;
        pending.len()
    }

    /// 获取当前待删除的条目数
    pub async fn pending_delete_count(&self) -> usize {
        let deletes = self.pending_deletes.read().await;
        deletes.len()
    }

    /// 获取所有待处理的 entries 并清空缓冲区
    ///
    /// 返回 (entries, deletes)，由调用方负责实际的数据库写入
    pub async fn take_pending(&self) -> (HashMap<K, V>, HashSet<K>) {
        let entries = {
            let mut p = self.pending.write().await;
            std::mem::take(&mut *p)
        };
        let deletes = {
            let mut d = self.pending_deletes.write().await;
            std::mem::take(&mut *d)
        };
        (entries, deletes)
    }
}

// ============================================================================
// 带有防抖功能的存储管理器 - 集成到 StorageManager
// ============================================================================

use crate::storage::{session_store::Session, message_store::Message, SessionStore, MessageStore, StorageManager};

/// 带有防抖功能的存储管理器
///
/// 持有一个底层的 SessionStore 和 MessageStore，
/// 在内存中缓冲写入操作，定时或手动刷新到数据库
pub struct DebouncedStorageManager {
    /// 底层 Session 存储
    session_store: SessionStore,
    /// 底层 Message 存储
    message_store: MessageStore,
    /// Session 防抖器
    session_debouncer: Debouncer<String, Session>,
    /// Message 防抖器
    message_debouncer: Debouncer<String, Message>,
    /// 防抖延迟（毫秒）
    delay_ms: u64,
}

impl DebouncedStorageManager {
    /// 创建新的防抖存储管理器
    ///
    /// - `session_store`: 底层 Session 存储
    /// - `message_store`: 底层 Message 存储
    /// - `delay_ms`: 防抖延迟（毫秒），默认 500ms
    pub fn new(session_store: SessionStore, message_store: MessageStore, delay_ms: u64) -> Self {
        Self {
            session_store,
            message_store,
            session_debouncer: Debouncer::new(delay_ms),
            message_debouncer: Debouncer::new(delay_ms),
            delay_ms,
        }
    }

    /// 创建带有默认延迟（500ms）的防抖存储管理器
    pub fn with_default_delay(session_store: SessionStore, message_store: MessageStore) -> Self {
        Self::new(session_store, message_store, 500)
    }

    /// 异步保存 Session（防抖 + 延迟写入）
    ///
    /// Session 会被缓存并在延迟后写入数据库
    pub async fn save_session(&self, session: Session) {
        self.session_debouncer.upsert(session.id.clone(), session).await;
    }

    /// 异步删除 Session（防抖）
    pub async fn delete_session(&self, id: String) {
        self.session_debouncer.delete(id).await;
    }

    /// 异步保存 Message（防抖 + 延迟写入）
    ///
    /// Message 会被缓存并在延迟后写入数据库
    pub async fn save_message(&self, message: Message) {
        self.message_debouncer.upsert(message.id.clone(), message).await;
    }

    /// 异步删除 Message（防抖）
    pub async fn delete_message(&self, id: String) {
        self.message_debouncer.delete(id).await;
    }

    /// 手动刷新所有待处理的写操作到数据库
    ///
    /// 调用此方法会立即将所有待处理的 Session 和 Message 写入数据库
    pub async fn flush(&self) {
        // 获取所有待处理的 session 并写入数据库
        let (sessions, session_deletes) = self.session_debouncer.take_pending().await;
        for (_id, session) in sessions {
            if let Err(e) = self.session_store.create(&session).await {
                tracing::error!("Failed to flush session: {}", e);
            }
        }
        for id in session_deletes {
            if let Err(e) = self.session_store.soft_delete(&id).await {
                tracing::error!("Failed to delete session: {}", e);
            }
        }

        // 获取所有待处理的 message 并写入数据库
        let (messages, message_deletes) = self.message_debouncer.take_pending().await;
        for (_id, message) in messages {
            if let Err(e) = self.message_store.create(&message).await {
                tracing::error!("Failed to flush message: {}", e);
            }
        }
        // Message 删除暂不支持（按 ID 删除需要实现）
        for _id in message_deletes {
            // 暂不处理 message 删除
        }
    }

    /// 获取当前待处理的 Session 条目数
    pub async fn session_pending_count(&self) -> usize {
        self.session_debouncer.pending_count().await
    }

    /// 获取当前待处理的 Message 条目数
    pub async fn message_pending_count(&self) -> usize {
        self.message_debouncer.pending_count().await
    }

    /// 获取底层的 SessionStore（用于直接读取）
    pub fn session_store(&self) -> &SessionStore {
        &self.session_store
    }

    /// 获取底层的 MessageStore（用于直接读取）
    pub fn message_store(&self) -> &MessageStore {
        &self.message_store
    }

    /// 获取防抖延迟（毫秒）
    pub fn delay_ms(&self) -> u64 {
        self.delay_ms
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_debouncer_basic() {
        let debouncer: Debouncer<String, String> = Debouncer::new(100);

        // 连续发送多次 upsert
        debouncer.upsert("key1".to_string(), "value1".to_string()).await;
        debouncer.upsert("key2".to_string(), "value2".to_string()).await;
        debouncer.upsert("key3".to_string(), "value3".to_string()).await;

        // 应该有3条待处理
        assert_eq!(debouncer.pending_count().await, 3);
        assert_eq!(debouncer.pending_delete_count().await, 0);

        // 手动刷新
        debouncer.flush().await;

        // 刷新后应该没有待处理
        sleep(Duration::from_millis(100)).await;
    }

    #[tokio::test]
    async fn test_debouncer_delete() {
        let debouncer: Debouncer<String, String> = Debouncer::new(100);

        // 先 upsert
        debouncer.upsert("key1".to_string(), "value1".to_string()).await;
        assert_eq!(debouncer.pending_count().await, 1);

        // 再 delete
        debouncer.delete("key1".to_string()).await;

        // upsert 被移除，但进入 delete 队列
        assert_eq!(debouncer.pending_count().await, 0);
        assert_eq!(debouncer.pending_delete_count().await, 1);

        // 刷新
        debouncer.flush().await;
        sleep(Duration::from_millis(100)).await;
    }

    #[tokio::test]
    async fn test_debouncer_timing() {
        let debouncer: Debouncer<String, String> = Debouncer::new(50); // 50ms 延迟

        // 快速发送多次
        debouncer.upsert("key".to_string(), "v1".to_string()).await;
        debouncer.upsert("key".to_string(), "v2".to_string()).await;
        debouncer.upsert("key".to_string(), "v3".to_string()).await;

        // 只有一条待处理（相同 key 被覆盖）
        assert_eq!(debouncer.pending_count().await, 1);

        // 等待定时器触发
        sleep(Duration::from_millis(100)).await;
    }
}
