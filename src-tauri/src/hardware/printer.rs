use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrinterDevice {
    pub id: String,
    pub name: String,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintOptions {
    pub copies: u32,
    pub duplex: bool,
}

/// 列出当前平台可用的打印机设备
#[cfg(target_os = "windows")]
pub async fn list_printers() -> Result<Vec<PrinterDevice>, String> {
    tokio::task::spawn_blocking(list_printers_windows)
        .await
        .map_err(|e| e.to_string())?
}

/// 列出当前平台可用的打印机设备
#[cfg(target_os = "macos")]
pub async fn list_printers() -> Result<Vec<PrinterDevice>, String> {
    tokio::task::spawn_blocking(list_printers_macos)
        .await
        .map_err(|e| e.to_string())?
}

/// 列出当前平台可用的打印机设备
#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub async fn list_printers() -> Result<Vec<PrinterDevice>, String> {
    Ok(Vec::new())
}

/// 执行打印任务
#[cfg(target_os = "windows")]
pub async fn print_document(
    printer_id: String,
    content: Vec<u8>,
    options: PrintOptions,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || print_document_windows(printer_id, content, options))
        .await
        .map_err(|e| e.to_string())?
}

/// 执行打印任务
#[cfg(target_os = "macos")]
pub async fn print_document(
    printer_id: String,
    content: Vec<u8>,
    options: PrintOptions,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || print_document_macos(printer_id, content, options))
        .await
        .map_err(|e| e.to_string())?
}

/// 执行打印任务
#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub async fn print_document(
    _printer_id: String,
    _content: Vec<u8>,
    _options: PrintOptions,
) -> Result<(), String> {
    Ok(())
}

/// 生成打印预览内容
pub async fn print_preview(content: Vec<u8>) -> Result<Vec<u8>, String> {
    Ok(content)
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

/// Windows 打印机枚举实现
#[cfg(target_os = "windows")]
fn list_printers_windows() -> Result<Vec<PrinterDevice>, String> {
    let output = run_command(
        "powershell",
        &[
            "-NoProfile",
            "-Command",
            "Get-Printer | Select-Object -Property Name,Default | ConvertTo-Json",
        ],
    )?;
    if output.is_empty() {
        return Ok(Vec::new());
    }
    let value: Value = serde_json::from_str(&output).map_err(|e| e.to_string())?;
    let mut devices = Vec::new();
    for item in normalize_json_array(value) {
        let name = item
            .get("Name")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        let is_default = item
            .get("Default")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        if !name.is_empty() {
            devices.push(PrinterDevice {
                id: name.clone(),
                name,
                is_default,
            });
        }
    }
    Ok(devices)
}

/// macOS 打印机枚举实现
#[cfg(target_os = "macos")]
fn list_printers_macos() -> Result<Vec<PrinterDevice>, String> {
    let printers_output = run_command("lpstat", &["-p"])?;
    let default_output = run_command("lpstat", &["-d"]).unwrap_or_default();
    let default_name = default_output
        .split(':')
        .nth(1)
        .map(|value| value.trim().to_string())
        .unwrap_or_default();
    let mut devices = Vec::new();
    for line in printers_output.lines() {
        if let Some(name) = line.split_whitespace().nth(1) {
            devices.push(PrinterDevice {
                id: name.to_string(),
                name: name.to_string(),
                is_default: name == default_name,
            });
        }
    }
    Ok(devices)
}

/// Windows 打印实现
#[cfg(target_os = "windows")]
fn print_document_windows(
    printer_id: String,
    content: Vec<u8>,
    options: PrintOptions,
) -> Result<(), String> {
    if printer_id.is_empty() {
        return Err("未指定打印机".to_string());
    }
    let path = write_temp_file(&content)?;
    let escaped_path = path.to_string_lossy().replace('\'', "''");
    let escaped_printer = printer_id.replace('\'', "''");
    let mut command = format!(
        "Start-Process -FilePath '{}' -Verb PrintTo -ArgumentList '{}'",
        escaped_path, escaped_printer
    );
    if options.copies > 1 {
        command = format!("{}; Start-Sleep -Milliseconds 200", command);
    }
    run_command("powershell", &["-NoProfile", "-Command", &command])?;
    Ok(())
}

/// macOS 打印实现
#[cfg(target_os = "macos")]
fn print_document_macos(
    printer_id: String,
    content: Vec<u8>,
    options: PrintOptions,
) -> Result<(), String> {
    if printer_id.is_empty() {
        return Err("未指定打印机".to_string());
    }
    let path = write_temp_file(&content)?;
    let path_str = path.to_string_lossy().to_string();
    let mut args: Vec<String> = Vec::new();
    if options.duplex {
        args.push("-o".to_string());
        args.push("sides=two-sided-long-edge".to_string());
    }
    if options.copies > 1 {
        args.push("-n".to_string());
        args.push(options.copies.to_string());
    }
    args.push("-d".to_string());
    args.push(printer_id);
    args.push(path_str);
    let args_ref: Vec<&str> = args.iter().map(String::as_str).collect();
    run_command("lp", &args_ref)?;
    Ok(())
}

/// 写入临时文件并返回路径
fn write_temp_file(content: &[u8]) -> Result<PathBuf, String> {
    let mut path = std::env::temp_dir();
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis();
    path.push(format!("ai-office-print-{}.pdf", timestamp));
    std::fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path)
}
