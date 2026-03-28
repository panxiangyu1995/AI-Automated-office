use super::Migration;

const UP_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS session_summaries (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    key_facts TEXT,
    statistics TEXT,
    token_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    expires_at INTEGER,
    is_active INTEGER DEFAULT 1,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_summaries_session ON session_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_active ON session_summaries(is_active);
CREATE INDEX IF NOT EXISTS idx_session_summaries_expires ON session_summaries(expires_at);
"#;

const DOWN_SQL: &str = r#"
DROP TABLE IF EXISTS session_summaries;
"#;

pub fn migration() -> Migration {
    Migration {
        version: 4,
        name: "v4_session_summaries",
        up: UP_SQL,
        down: Some(DOWN_SQL),
    }
}
