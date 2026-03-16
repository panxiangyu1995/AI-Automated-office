use super::Migration;

const UP_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS context_summaries (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    covered_turns_start INTEGER,
    covered_turns_end INTEGER,
    summary_text TEXT,
    key_entities TEXT,
    decisions TEXT,
    tokens_saved INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
"#;

pub fn migration() -> Migration {
    Migration {
        version: 2,
        name: "v2_context_summaries",
        up: UP_SQL,
    }
}
