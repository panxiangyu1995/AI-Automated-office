// 布局组件导出
export { AppLayout } from './AppLayout'
export { TopBar } from './TopBar'
export { ActivityBar } from './ActivityBar'
export { Sidebar } from './Sidebar'
export { Workbench } from './Workbench'
export { WorkbenchHostErrorBoundary, WorkbenchHostRenderer } from './workbenchHost'
export type {
  WorkbenchFieldPermission,
  WorkbenchHostDescriptor,
  WorkbenchHostMode,
  WorkbenchPageContext,
  WorkbenchPermissionContext,
} from './workbenchHost'
export { AiChatPanel } from './AiChatPanel'
export { BottomPanel } from './BottomPanel'
export { StatusBar } from './StatusBar'
export { ResizablePanel } from './ResizablePanel'
export { OfflineIndicator } from './OfflineIndicator'
export { DeviceSelector } from './DeviceSelector'
export { SessionExpiredModal } from './SessionExpiredModal'
export type { SessionExpiredReason } from './SessionExpiredModal'

// 硬件相关对话框
export { ScanDialog } from './ScanDialog'
export { PrintDialog } from './PrintDialog'
export { HardwareDialog } from './HardwareDialog'
