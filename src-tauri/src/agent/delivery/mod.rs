//! Delivery Module
//!
//! Implements dynamic delivery strategy (ADR-060):
//! - Urgency evaluation based on task type and context
//! - Channel selection (notification/chat/list/workbench)
//! - User preferences and quiet hours handling
//! - Batch aggregation
//!
//! Story 39.1 - 动态投递策略实现

pub mod strategy;

pub use strategy::*;
