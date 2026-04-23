import { useCallback } from 'react'
import { safeInvoke } from '@/lib/tauri'

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
    const result = await safeInvoke<ScannerDevice[]>('list_scanners')
    return result ?? []
  }, [])

  /**
   * 执行扫描并返回图像字节数据
   */
  const scanDocument = useCallback(
    async (deviceId: string, options: ScanOptions): Promise<number[]> => {
      const result = await safeInvoke<number[]>('scan_document', { deviceId, options })
      return result ?? []
    },
    []
  )

  /**
   * 获取打印机设备列表
   */
  const listPrinters = useCallback(async (): Promise<PrinterDevice[]> => {
    const result = await safeInvoke<PrinterDevice[]>('list_printers')
    return result ?? []
  }, [])

  /**
   * 执行打印任务
   */
  const printDocument = useCallback(
    async (printerId: string, content: number[], options: PrintOptions): Promise<void> => {
      await safeInvoke('print_document', { printerId, content, options })
    },
    []
  )

  /**
   * 生成打印预览内容
   */
  const printPreview = useCallback(async (content: number[]): Promise<number[]> => {
    const result = await safeInvoke<number[]>('print_preview', { content })
    return result ?? []
  }, [])

  return {
    listScanners,
    scanDocument,
    listPrinters,
    printDocument,
    printPreview,
  }
}
