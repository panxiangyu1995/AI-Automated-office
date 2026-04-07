//! Marketplace 模块 Tauri 命令

use crate::marketplace::types::*;
use std::sync::Mutex;
use tauri::State;

pub struct MarketplaceState {
    pub plugins: Mutex<Vec<MarketplacePlugin>>,
}

impl MarketplaceState {
    pub fn new() -> Self {
        let plugins = vec![
            MarketplacePlugin { id: "after-sales".to_string(), name: "售后服务".to_string(), description: "客户反馈、工单管理".to_string(), version: "1.0.0".to_string(), category: "business".to_string(), icon: None, author: "官方".to_string(), installed: false, enabled: false, price: 0.0 },
            MarketplacePlugin { id: "tender".to_string(), name: "招投标".to_string(), description: "标书制定、投标管理".to_string(), version: "1.0.0".to_string(), category: "business".to_string(), icon: None, author: "官方".to_string(), installed: false, enabled: false, price: 0.0 },
            MarketplacePlugin { id: "marketing".to_string(), name: "市场宣传".to_string(), description: "营销物料、宣传推广".to_string(), version: "1.0.0".to_string(), category: "business".to_string(), icon: None, author: "官方".to_string(), installed: false, enabled: false, price: 0.0 },
            MarketplacePlugin { id: "knowledge".to_string(), name: "知识库".to_string(), description: "企业知识沉淀、RAG检索".to_string(), version: "1.0.0".to_string(), category: "ai".to_string(), icon: None, author: "官方".to_string(), installed: false, enabled: false, price: 0.0 },
            MarketplacePlugin { id: "dashboard-pro".to_string(), name: "高级看板".to_string(), description: "自定义图表、数据可视化".to_string(), version: "1.0.0".to_string(), category: "analytics".to_string(), icon: None, author: "官方".to_string(), installed: false, enabled: false, price: 199.0 },
        ];
        Self { plugins: Mutex::new(plugins) }
    }
}

impl Default for MarketplaceState { fn default() -> Self { Self::new() } }

#[tauri::command]
pub async fn marketplace_list_plugins(state: State<'_, MarketplaceState>) -> Result<Vec<MarketplacePlugin>, String> {
    Ok(state.plugins.lock().unwrap().clone())
}

#[tauri::command]
pub async fn marketplace_install_plugin(state: State<'_, MarketplaceState>, id: String) -> Result<(), String> {
    let mut plugins = state.plugins.lock().unwrap();
    if let Some(p) = plugins.iter_mut().find(|p| p.id == id) {
        p.installed = true;
    }
    Ok(())
}

#[tauri::command]
pub async fn marketplace_uninstall_plugin(state: State<'_, MarketplaceState>, id: String) -> Result<(), String> {
    let mut plugins = state.plugins.lock().unwrap();
    if let Some(p) = plugins.iter_mut().find(|p| p.id == id) {
        p.installed = false;
        p.enabled = false;
    }
    Ok(())
}

#[tauri::command]
pub async fn marketplace_enable_plugin(state: State<'_, MarketplaceState>, id: String) -> Result<(), String> {
    let plugins = state.plugins.lock().unwrap();
    if let Some(p) = plugins.iter().find(|p| p.id == id) {
        if !p.installed { return Err("请先安装插件".into()); }
    }
    drop(plugins);
    let mut p = state.plugins.lock().unwrap();
    if let Some(p) = p.iter_mut().find(|p| p.id == id) { p.enabled = true; }
    Ok(())
}

#[tauri::command]
pub async fn marketplace_get_stats(state: State<'_, MarketplaceState>) -> Result<PluginStats, String> {
    let plugins = state.plugins.lock().unwrap();
    let installed = plugins.iter().filter(|p| p.installed).count() as i64;
    let mut categories = plugins.iter().map(|p| p.category.clone()).collect::<std::collections::HashSet<_>>().into_iter().collect::<Vec<_>>();
    categories.sort();
    Ok(PluginStats { total_plugins: plugins.len() as i64, installed, categories })
}
