import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { useHardware, type PrinterDevice, type ScannerDevice } from '../../hooks/useHardware'

interface DeviceSelectorProps {
  type: 'scanner' | 'printer'
  onSelect: (device: ScannerDevice | PrinterDevice) => void
  onError?: (message: string) => void
}

/**
 * 设备选择组件
 */
export function DeviceSelector({ type, onSelect, onError }: DeviceSelectorProps) {
  const { listScanners, listPrinters } = useHardware()
  const [devices, setDevices] = useState<Array<ScannerDevice | PrinterDevice>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => (type === 'scanner' ? '扫描仪' : '打印机'), [type])

  /**
   * 加载设备列表
   */
  const loadDevices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = type === 'scanner' ? await listScanners() : await listPrinters()
      setDevices(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : '设备列表加载失败'
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }, [listPrinters, listScanners, onError, type])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  if (loading) {
    return <div className="text-sm text-slate-500">正在检测{title}设备...</div>
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-red-500">{error}</div>
        <Button variant="outline" size="sm" onClick={loadDevices}>
          重新加载
        </Button>
      </div>
    )
  }

  if (!devices.length) {
    return <div className="text-sm text-slate-500">未检测到{title}设备</div>
  }

  return (
    <div className="space-y-2">
      {devices.map((device) => (
        <Button
          key={`${type}-${device.id}`}
          variant="outline"
          className="w-full justify-between"
          onClick={() => onSelect(device)}
        >
          <span className="truncate">{device.name}</span>
          {'isDefault' in device && device.isDefault ? (
            <span className="text-xs text-emerald-600">默认</span>
          ) : null}
        </Button>
      ))}
    </div>
  )
}
