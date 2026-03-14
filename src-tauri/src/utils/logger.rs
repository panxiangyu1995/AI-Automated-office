//! 日志工具

use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

/// 初始化日志系统
pub fn init_logger() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,ai_automated_office=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
}
