/**
 * 用户导入导出页面
 *
 * @module ImportExportPage
 * @description 用户数据导入导出管理界面
 */

import { useState, useCallback, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  importApi,
  exportApi,
  generateIdempotencyKey,
  triggerFileDownload,
} from '../api/importApi'
import type {
  ImportStep,
  ImportPreviewResponse,
  ImportPreviewItem,
  ImportReceipt,
  ConflictPolicy,
  ExportScopeType,
  ExportableField,
} from '../types/import.types'

// 步骤指示器组件
function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
          </div>
          <span
            className={`text-sm ${
              index === currentStep ? 'font-medium text-gray-900' : 'text-gray-500'
            }`}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-300" />
          )}
        </div>
      ))}
    </div>
  )
}

// 文件上传区域组件
function FileUploadZone({
  onFileSelect,
  isUploading,
}: {
  onFileSelect: (file: File) => void
  isUploading: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.name.endsWith('.xlsx')) {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importApi.downloadTemplate()
      triggerFileDownload(blob, 'user_import_template.xlsx')
    } catch (err) {
      console.error('下载模板失败:', err)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={`flex h-48 w-full max-w-md cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Upload className="h-6 w-6 text-blue-500" />
          </div>
        )}
        <div className="text-center">
          <p className="text-base font-medium text-gray-900">
            {isUploading ? '正在上传...' : '拖拽或点击上传 Excel 文件'}
          </p>
          <p className="text-sm text-gray-500">支持格式: .xlsx  最大: 10MB</p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <div className="flex gap-4">
        <Button variant="outline" onClick={handleDownloadTemplate} disabled={isUploading}>
          <Download className="mr-2 h-4 w-4" />
          下载模板
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          <Upload className="mr-2 h-4 w-4" />
          上传并预览
        </Button>
      </div>
    </div>
  )
}

// 预览数据表格组件
function PreviewDataTable({
  items,
  conflicts,
}: {
  items: ImportPreviewItem[]
  conflicts: ImportPreviewItem[]
}) {
  return (
    <div className="space-y-4">
      {/* 冲突提示 */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>发现 {conflicts.length} 条冲突数据</AlertTitle>
          <AlertDescription>
            请选择冲突处理策略或逐行处理冲突数据
          </AlertDescription>
        </Alert>
      )}

      {/* 数据表格 */}
      <ScrollArea className="h-80 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">行号</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>工号</TableHead>
              <TableHead>部门</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>说明</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.row_number}>
                <TableCell>{item.row_number}</TableCell>
                <TableCell>{item.username}</TableCell>
                <TableCell>{item.real_name}</TableCell>
                <TableCell>{item.employee_code}</TableCell>
                <TableCell>{item.department}</TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {item.conflict_message || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}

// 状态徽章组件
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    valid: { label: '有效', variant: 'default' },
    conflict: { label: '冲突', variant: 'destructive' },
    error: { label: '错误', variant: 'secondary' },
    pending: { label: '待处理', variant: 'outline' },
  }
  const { label, variant } = config[status] || { label: status, variant: 'outline' }
  return <Badge variant={variant}>{label}</Badge>
}

// 结果展示组件
function ResultView({
  receipt,
  onDownloadReceipt,
}: {
  receipt: ImportReceipt
  onDownloadReceipt: () => void
}) {
  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{receipt.total_rows}</div>
            <div className="text-sm text-gray-500">总行数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{receipt.success_rows}</div>
            <div className="text-sm text-gray-500">成功导入</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{receipt.skipped_rows}</div>
            <div className="text-sm text-gray-500">跳过</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{receipt.failed_rows}</div>
            <div className="text-sm text-gray-500">失败</div>
          </CardContent>
        </Card>
      </div>

      {/* 结果表格 */}
      <ScrollArea className="h-60 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">行号</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>说明</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipt.items.map((item) => (
              <TableRow key={item.row_number}>
                <TableCell>{item.row_number}</TableCell>
                <TableCell>{item.username}</TableCell>
                <TableCell>{item.real_name}</TableCell>
                <TableCell>
                  {item.status === 'success' && <Badge variant="default">成功</Badge>}
                  {item.status === 'skipped' && <Badge variant="secondary">跳过</Badge>}
                  {item.status === 'failed' && <Badge variant="destructive">失败</Badge>}
                </TableCell>
                <TableCell className="text-sm text-gray-500">{item.message || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* 下载回执 */}
      <div className="flex justify-center">
        <Button onClick={onDownloadReceipt}>
          <Download className="mr-2 h-4 w-4" />
          下载回执文件
        </Button>
      </div>
    </div>
  )
}

// 导出面板组件
function ExportPanel() {
  const [scopeType, setScopeType] = useState<ExportScopeType>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [exportableFields, setExportableFields] = useState<ExportableField[]>([])
  const [isExporting, setIsExporting] = useState(false)

  // 加载可导出字段
  useState(() => {
    exportApi.getExportableFields().then((fields) => {
      setExportableFields(fields)
      setSelectedFields(fields.filter((f) => f.default).map((f) => f.key))
    })
  })

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey) ? prev.filter((k) => k !== fieldKey) : [...prev, fieldKey]
    )
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      return
    }

    setIsExporting(true)
    try {
      const response = await exportApi.exportUsers({
        scope: {
          type: scopeType,
          department_id: scopeType === 'department' ? selectedDepartment : undefined,
        },
        fields: selectedFields,
      })

      const blob = await exportApi.downloadExport(response.download_url)
      triggerFileDownload(blob, `users_export_${Date.now()}.xlsx`)
    } catch (err) {
      console.error('导出失败:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        {/* 导出范围 */}
        <div className="space-y-4">
          <h3 className="text-base font-medium">导出范围</h3>
          <RadioGroup value={scopeType} onValueChange={(v) => setScopeType(v as ExportScopeType)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">全部用户</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="department" id="department" />
              <Label htmlFor="department">按部门:</Label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                disabled={scopeType !== 'department'}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="请选择部门..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dept-1">技术部</SelectItem>
                  <SelectItem value="dept-2">产品部</SelectItem>
                  <SelectItem value="dept-3">运营部</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="filter" id="filter" />
              <Label htmlFor="filter">按条件:</Label>
              <Select disabled={scopeType !== 'filter'}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="请选择筛选条件..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">在职员工</SelectItem>
                  <SelectItem value="inactive">离职员工</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </RadioGroup>
        </div>

        {/* 导出字段 */}
        <div className="space-y-4">
          <h3 className="text-base font-medium">导出字段</h3>
          <div className="flex flex-wrap gap-4">
            {exportableFields.map((field) => (
              <div key={field.key} className="flex items-center space-x-2">
                <Checkbox
                  id={field.key}
                  checked={selectedFields.includes(field.key)}
                  onCheckedChange={() => handleFieldToggle(field.key)}
                />
                <Label htmlFor={field.key}>{field.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* 导出按钮 */}
        <div className="flex justify-center">
          <Button
            onClick={handleExport}
            disabled={selectedFields.length === 0 || isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            导出
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 主页面组件
export default function ImportExportPage() {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null)
  const [receipt, setReceipt] = useState<ImportReceipt | null>(null)
  const [conflictPolicy, setConflictPolicy] = useState<ConflictPolicy>('skip')
  const [isUploading, setIsUploading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const steps = ['上传文件', '预览数据', '确认导入', '导入结果']
  const stepIndex = { upload: 0, preview: 1, confirm: 2, result: 3 }

  // 处理文件上传
  const handleFileSelect = async (file: File) => {
    setIsUploading(true)
    try {
      const data = await importApi.uploadAndPreview(file)
      setPreviewData(data)
      setCurrentStep('preview')
    } catch (err) {
      console.error('上传失败:', err)
    } finally {
      setIsUploading(false)
    }
  }

  // 处理确认导入
  const handleConfirmImport = async () => {
    if (!previewData) return

    setIsConfirming(true)
    try {
      const response = await importApi.confirmImport({
        batch_id: previewData.batch_id,
        idempotency_key: generateIdempotencyKey(),
        conflict_policy: conflictPolicy,
      })

      // 获取回执
      const receiptData = await importApi.getReceipt(response.batch_id)
      setReceipt(receiptData)
      setCurrentStep('result')
    } catch (err) {
      console.error('导入失败:', err)
    } finally {
      setIsConfirming(false)
    }
  }

  // 处理下载回执
  const handleDownloadReceipt = async () => {
    if (!receipt) return
    try {
      const blob = await importApi.downloadReceiptExcel(receipt.batch_id)
      triggerFileDownload(blob, `import_receipt_${receipt.batch_id}.xlsx`)
    } catch (err) {
      console.error('下载回执失败:', err)
    }
  }

  // 重置导入流程
  const handleReset = () => {
    setCurrentStep('upload')
    setPreviewData(null)
    setReceipt(null)
    setConflictPolicy('skip')
  }

  // 冲突数据
  const conflictItems = previewData?.preview_items.filter((item) => item.status === 'conflict') || []

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* 页面标题 */}
      <div className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
        <h1 className="text-lg font-semibold text-gray-900">用户数据管理</h1>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="import" className="h-full">
          <TabsList className="mb-4">
            <TabsTrigger value="import">导入用户</TabsTrigger>
            <TabsTrigger value="export">导出用户</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-0">
            <Card className="mx-auto max-w-4xl">
              <CardContent className="space-y-6 p-6">
                {/* 步骤指示器 */}
                <StepIndicator steps={steps} currentStep={stepIndex[currentStep]} />

                {/* 上传步骤 */}
                {currentStep === 'upload' && (
                  <FileUploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
                )}

                {/* 预览步骤 */}
                {currentStep === 'preview' && previewData && (
                  <div className="space-y-6">
                    {/* 统计信息 */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="rounded-lg bg-blue-50 p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{previewData.total_rows}</div>
                        <div className="text-sm text-gray-500">总行数</div>
                      </div>
                      <div className="rounded-lg bg-green-50 p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{previewData.valid_rows}</div>
                        <div className="text-sm text-gray-500">有效</div>
                      </div>
                      <div className="rounded-lg bg-yellow-50 p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{previewData.conflict_rows}</div>
                        <div className="text-sm text-gray-500">冲突</div>
                      </div>
                      <div className="rounded-lg bg-red-50 p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{previewData.error_rows}</div>
                        <div className="text-sm text-gray-500">错误</div>
                      </div>
                    </div>

                    {/* 预览数据 */}
                    <PreviewDataTable items={previewData.preview_items} conflicts={conflictItems} />

                    {/* 冲突处理策略 */}
                    {conflictItems.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">冲突处理策略</h3>
                        <RadioGroup
                          value={conflictPolicy}
                          onValueChange={(v) => setConflictPolicy(v as ConflictPolicy)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="skip" id="skip" />
                            <Label htmlFor="skip">跳过冲突行</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="update" id="update" />
                            <Label htmlFor="update">更新已有数据</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="create" id="create" />
                            <Label htmlFor="create">创建新记录（添加后缀）</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" onClick={handleReset}>
                        重新上传
                      </Button>
                      <Button onClick={() => setCurrentStep('confirm')} disabled={previewData.valid_rows === 0}>
                        确认并继续
                      </Button>
                    </div>
                  </div>
                )}

                {/* 确认步骤 */}
                {currentStep === 'confirm' && previewData && (
                  <div className="space-y-6 text-center">
                    <div className="rounded-lg bg-blue-50 p-6">
                      <FileSpreadsheet className="mx-auto mb-4 h-12 w-12 text-blue-500" />
                      <h3 className="mb-2 text-lg font-medium">确认导入</h3>
                      <p className="text-sm text-gray-600">
                        即将导入 {previewData.valid_rows} 条有效数据
                        {conflictItems.length > 0 && `，跳过 ${conflictItems.length} 条冲突数据`}
                      </p>
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button variant="outline" onClick={() => setCurrentStep('preview')}>
                        返回修改
                      </Button>
                      <Button onClick={handleConfirmImport} disabled={isConfirming}>
                        {isConfirming ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        确认导入
                      </Button>
                    </div>
                  </div>
                )}

                {/* 结果步骤 */}
                {currentStep === 'result' && receipt && (
                  <div className="space-y-6">
                    <ResultView receipt={receipt} onDownloadReceipt={handleDownloadReceipt} />
                    <div className="flex justify-center">
                      <Button variant="outline" onClick={handleReset}>
                        继续导入
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="mt-0">
            <div className="mx-auto max-w-4xl">
              <ExportPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
