//! Webhook Module
//!
//! Webhook trigger mechanism for external system integration
//! Supports: registration, event triggering, signature verification, retry

pub mod service;

pub use service::{
    CreateWebhookRequest, DeliveryStatus, RetryPolicy, SignatureVerification,
    UpdateWebhookRequest, WebhookDelivery, WebhookEvent, WebhookRegistration,
    WebhookService, WebhookStats,
};