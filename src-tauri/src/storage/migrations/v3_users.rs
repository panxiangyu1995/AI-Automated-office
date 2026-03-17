use super::Migration;

const UP_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    department TEXT,
    role TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
"#;

pub fn migration() -> Migration {
    Migration {
        version: 3,
        name: "v3_users",
        up: UP_SQL,
    }
}
