//! Capability Package Lifecycle Hook Framework
//!
//! This module provides a lifecycle hook system for capability packages,
//! allowing plugins to respond to various lifecycle events like
//! load, unload, enable, and disable.

pub mod hook;
pub mod manager;

pub use hook::{LifecycleEvent, LifecycleHook, PluginContext};
pub use manager::LifecycleManager;
