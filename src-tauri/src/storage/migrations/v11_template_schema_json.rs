use super::Migration;

const UP_SQL: &str = r#"
-- I1-c: 设计器后端支持 (FR1279-FR1284)
-- 为 templates 表添加 schema_json 列存储结构化模板定义

ALTER TABLE templates ADD COLUMN schema_json TEXT;
"#;

const DOWN_SQL: &str = r#"
-- SQLite 不支持 DROP COLUMN (3.35.0 之前)，但保留 down 脚本
-- 对于 SQLite < 3.35.0 需要重建表，此处仅做标记
SELECT 1;
"#;

pub fn migration() -> Migration {
    Migration {
        version: 11,
        name: "v11_template_schema_json",
        up: UP_SQL,
        down: Some(DOWN_SQL),
    }
}
