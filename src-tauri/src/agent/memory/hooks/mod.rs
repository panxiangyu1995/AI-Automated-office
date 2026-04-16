//! Hook system for memory event handling.

pub mod registry;
pub mod dispatcher;
pub mod handlers;

pub use registry::HookRegistry;
pub use dispatcher::HookDispatcher;
