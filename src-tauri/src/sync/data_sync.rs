//! Generic Data Sync Engine
//!
//! Extends the sync module to support business data synchronization
//! beyond just messages. Implements ADR-003: local-first + incremental
//! sync + intelligent conflict resolution.
//!
//! Supported sync entities:
//! - hr/employee, hr/department, hr/position
//! - sales/customer, sales/quote, sales/contract
//! - finance/invoice, finance/expense
//! - warehouse/inventory, warehouse/movement
//! - service/ticket
//! - approval/flow, approval/task

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::message_sync::ConflictResolution;

/// Sync entity type (department module + entity)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SyncEntityType {
    HrEmployee,
    HrDepartment,
    HrPosition,
    SalesCustomer,
    SalesQuote,
    SalesContract,
    FinanceInvoice,
    FinanceExpense,
    WarehouseInventory,
    WarehouseMovement,
    ServiceTicket,
    ApprovalFlow,
    ApprovalTask,
    Custom(String),
}

impl std::fmt::Display for SyncEntityType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SyncEntityType::HrEmployee => write!(f, "hr/employee"),
            SyncEntityType::HrDepartment => write!(f, "hr/department"),
            SyncEntityType::HrPosition => write!(f, "hr/position"),
            SyncEntityType::SalesCustomer => write!(f, "sales/customer"),
            SyncEntityType::SalesQuote => write!(f, "sales/quote"),
            SyncEntityType::SalesContract => write!(f, "sales/contract"),
            SyncEntityType::FinanceInvoice => write!(f, "finance/invoice"),
            SyncEntityType::FinanceExpense => write!(f, "finance/expense"),
            SyncEntityType::WarehouseInventory => write!(f, "warehouse/inventory"),
            SyncEntityType::WarehouseMovement => write!(f, "warehouse/movement"),
            SyncEntityType::ServiceTicket => write!(f, "service/ticket"),
            SyncEntityType::ApprovalFlow => write!(f, "approval/flow"),
            SyncEntityType::ApprovalTask => write!(f, "approval/task"),
            SyncEntityType::Custom(s) => write!(f, "{}", s),
        }
    }
}

/// Sync operation type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SyncOperation {
    Create,
    Update,
    Delete,
}

/// A single sync change record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncChange {
    /// Unique change ID
    pub id: String,
    /// Entity type
    pub entity_type: SyncEntityType,
    /// Entity ID
    pub entity_id: String,
    /// Operation type
    pub operation: SyncOperation,
    /// Changed data (serde_json Value)
    pub data: serde_json::Value,
    /// Local timestamp of the change
    pub local_timestamp: i64,
    /// Version number for optimistic concurrency
    pub version: i32,
    /// Tenant ID for multi-tenant isolation
    pub tenant_id: String,
}

/// Detected conflict between local and remote
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConflict {
    /// Conflict ID
    pub id: String,
    /// Entity type
    pub entity_type: SyncEntityType,
    /// Entity ID
    pub entity_id: String,
    /// Local version of the data
    pub local_data: serde_json::Value,
    /// Remote version of the data
    pub remote_data: serde_json::Value,
    /// Local version number
    pub local_version: i32,
    /// Remote version number
    pub remote_version: i32,
    /// Local timestamp
    pub local_timestamp: i64,
    /// Remote timestamp
    pub remote_timestamp: i64,
    /// Resolution strategy (to be decided by user or auto)
    pub resolution: Option<ConflictResolution>,
}

/// Result of a sync operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSyncResult {
    /// Entity type that was synced
    pub entity_type: SyncEntityType,
    /// Number of changes pushed
    pub pushed: u32,
    /// Number of changes pulled
    pub pulled: u32,
    /// Number of conflicts detected
    pub conflicts: u32,
    /// Number of conflicts resolved
    pub resolved: u32,
    /// Sync duration in ms
    pub duration_ms: u64,
    /// Timestamp of this sync
    pub synced_at: i64,
}

/// Sync configuration for an entity type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntitySyncConfig {
    /// Entity type
    pub entity_type: SyncEntityType,
    /// Whether sync is enabled
    pub enabled: bool,
    /// Default conflict resolution strategy
    pub default_resolution: ConflictResolution,
    /// Sync interval in seconds (0 = manual only)
    pub sync_interval_secs: u32,
    /// Batch size for sync operations
    pub batch_size: u32,
}

impl Default for EntitySyncConfig {
    fn default() -> Self {
        Self {
            entity_type: SyncEntityType::Custom("unknown".to_string()),
            enabled: true,
            default_resolution: ConflictResolution::LastWriteWins,
            sync_interval_secs: 300,
            batch_size: 100,
        }
    }
}

/// Generic Data Sync Engine
///
/// Coordinates synchronization of business data between local
/// SQLite and cloud server with conflict detection and resolution.
pub struct DataSyncEngine {
    /// Configuration per entity type
    configs: HashMap<SyncEntityType, EntitySyncConfig>,
}

impl DataSyncEngine {
    /// Create a new engine with default configurations for all supported entities
    pub fn new() -> Self {
        let mut configs = HashMap::new();

        let default_entities = vec![
            SyncEntityType::HrEmployee,
            SyncEntityType::HrDepartment,
            SyncEntityType::HrPosition,
            SyncEntityType::SalesCustomer,
            SyncEntityType::SalesQuote,
            SyncEntityType::SalesContract,
            SyncEntityType::FinanceInvoice,
            SyncEntityType::FinanceExpense,
            SyncEntityType::WarehouseInventory,
            SyncEntityType::WarehouseMovement,
            SyncEntityType::ServiceTicket,
            SyncEntityType::ApprovalFlow,
            SyncEntityType::ApprovalTask,
        ];

        for entity_type in default_entities {
            let et = entity_type.clone();
            configs.insert(entity_type, EntitySyncConfig {
                entity_type: et,
                enabled: true,
                default_resolution: ConflictResolution::LastWriteWins,
                sync_interval_secs: 300,
                batch_size: 100,
            });
        }

        Self { configs }
    }

    /// Get configuration for an entity type
    pub fn get_config(&self, entity_type: &SyncEntityType) -> Option<&EntitySyncConfig> {
        self.configs.get(entity_type)
    }

    /// Update configuration for an entity type
    pub fn set_config(&mut self, config: EntitySyncConfig) {
        self.configs.insert(config.entity_type.clone(), config);
    }

    /// Detect conflicts between local and remote changes
    pub fn detect_conflicts(
        &self,
        local_changes: &[SyncChange],
        remote_changes: &[SyncChange],
    ) -> Vec<SyncConflict> {
        let mut conflicts = Vec::new();

        // Build a map of remote changes by entity_id for quick lookup
        let remote_map: HashMap<&str, &SyncChange> = remote_changes
            .iter()
            .map(|c| (c.entity_id.as_str(), c))
            .collect();

        for local in local_changes {
            if let Some(remote) = remote_map.get(local.entity_id.as_str()) {
                // Same entity modified on both sides → conflict
                if local.version != remote.version {
                    conflicts.push(SyncConflict {
                        id: uuid::Uuid::new_v4().to_string(),
                        entity_type: local.entity_type.clone(),
                        entity_id: local.entity_id.clone(),
                        local_data: local.data.clone(),
                        remote_data: remote.data.clone(),
                        local_version: local.version,
                        remote_version: remote.version,
                        local_timestamp: local.local_timestamp,
                        remote_timestamp: remote.local_timestamp,
                        resolution: None,
                    });
                }
            }
        }

        conflicts
    }

    /// Resolve a conflict using the specified strategy
    pub fn resolve_conflict(
        &self,
        conflict: &SyncConflict,
        strategy: ConflictResolution,
    ) -> serde_json::Value {
        match strategy {
            ConflictResolution::LastWriteWins => {
                if conflict.local_timestamp >= conflict.remote_timestamp {
                    conflict.local_data.clone()
                } else {
                    conflict.remote_data.clone()
                }
            }
            ConflictResolution::KeepLocal => conflict.local_data.clone(),
            ConflictResolution::KeepRemote => conflict.remote_data.clone(),
            ConflictResolution::KeepBoth => {
                // Merge both into an array for user to choose
                serde_json::json!({
                    "local": conflict.local_data,
                    "remote": conflict.remote_data,
                })
            }
            ConflictResolution::Merge => {
                // Smart merge: for simple fields take the newer value, for arrays take union
                match (&conflict.local_data, &conflict.remote_data) {
                    (serde_json::Value::Object(local_map), serde_json::Value::Object(remote_map)) => {
                        let mut merged = serde_json::Map::new();
                        // Collect all keys from both
                        let all_keys: std::collections::HashSet<&String> = local_map.keys().chain(remote_map.keys()).collect();
                        for key in all_keys {
                            let local_val = local_map.get(key);
                            let remote_val = remote_map.get(key);
                            match (local_val, remote_val) {
                                (Some(l), Some(r)) => {
                                    // For arrays, take union; for scalars, take newer
                                    if l.is_array() && r.is_array() {
                                        let l_arr = l.as_array().cloned().unwrap_or_default();
                                        let r_arr = r.as_array().cloned().unwrap_or_default();
                                        let mut arr = l_arr;
                                        for item in &r_arr {
                                            if !arr.contains(item) {
                                                arr.push(item.clone());
                                            }
                                        }
                                        merged.insert(key.clone(), serde_json::Value::Array(arr));
                                    } else {
                                        // Take the value from the newer timestamp
                                        if conflict.local_timestamp >= conflict.remote_timestamp {
                                            merged.insert(key.clone(), l.clone());
                                        } else {
                                            merged.insert(key.clone(), r.clone());
                                        }
                                    }
                                }
                                (Some(v), None) | (None, Some(v)) => {
                                    merged.insert(key.clone(), v.clone());
                                }
                                (None, None) => {}
                            }
                        }
                        serde_json::Value::Object(merged)
                    }
                    _ => {
                        // Fallback: if not objects, use last-write-wins
                        if conflict.local_timestamp >= conflict.remote_timestamp {
                            conflict.local_data.clone()
                        } else {
                            conflict.remote_data.clone()
                        }
                    }
                }
            }
            ConflictResolution::AskUser => {
                // Return conflict details for frontend to handle
                serde_json::json!({
                    "conflict": true,
                    "entity_type": conflict.entity_type,
                    "entity_id": conflict.entity_id,
                    "local_data": conflict.local_data,
                    "remote_data": conflict.remote_data,
                    "local_timestamp": conflict.local_timestamp,
                    "remote_timestamp": conflict.remote_timestamp,
                })
            }
        }
    }

    /// Get all configured entity types
    pub fn configured_entities(&self) -> Vec<&SyncEntityType> {
        self.configs.keys().collect()
    }

    /// Check if sync is enabled for an entity type
    pub fn is_enabled(&self, entity_type: &SyncEntityType) -> bool {
        self.configs.get(entity_type).map(|c| c.enabled).unwrap_or(false)
    }
}

impl Default for DataSyncEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_creation() {
        let engine = DataSyncEngine::new();
        assert!(engine.is_enabled(&SyncEntityType::HrEmployee));
        assert!(engine.is_enabled(&SyncEntityType::SalesCustomer));
        assert!(engine.is_enabled(&SyncEntityType::FinanceInvoice));
        assert!(engine.is_enabled(&SyncEntityType::WarehouseInventory));
        assert!(engine.is_enabled(&SyncEntityType::ServiceTicket));
        assert!(engine.is_enabled(&SyncEntityType::ApprovalFlow));
    }

    #[test]
    fn test_entity_type_display() {
        assert_eq!(SyncEntityType::HrEmployee.to_string(), "hr/employee");
        assert_eq!(SyncEntityType::SalesCustomer.to_string(), "sales/customer");
        assert_eq!(SyncEntityType::FinanceInvoice.to_string(), "finance/invoice");
        assert_eq!(SyncEntityType::WarehouseInventory.to_string(), "warehouse/inventory");
    }

    #[test]
    fn test_conflict_detection() {
        let engine = DataSyncEngine::new();

        let local_changes = vec![SyncChange {
            id: "lc-1".to_string(),
            entity_type: SyncEntityType::HrEmployee,
            entity_id: "emp-001".to_string(),
            operation: SyncOperation::Update,
            data: serde_json::json!({"name": "张三(本地)"}),
            local_timestamp: 1000,
            version: 2,
            tenant_id: "t1".to_string(),
        }];

        let remote_changes = vec![SyncChange {
            id: "rc-1".to_string(),
            entity_type: SyncEntityType::HrEmployee,
            entity_id: "emp-001".to_string(),
            operation: SyncOperation::Update,
            data: serde_json::json!({"name": "张三(远程)"}),
            local_timestamp: 900,
            version: 3,
            tenant_id: "t1".to_string(),
        }];

        let conflicts = engine.detect_conflicts(&local_changes, &remote_changes);
        assert_eq!(conflicts.len(), 1);
        assert_eq!(conflicts[0].entity_id, "emp-001");
    }

    #[test]
    fn test_conflict_no_conflict_same_version() {
        let engine = DataSyncEngine::new();

        let local_changes = vec![SyncChange {
            id: "lc-1".to_string(),
            entity_type: SyncEntityType::HrEmployee,
            entity_id: "emp-001".to_string(),
            operation: SyncOperation::Update,
            data: serde_json::json!({"name": "张三"}),
            local_timestamp: 1000,
            version: 2,
            tenant_id: "t1".to_string(),
        }];

        let remote_changes = vec![SyncChange {
            id: "rc-1".to_string(),
            entity_type: SyncEntityType::HrEmployee,
            entity_id: "emp-001".to_string(),
            operation: SyncOperation::Update,
            data: serde_json::json!({"name": "张三"}),
            local_timestamp: 900,
            version: 2,
            tenant_id: "t1".to_string(),
        }];

        let conflicts = engine.detect_conflicts(&local_changes, &remote_changes);
        assert!(conflicts.is_empty());
    }

    #[test]
    fn test_resolve_conflict_last_write_wins() {
        let engine = DataSyncEngine::new();

        let conflict = SyncConflict {
            id: "c-1".to_string(),
            entity_type: SyncEntityType::HrEmployee,
            entity_id: "emp-001".to_string(),
            local_data: serde_json::json!({"name": "本地版"}),
            remote_data: serde_json::json!({"name": "远程版"}),
            local_version: 2,
            remote_version: 3,
            local_timestamp: 1000,
            remote_timestamp: 900,
            resolution: None,
        };

        // Local is newer → local wins
        let result = engine.resolve_conflict(&conflict, ConflictResolution::LastWriteWins);
        assert_eq!(result["name"], "本地版");
    }

    #[test]
    fn test_resolve_conflict_keep_local() {
        let engine = DataSyncEngine::new();

        let conflict = SyncConflict {
            id: "c-1".to_string(),
            entity_type: SyncEntityType::HrEmployee,
            entity_id: "emp-001".to_string(),
            local_data: serde_json::json!({"name": "本地版"}),
            remote_data: serde_json::json!({"name": "远程版"}),
            local_version: 2,
            remote_version: 3,
            local_timestamp: 1000,
            remote_timestamp: 900,
            resolution: None,
        };

        let result = engine.resolve_conflict(&conflict, ConflictResolution::KeepLocal);
        assert_eq!(result["name"], "本地版");
    }

    #[test]
    fn test_resolve_conflict_keep_remote() {
        let engine = DataSyncEngine::new();

        let conflict = SyncConflict {
            id: "c-1".to_string(),
            entity_type: SyncEntityType::HrEmployee,
            entity_id: "emp-001".to_string(),
            local_data: serde_json::json!({"name": "本地版"}),
            remote_data: serde_json::json!({"name": "远程版"}),
            local_version: 2,
            remote_version: 3,
            local_timestamp: 1000,
            remote_timestamp: 900,
            resolution: None,
        };

        let result = engine.resolve_conflict(&conflict, ConflictResolution::KeepRemote);
        assert_eq!(result["name"], "远程版");
    }

    #[test]
    fn test_set_config() {
        let mut engine = DataSyncEngine::new();

        engine.set_config(EntitySyncConfig {
            entity_type: SyncEntityType::HrEmployee,
            enabled: false,
            default_resolution: ConflictResolution::KeepLocal,
            sync_interval_secs: 600,
            batch_size: 50,
        });

        assert!(!engine.is_enabled(&SyncEntityType::HrEmployee));
        let config = engine.get_config(&SyncEntityType::HrEmployee).unwrap();
        assert_eq!(config.sync_interval_secs, 600);
    }

    #[test]
    fn test_configured_entities_count() {
        let engine = DataSyncEngine::new();
        let entities = engine.configured_entities();
        assert_eq!(entities.len(), 13);
    }
}
