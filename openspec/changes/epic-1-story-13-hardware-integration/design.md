# Design: 本地硬件设备调用

## 技术方案

### Rust 后端实现

```rust
// src-tauri/src/hardware/scanner.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ScannerDevice {
    pub id: String,
    pub name: String,
    pub manufacturer: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanOptions {
    pub resolution: u32,     // DPI
    pub color_mode: String,  // "color", "grayscale", "bw"
    pub page_size: String,   // "a4", "letter", etc.
}

#[tauri::command]
pub async fn list_scanners() -> Result<Vec<ScannerDevice>, String> {
    // 使用平台特定的 API 枚举扫描仪
    #[cfg(target_os = "windows")]
    {
        // Windows: 使用 WIA (Windows Image Acquisition)
        list_scanners_wia()
    }
    #[cfg(target_os = "macos")]
    {
        // macOS: 使用 ImageCaptureCore
        list_scanners_macos()
    }
}

#[tauri::command]
pub async fn scan_document(
    device_id: String,
    options: ScanOptions,
) -> Result<Vec<u8>, String> {
    // 执行扫描并返回图像数据
    // ...
}

// src-tauri/src/hardware/printer.rs
#[derive(Debug, Serialize, Deserialize)]
pub struct PrinterDevice {
    pub id: String,
    pub name: String,
    pub is_default: bool,
}

#[tauri::command]
pub async fn list_printers() -> Result<Vec<PrinterDevice>, String> {
    // 枚举系统打印机
    // ...
}

#[tauri::command]
pub async fn print_document(
    printer_id: String,
    content: Vec<u8>,
    options: PrintOptions,
) -> Result<(), String> {
    // 执行打印
    // ...
}

#[tauri::command]
pub async fn print_preview(content: Vec<u8>) -> Result<String, String> {
    // 生成预览图像
    // ...
}
```

### 前端实现

```typescript
// src/hooks/useHardware.ts
import { invoke } from '@tauri-apps/api/core'

export interface ScannerDevice {
  id: string
  name: string
  manufacturer: string
}

export interface PrinterDevice {
  id: string
  name: string
  isDefault: boolean
}

export function useHardware() {
  const listScanners = async (): Promise<ScannerDevice[]> => {
    return invoke('list_scanners')
  }

  const scanDocument = async (
    deviceId: string,
    options: { resolution: number; colorMode: string; pageSize: string }
  ): Promise<number[]> => {
    return invoke('scan_document', { deviceId, options })
  }

  const listPrinters = async (): Promise<PrinterDevice[]> => {
    return invoke('list_printers')
  }

  const printDocument = async (
    printerId: string,
    content: number[],
    options: { copies: number; duplex: boolean }
  ): Promise<void> => {
    return invoke('print_document', { printerId, content, options })
  }

  return {
    listScanners,
    scanDocument,
    listPrinters,
    printDocument,
  }
}
```

### 设备选择组件

```typescript
// src/components/common/DeviceSelector.tsx
import { useHardware, ScannerDevice, PrinterDevice } from '@/hooks/useHardware'

interface DeviceSelectorProps {
  type: 'scanner' | 'printer'
  onSelect: (device: ScannerDevice | PrinterDevice) => void
}

export function DeviceSelector({ type, onSelect }: DeviceSelectorProps) {
  const { listScanners, listPrinters } = useHardware()
  const [devices, setDevices] = useState<ScannerDevice[] | PrinterDevice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true)
      const result = type === 'scanner' 
        ? await listScanners() 
        : await listPrinters()
      setDevices(result)
      setLoading(false)
    }
    loadDevices()
  }, [type])

  if (loading) {
    return <div>正在检测设备...</div>
  }

  return (
    <div className="space-y-2">
      {devices.map((device) => (
        <button
          key={device.id}
          onClick={() => onSelect(device)}
          className="w-full p-3 border rounded hover:bg-slate-50"
        >
          {device.name}
        </button>
      ))}
    </div>
  )
}
```

## 平台适配

### Windows
- 使用 WIA (Windows Image Acquisition) API 访问扫描仪
- 使用 Win32 Printing API 访问打印机

### macOS
- 使用 ImageCaptureCore 框架访问扫描仪
- 使用 CUPS (Common UNIX Printing System) 访问打印机

## 性能考虑

1. 设备枚举缓存（避免频繁调用）
2. 扫描操作使用异步
3. 大文件分块传输
