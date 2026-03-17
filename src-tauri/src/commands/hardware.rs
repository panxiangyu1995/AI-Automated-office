use crate::hardware::printer as printer;
use crate::hardware::scanner as scanner;
use crate::hardware::printer::{PrintOptions, PrinterDevice};
use crate::hardware::scanner::{ScanOptions, ScannerDevice};

/// 获取扫描仪设备列表
#[tauri::command]
pub async fn list_scanners() -> Result<Vec<ScannerDevice>, String> {
    scanner::list_scanners().await
}

/// 执行扫描并返回图像字节数据
#[tauri::command]
pub async fn scan_document(device_id: String, options: ScanOptions) -> Result<Vec<u8>, String> {
    scanner::scan_document(device_id, options).await
}

/// 获取打印机设备列表
#[tauri::command]
pub async fn list_printers() -> Result<Vec<PrinterDevice>, String> {
    printer::list_printers().await
}

/// 执行打印任务
#[tauri::command]
pub async fn print_document(
    printer_id: String,
    content: Vec<u8>,
    options: PrintOptions,
) -> Result<(), String> {
    printer::print_document(printer_id, content, options).await
}

/// 生成打印预览内容
#[tauri::command]
pub async fn print_preview(content: Vec<u8>) -> Result<Vec<u8>, String> {
    printer::print_preview(content).await
}
