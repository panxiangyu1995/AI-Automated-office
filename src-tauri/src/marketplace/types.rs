//! Marketplace 模块类型

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketplacePlugin {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub category: String,
    pub icon: Option<String>,
    pub author: String,
    pub installed: bool,
    pub enabled: bool,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginStats {
    pub total_plugins: i64,
    pub installed: i64,
    pub categories: Vec<String>,
}
