//! Hook system for memory event handling.

pub mod registry;
pub mod dispatcher;
pub mod handlers;

pub use registry::{HookHandler, HookRegistry};
pub use dispatcher::HookDispatcher;
pub use handlers::{
    SessionStartHandler, UserPromptHandler, ToolResultHandler, SessionEndHandler,
};
