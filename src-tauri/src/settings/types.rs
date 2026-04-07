//! Settings 模块类型

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantInfo {
    pub id: String,
    pub name: String,
    pub plan: String,
    pub max_users: i32,
    pub features: Vec<String>,
}
