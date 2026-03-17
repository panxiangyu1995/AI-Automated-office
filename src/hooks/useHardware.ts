import { useCallback } from 'react'
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

export interface ScanOptions {
  resolution: number
  colorMode: string
  pageSize: string
}

export interface PrintOptions {
  copies: number
  duplex: boolean
}

/**
 * 硬件设备调用 Hook
 */
export function useHardware() {
  /**
   * 获取扫描仪设备列表
   */
  const listScanners = useCallback(async (): Promise<ScannerDevice[]> => {
    return invoke('list_scanners')
  }, [])

  /**
   * 执行扫描并返回图像字节数据
   */
  const scanDocument = useCallback(
    async (deviceId: string, options: ScanOptions): Promise<number[]> => {
      return invoke('scan_document', { deviceId, options })
    },
    []
  )

  /**
   * 获取打印机设备列表
   */
  const listPrinters = useCallback(async (): Promise<PrinterDevice[]> => {
    return invoke('list_printers')
  }, [])

  /**
   * 执行打印任务
   */
  const printDocument = useCallback(
    async (printerId: string, content: number[], options: PrintOptions): Promise<void> => {
      return invoke('print_document', { printerId, content, options })
    },
    []
  )

  /**
   * 生成打印预览内容
   */
  const printPreview = useCallback(async (content: number[]): Promise<number[]> => {
    return invoke('print_preview', { content })
  }, [])

  return {
    listScanners,
    scanDocument,
    listPrinters,
    printDocument,
    printPreview,
  }
}
