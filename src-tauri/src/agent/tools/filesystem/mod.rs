//! Filesystem tools module.
//!
//! Split into submodules for maintainability:
//! - read.rs: FileReadExecutor (file_read tool)
//! - write.rs: FileWriteExecutor (file_write tool)
//! - edit.rs: FileEditExecutor (file_edit tool)
//! - dir.rs: DirListExecutor (dir_list tool)
//! - mod.rs: Config, helpers, and registration

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::RwLock;

use crate::agent::tools::pipeline::ToolExecutor;
use crate::agent::tools::registry::ToolRegistry;

pub mod dir;
pub mod edit;
pub mod read;
pub mod write;

pub use dir::{create_dir_list_descriptor, DirListExecutor};
pub use edit::{create_file_edit_descriptor, FileEditExecutor};
pub use read::{create_file_read_descriptor, FileReadExecutor};
pub use write::{create_file_write_descriptor, FileWriteExecutor};

/// Configuration for filesystem tools
#[derive(Clone)]
pub struct FilesystemConfig {
    allowed_dirs: Vec<PathBuf>,
    max_file_size: u64,
    read_only_by_default: bool,
}

impl Default for FilesystemConfig {
    fn default() -> Self {
        Self {
            allowed_dirs: vec![
                dirs::home_dir().unwrap_or_else(|| PathBuf::from(".")),
                std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            ],
            max_file_size: 10 * 1024 * 1024,
            read_only_by_default: false,
        }
    }
}

impl FilesystemConfig {
    pub fn new(allowed_dirs: Vec<PathBuf>) -> Self {
        Self {
            allowed_dirs,
            ..Default::default()
        }
    }

    pub fn is_allowed(&self, path: &Path) -> bool {
        let canonical_path = match path.canonicalize() {
            Ok(p) => p,
            Err(_) => {
                if let Some(parent) = path.parent() {
                    return self.is_allowed(parent);
                }
                return false;
            }
        };
        self.allowed_dirs.iter().any(|allowed| canonical_path.starts_with(allowed))
    }

    pub fn max_file_size(&self) -> u64 {
        self.max_file_size
    }
}

static FS_CONFIG: RwLock<Option<FilesystemConfig>> = RwLock::new(None);

fn get_or_init_config() -> FilesystemConfig {
    let config = FS_CONFIG.read().unwrap();
    if let Some(ref cfg) = *config {
        return cfg.clone();
    }
    drop(config);
    let mut write = FS_CONFIG.write().unwrap();
    if write.is_none() {
        *write = Some(FilesystemConfig::default());
    }
    write.clone().unwrap()
}

pub fn set_config(config: FilesystemConfig) {
    let mut cfg = FS_CONFIG.write().unwrap();
    *cfg = Some(config);
}

pub fn get_config() -> FilesystemConfig {
    get_or_init_config()
}

/// Register all filesystem tools
pub fn register_filesystem_tools(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let descriptor = create_file_read_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(FileReadExecutor));

    let descriptor = create_file_write_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(FileWriteExecutor));

    let descriptor = create_file_edit_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(FileEditExecutor));

    let descriptor = create_dir_list_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(DirListExecutor));
}
