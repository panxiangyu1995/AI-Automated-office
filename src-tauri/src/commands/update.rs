use tauri::{ipc::Channel, AppHandle};
use tauri_plugin_updater::UpdaterExt;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub notes: Option<String>,
    pub download_url: Option<String>,
}

/// 检查是否存在可用更新
#[tauri::command]
pub async fn check_update(app: AppHandle) -> Result<Option<UpdateInfo>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await.map_err(|e| e.to_string())? {
        Some(update) => Ok(Some(UpdateInfo {
            version: update.version.clone(),
            current_version: env!("CARGO_PKG_VERSION").to_string(),
            notes: update.body.clone(),
            download_url: None,
        })),
        None => Ok(None),
    }
}

/// 下载并安装更新，同时回传下载进度
#[tauri::command]
pub async fn download_and_install(
    app: AppHandle,
    on_progress: Channel<u8>,
) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        let mut downloaded: u64 = 0;
        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded = downloaded.saturating_add(chunk_length as u64);
                    let total = content_length.unwrap_or(0);
                    let percent = if total == 0 {
                        0
                    } else {
                        ((downloaded as f64 / total as f64) * 100.0).round() as u8
                    };
                    let _ = on_progress.send(percent.min(100));
                },
                || {},
            )
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
