//! Marketplace 数据库层
//!
//! 使用内存 HashMap 持久化插件数据（初始化时加载默认插件，运行时修改保持）

use crate::marketplace::types::*;
use std::collections::HashMap;
use std::sync::RwLock;

pub struct MarketplaceDatabase {
    plugins: RwLock<HashMap<String, MarketplacePlugin>>,
}

impl MarketplaceDatabase {
    pub fn new() -> Self {
        let db = Self {
            plugins: RwLock::new(HashMap::new()),
        };
        db.init_defaults();
        db
    }

    fn init_defaults(&self) {
        let defaults = vec![
            MarketplacePlugin {
                id: "after-sales".to_string(),
                name: "售后服务".to_string(),
                description: "客户反馈、工单管理".to_string(),
                version: "1.0.0".to_string(),
                category: "business".to_string(),
                icon: None,
                author: "官方".to_string(),
                installed: true,
                enabled: true,
                price: 0.0,
            },
            MarketplacePlugin {
                id: "tender".to_string(),
                name: "招投标".to_string(),
                description: "标书制定、投标管理".to_string(),
                version: "1.0.0".to_string(),
                category: "business".to_string(),
                icon: None,
                author: "官方".to_string(),
                installed: true,
                enabled: true,
                price: 0.0,
            },
            MarketplacePlugin {
                id: "marketing".to_string(),
                name: "市场宣传".to_string(),
                description: "营销物料、宣传推广".to_string(),
                version: "1.0.0".to_string(),
                category: "business".to_string(),
                icon: None,
                author: "官方".to_string(),
                installed: true,
                enabled: true,
                price: 0.0,
            },
            MarketplacePlugin {
                id: "knowledge".to_string(),
                name: "知识库".to_string(),
                description: "企业知识沉淀、RAG检索".to_string(),
                version: "1.0.0".to_string(),
                category: "ai".to_string(),
                icon: None,
                author: "官方".to_string(),
                installed: true,
                enabled: true,
                price: 0.0,
            },
            MarketplacePlugin {
                id: "dashboard-pro".to_string(),
                name: "高级看板".to_string(),
                description: "自定义图表、数据可视化".to_string(),
                version: "1.0.0".to_string(),
                category: "analytics".to_string(),
                icon: None,
                author: "官方".to_string(),
                installed: false,
                enabled: false,
                price: 199.0,
            },
        ];

        let mut plugins = self.plugins.write().unwrap();
        for plugin in defaults {
            plugins.insert(plugin.id.clone(), plugin);
        }
    }

    pub fn list_plugins(&self) -> Vec<MarketplacePlugin> {
        let plugins = self.plugins.read().unwrap();
        let mut list: Vec<MarketplacePlugin> = plugins.values().cloned().collect();
        list.sort_by(|a, b| a.id.cmp(&b.id));
        list
    }

    pub fn install_plugin(&self, id: &str) -> Result<(), String> {
        let mut plugins = self.plugins.write().unwrap();
        if let Some(p) = plugins.get_mut(id) {
            p.installed = true;
            Ok(())
        } else {
            Err(format!("插件 {} 不存在", id))
        }
    }

    pub fn uninstall_plugin(&self, id: &str) -> Result<(), String> {
        let mut plugins = self.plugins.write().unwrap();
        if let Some(p) = plugins.get_mut(id) {
            p.installed = false;
            p.enabled = false;
            Ok(())
        } else {
            Err(format!("插件 {} 不存在", id))
        }
    }

    pub fn enable_plugin(&self, id: &str) -> Result<(), String> {
        let plugins = self.plugins.read().unwrap();
        if let Some(p) = plugins.get(id) {
            if !p.installed {
                return Err("请先安装插件".to_string());
            }
        } else {
            return Err(format!("插件 {} 不存在", id));
        }
        drop(plugins);

        let mut plugins = self.plugins.write().unwrap();
        if let Some(p) = plugins.get_mut(id) {
            p.enabled = true;
        }
        Ok(())
    }

    pub fn disable_plugin(&self, id: &str) -> Result<(), String> {
        let mut plugins = self.plugins.write().unwrap();
        if let Some(p) = plugins.get_mut(id) {
            p.enabled = false;
            Ok(())
        } else {
            Err(format!("插件 {} 不存在", id))
        }
    }

    pub fn get_stats(&self) -> PluginStats {
        let plugins = self.plugins.read().unwrap();
        let installed = plugins.values().filter(|p| p.installed).count() as i64;
        let mut categories: Vec<String> = plugins
            .values()
            .map(|p| p.category.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();
        categories.sort();
        PluginStats {
            total_plugins: plugins.len() as i64,
            installed,
            categories,
        }
    }
}
