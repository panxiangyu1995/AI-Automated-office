use super::Migration;

const UP_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    session_key TEXT UNIQUE NOT NULL,
    title TEXT,
    plugin_id TEXT,
    metadata TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    synced_at INTEGER,
    is_deleted INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    tool_calls TEXT,
    tool_call_id TEXT,
    metadata TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    operation TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT,
    created_at INTEGER NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    status TEXT DEFAULT 'pending',
    processed_at INTEGER
);

CREATE TABLE IF NOT EXISTS memory_facts (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT,
    confidence REAL DEFAULT 1.0,
    source TEXT,
    embedding BLOB,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_accessed_at INTEGER,
    access_count INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS checkpoints (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    user_input_preview TEXT,
    user_input_full TEXT,
    conversation_turn INTEGER,
    message_ids TEXT,
    git_commit_hash TEXT,
    git_commit_message TEXT,
    artifacts TEXT,
    is_important INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    branch_id TEXT,
    parent_checkpoint_id TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_checkpoint_id) REFERENCES checkpoints(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_session_key ON sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_memory_facts_key ON memory_facts(key);
CREATE INDEX IF NOT EXISTS idx_checkpoints_session ON checkpoints(session_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_created ON checkpoints(created_at);
"#;

pub fn migration() -> Migration {
    Migration {
        version: 1,
        name: "v1_initial",
        up: UP_SQL,
        down: None,
    }
}
