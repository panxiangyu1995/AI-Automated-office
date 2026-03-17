use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannerDevice {
    pub id: String,
    pub name: String,
    pub manufacturer: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanOptions {
    pub resolution: u32,
    pub color_mode: String,
    pub page_size: String,
}

/// 列出当前平台可用的扫描仪设备
#[cfg(target_os = "windows")]
pub async fn list_scanners() -> Result<Vec<ScannerDevice>, String> {
    tokio::task::spawn_blocking(list_scanners_windows)
        .await
        .map_err(|e| e.to_string())?
}

/// 列出当前平台可用的扫描仪设备
#[cfg(target_os = "macos")]
pub async fn list_scanners() -> Result<Vec<ScannerDevice>, String> {
    tokio::task::spawn_blocking(list_scanners_macos)
        .await
        .map_err(|e| e.to_string())?
}

/// 列出当前平台可用的扫描仪设备
#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub async fn list_scanners() -> Result<Vec<ScannerDevice>, String> {
    Ok(Vec::new())
}

/// 执行扫描并返回图像字节数据
#[cfg(target_os = "windows")]
pub async fn scan_document(device_id: String, options: ScanOptions) -> Result<Vec<u8>, String> {
    tokio::task::spawn_blocking(move || scan_document_windows(device_id, options))
        .await
        .map_err(|e| e.to_string())?
}

/// 执行扫描并返回图像字节数据
#[cfg(target_os = "macos")]
pub async fn scan_document(device_id: String, options: ScanOptions) -> Result<Vec<u8>, String> {
    tokio::task::spawn_blocking(move || scan_document_macos(device_id, options))
        .await
        .map_err(|e| e.to_string())?
}

/// 执行扫描并返回图像字节数据
#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub async fn scan_document(_device_id: String, _options: ScanOptions) -> Result<Vec<u8>, String> {
    Ok(placeholder_scan_image())
}

/// 执行系统命令并返回标准输出
fn run_command(program: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new(program)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(stderr.trim().to_string());
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

/// 将 JSON 输出解析为列表
fn normalize_json_array(value: Value) -> Vec<Value> {
    match value {
        Value::Array(items) => items,
        Value::Object(_) => vec![value],
        _ => Vec::new(),
    }
}

/// Windows 扫描仪枚举实现
#[cfg(target_os = "windows")]
fn list_scanners_windows() -> Result<Vec<ScannerDevice>, String> {
    let output = run_command(
        "powershell",
        &[
            "-NoProfile",
            "-Command",
            "Get-PnpDevice -Class Image | Select-Object -Property InstanceId,FriendlyName,Manufacturer | ConvertTo-Json",
        ],
    )?;
    if output.is_empty() {
        return Ok(Vec::new());
    }
    let value: Value = serde_json::from_str(&output).map_err(|e| e.to_string())?;
    let mut devices = Vec::new();
    for item in normalize_json_array(value) {
        let id = item
            .get("InstanceId")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        let name = item
            .get("FriendlyName")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        let manufacturer = item
            .get("Manufacturer")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();
        if !name.is_empty() {
            devices.push(ScannerDevice {
                id: if id.is_empty() { name.clone() } else { id },
                name,
                manufacturer,
            });
        }
    }
    Ok(devices)
}

/// macOS 扫描仪枚举实现
#[cfg(target_os = "macos")]
fn list_scanners_macos() -> Result<Vec<ScannerDevice>, String> {
    let output = run_command("system_profiler", &["SPUSBDataType", "-json"])?;
    if output.is_empty() {
        return Ok(Vec::new());
    }
    let value: Value = serde_json::from_str(&output).map_err(|e| e.to_string())?;
    let mut devices = Vec::new();
    collect_usb_scanners(&value, &mut devices);
    Ok(devices)
}

/// 递归收集 USB 扫描仪设备
#[cfg(target_os = "macos")]
fn collect_usb_scanners(value: &Value, devices: &mut Vec<ScannerDevice>) {
    match value {
        Value::Array(items) => {
            for item in items {
                collect_usb_scanners(item, devices);
            }
        }
        Value::Object(map) => {
            if let Some(name) = map.get("_name").and_then(|v| v.as_str()) {
                let name_lower = name.to_lowercase();
                let class_hint = map
                    .get("device_class")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_lowercase();
                if name_lower.contains("scan") || class_hint.contains("image") {
                    let manufacturer = map
                        .get("manufacturer")
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown")
                        .to_string();
                    let id = map
                        .get("serial_num")
                        .and_then(|v| v.as_str())
                        .or_else(|| map.get("location_id").and_then(|v| v.as_str()))
                        .unwrap_or(name)
                        .to_string();
                    devices.push(ScannerDevice {
                        id,
                        name: name.to_string(),
                        manufacturer,
                    });
                }
            }
            if let Some(items) = map.get("_items") {
                collect_usb_scanners(items, devices);
            }
        }
        _ => {}
    }
}

/// Windows 扫描实现（当前为占位返回）
#[cfg(target_os = "windows")]
fn scan_document_windows(_device_id: String, _options: ScanOptions) -> Result<Vec<u8>, String> {
    Ok(placeholder_scan_image())
}

/// macOS 扫描实现（当前为占位返回）
#[cfg(target_os = "macos")]
fn scan_document_macos(_device_id: String, _options: ScanOptions) -> Result<Vec<u8>, String> {
    Ok(placeholder_scan_image())
}

/// 提供默认的扫描占位图像
fn placeholder_scan_image() -> Vec<u8> {
    vec![
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0,
        0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156,
        99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66,
        96, 130,
    ]
}
