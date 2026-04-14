//! Storage module exports.

pub mod backend;
pub mod layer;
pub mod personal;
pub mod enterprise;

pub use backend::{SqliteStorage, StorageBackend, StorageError, StorageResult};
pub use layer::{MemoryStore, PermissionBoundary, PermissionedStore, create_permission_boundary};
pub use personal::PersonalMemoryStore;
pub use enterprise::{EnterpriseKnowledgeStore, DepartmentId, ApprovalStatus, EnterpriseMetadata};
