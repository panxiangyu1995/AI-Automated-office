//! Tool execution pipeline for the Agent runtime.

pub mod automation;
pub mod browser;
pub mod core;
pub mod descriptor;
pub mod document;
pub mod enterprise;
pub mod filesystem;
pub mod finance;
pub mod media;
pub mod memory;
pub mod permission;
pub mod pipeline;
pub mod profile;
pub mod registry;
pub mod sensitivity;
pub mod sessions;
pub mod shell;
pub mod web;

pub use descriptor::*;
pub use pipeline::*;
pub use profile::*;
pub use registry::*;
