//! Enterprise tools - type definitions and configuration



/// Database query configuration
#[derive(Clone)]
pub struct DbQueryConfig {
    /// Allowed tables for query (whitelist)
    pub allowed_tables: Vec<&'static str>,
    /// Maximum rows returned
    pub max_rows: u32,
    /// Query timeout in seconds
    pub timeout_seconds: u64,
}

impl Default for DbQueryConfig {
    fn default() -> Self {
        Self {
            // Default whitelist - system config tables only
            allowed_tables: vec![
                "users",
                "sessions",
                "messages",
                "workspaces",
                "projects",
                "settings",
            ],
            max_rows: 1000,
            timeout_seconds: 30,
        }
    }
}

/// Sensitive fields that should be masked
pub const SENSITIVE_FIELDS: &[&str] = &[
    "password",
    "token",
    "secret",
    "api_key",
    "private_key",
    "access_token",
    "refresh_token",
];

/// Global db query config
pub static DB_QUERY_CONFIG: std::sync::RwLock<Option<DbQueryConfig>> =
    std::sync::RwLock::new(None);

pub fn get_or_init_db_config() -> DbQueryConfig {
    let config = DB_QUERY_CONFIG.read().unwrap();
    if let Some(ref cfg) = *config {
        return cfg.clone();
    }
    drop(config);
    let mut write = DB_QUERY_CONFIG.write().unwrap();
    if write.is_none() {
        *write = Some(DbQueryConfig::default());
    }
    write.clone().unwrap()
}

/// Delegation configuration
#[derive(Clone)]
pub struct DelegationConfig {
    pub max_depth: u32,
    pub default_ttl_seconds: i64,
}

impl Default for DelegationConfig {
    fn default() -> Self {
        Self {
            max_depth: 3,
            default_ttl_seconds: 3600, // 1 hour
        }
    }
}

/// Global delegation config
pub static DELEGATION_CONFIG: std::sync::RwLock<Option<DelegationConfig>> =
    std::sync::RwLock::new(None);

pub fn get_or_init_delegation_config() -> DelegationConfig {
    let config = DELEGATION_CONFIG.read().unwrap();
    if let Some(ref cfg) = *config {
        return cfg.clone();
    }
    drop(config);
    let mut write = DELEGATION_CONFIG.write().unwrap();
    if write.is_none() {
        *write = Some(DelegationConfig::default());
    }
    write.clone().unwrap()
}
