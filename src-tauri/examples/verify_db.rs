// 数据库验证脚本
// 运行方式: cargo run --example verify_db

use rusqlite::Connection;
use std::path::PathBuf;

fn main() {
    // 获取数据库路径
    let db_path = match find_db_file() {
        Some(path) => path,
        None => {
            println!("❌ 未找到数据库文件！");
            println!("请先启动应用，让数据库文件创建。");
            println!("\n可能的位置:");
            println!("  新路径: {:?}", get_db_path());
            println!("  旧路径: {:?}", get_old_db_path());
            std::process::exit(1);
        }
    };
    println!("✅ 数据库路径: {:?}", db_path);

    // 连接数据库（使用只读模式）
    let conn = Connection::open(&db_path).expect("无法连接数据库");

    println!("\n========== 数据库表结构 ==========\n");

    // 查询所有表
    let mut stmt = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        .expect("无法查询表");

    let tables: Vec<String> = stmt
        .query_map([], |row| row.get(0))
        .expect("无法查询表")
        .filter_map(|r| r.ok())
        .collect();

    for table_name in &tables {
        println!("📋 表名: {}", table_name);

        // 查询表结构
        let mut col_stmt = conn
            .prepare(&format!("PRAGMA table_info({})", table_name))
            .expect("无法查询表结构");

        let columns: Vec<(String, String, bool, bool)> = col_stmt
            .query_map([], |row| {
                let notnull: i32 = row.get(3)?;
                let pk: i32 = row.get(5)?;
                Ok((
                    row.get(1)?, // name
                    row.get(2)?, // type
                    notnull != 0, // notnull
                    pk != 0, // pk
                ))
            })
            .expect("无法查询列")
            .filter_map(|r| r.ok())
            .collect();

        for (name, col_type, notnull, pk) in columns {
            let pk_str = if pk { " [主键]" } else { "" };
            let notnull_str = if notnull { " NOT NULL" } else { "" };
            println!("  - {} ({}){}{}", name, col_type, notnull_str, pk_str);
        }
        println!();
    }

    // 查询迁移版本
    if tables.contains(&"schema_version".to_string()) {
        println!("========== 迁移版本记录 ==========\n");

        let mut ver_stmt = conn
            .prepare("SELECT version, description FROM schema_version ORDER BY version;")
            .expect("无法查询迁移版本");

        let versions: Vec<(i64, String)> = ver_stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .expect("无法查询迁移版本")
            .filter_map(|r| r.ok())
            .collect();

        for (version, description) in versions {
            println!("  v{} - {}", version, description);
        }
    }

    println!("\n✅ 数据库验证完成！");
}

fn get_db_path() -> PathBuf {
    use directories::ProjectDirs;

    // 使用与 sqlite.rs 相同的逻辑
    let project_dirs = ProjectDirs::from("com", "ai-automated-office", "AI-Automated-office")
        .expect("无法获取应用数据目录");

    // 修复后的路径（不含多余的 data 目录）
    let base_dir = project_dirs.data_local_dir().to_path_buf();
    base_dir.join("default").join("local.db")
}

// 兼容旧路径（用于验证迁移后的数据）
fn get_old_db_path() -> PathBuf {
    use directories::ProjectDirs;

    let project_dirs = ProjectDirs::from("com", "ai-automated-office", "AI-Automated-office")
        .expect("无法获取应用数据目录");

    // 旧路径（有多余的 data 目录）
    let base_dir = project_dirs.data_local_dir().to_path_buf();
    base_dir.join("data").join("default").join("local.db")
}

fn find_db_file() -> Option<PathBuf> {
    // 先尝试新路径
    let new_path = get_db_path();
    if new_path.exists() {
        println!("🔍 使用新路径: {:?}", new_path);
        return Some(new_path);
    }

    // 再尝试旧路径
    let old_path = get_old_db_path();
    if old_path.exists() {
        println!("🔍 使用旧路径: {:?}", old_path);
        return Some(old_path);
    }

    None
}
