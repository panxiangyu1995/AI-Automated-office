# Design: 软件更新机制

## 技术方案

### Tauri Updater 配置

```json
// src-tauri/tauri.conf.json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"
      ],
      "pubkey": "...",
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

### Rust 后端实现

```rust
// src-tauri/src/commands/update.rs
use tauri::{AppHandle, Manager};
use tauri_plugin_updater::{UpdaterExt, Update};

#[derive(serde::Serialize)]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub notes: Option<String>,
    pub download_url: String,
}

#[tauri::command]
pub async fn check_update(app: AppHandle) -> Result<Option<UpdateInfo>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    
    match updater.check().await.map_err(|e| e.to_string())? {
        Some(update) => Ok(Some(UpdateInfo {
            version: update.version.clone(),
            current_version: env!("CARGO_PKG_VERSION").to_string(),
            notes: update.body.clone(),
            download_url: "".to_string(), // 由 Tauri 管理
        })),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn download_and_install(
    app: AppHandle,
    on_progress: tauri::ipc::Channel<u8>,
) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        update
            .download_and_install(
                |chunk_length, content_length| {
                    let _ = on_progress.send(chunk_length as u8);
                },
                || {},
            )
            .await
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}
```

### 前端实现

```typescript
// src/hooks/useUpdate.ts
import { invoke } from '@tauri-apps/api/core'
import { Channel } from '@tauri-apps/api/core'

export interface UpdateInfo {
  version: string
  currentVersion: string
  notes?: string
}

export function useUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)

  const checkUpdate = async (): Promise<UpdateInfo | null> => {
    const info = await invoke<UpdateInfo | null>('check_update')
    setUpdateInfo(info)
    return info
  }

  const downloadAndInstall = async () => {
    setDownloading(true)
    setProgress(0)

    const onProgress = new Channel<number>()
    onProgress.onmessage = (p) => {
      setProgress(p)
    }

    try {
      await invoke('download_and_install', { onProgress })
    } finally {
      setDownloading(false)
    }
  }

  return {
    updateInfo,
    downloading,
    progress,
    checkUpdate,
    downloadAndInstall,
  }
}
```

### 更新提醒组件

```typescript
// src/components/common/UpdateDialog.tsx
import { useUpdate } from '@/hooks/useUpdate'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export function UpdateDialog() {
  const { updateInfo, downloading, progress, downloadAndInstall, dismiss } = useUpdate()

  if (!updateInfo) return null

  return (
    <Dialog open={!!updateInfo} onOpenChange={() => dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>发现新版本 {updateInfo.version}</DialogTitle>
        </DialogHeader>
        
        {updateInfo.notes && (
          <div className="my-4 text-sm text-slate-600 whitespace-pre-wrap">
            {updateInfo.notes}
          </div>
        )}

        {downloading ? (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-slate-500">正在下载... {progress}%</p>
          </div>
        ) : (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={dismiss}>
              稍后提醒
            </Button>
            <Button onClick={downloadAndInstall}>
              立即更新
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

## 更新服务配置

### 服务器端
- 提供 JSON 格式的版本信息
- 存储各平台的安装包
- 支持版本签名验证

### 版本信息格式
```json
{
  "version": "0.2.0",
  "notes": "Bug fixes and improvements",
  "pub_date": "2024-01-15T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "...",
      "url": "https://releases.example.com/v0.2.0/app_0.2.0_x64-setup.exe"
    },
    "darwin-x86_64": {
      "signature": "...",
      "url": "https://releases.example.com/v0.2.0/app_0.2.0_x64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "...",
      "url": "https://releases.example.com/v0.2.0/app_0.2.0_aarch64.app.tar.gz"
    }
  }
}
```

## 安全考虑

1. 使用签名验证更新包完整性
2. 仅从官方服务器下载更新
3. HTTPS 传输更新数据
