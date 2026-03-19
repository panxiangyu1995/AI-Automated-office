# Design: Import and Export UI

## 技术方案

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Import/Export Page                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Tabs                              │   │
│  │  [导入用户]  [导出用户]                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  导入 Tab:                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Import Wizard                        │   │
│  │                                                     │   │
│  │  Step 1: 上传文件                                   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  📁 拖拽或点击上传 Excel 文件               │   │   │
│  │  │  支持格式: .xlsx  最大: 10MB               │   │   │
│  │  │  [下载模板]                                 │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  Step 2: 预览数据                                   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  统计: 成功 50 | 冲突 5 | 错误 3           │   │   │
│  │  │  [冲突列表] [错误列表]                      │   │   │
│  │  │  <数据预览表格>                             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  Step 3: 确认导入                                   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  冲突处理: ○跳过 ○更新 ○报错               │   │   │
│  │  │  [确认导入]                                 │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  Step 4: 导入结果                                   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  ✅ 导入完成                                │   │   │
│  │  │  成功: 52 | 失败: 3                        │   │   │
│  │  │  [下载回执] [查看失败详情]                  │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  导出 Tab:                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Export Panel                         │   │
│  │                                                     │   │
│  │  导出范围:                                          │   │
│  │  ○ 全部用户                                        │   │
│  │  ○ 按部门: [选择部门...]                          │   │
│  │  ○ 按条件: [筛选条件...]                          │   │
│  │                                                     │   │
│  │  导出字段:                                          │   │
│  │  ☑ 用户名 ☑ 姓名 ☑ 工号 ☑ 部门 ...              │   │
│  │                                                     │   │
│  │  [导出]                                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 组件设计

#### 1. ImportWizard 导入向导

```tsx
// src/features/hr/components/ImportExport/ImportWizard.tsx
import { useState } from 'react';
import { Steps } from '@/components/ui/steps';

type Step = 'upload' | 'preview' | 'confirm' | 'result';

export function ImportWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  
  const steps = [
    { id: 'upload', title: '上传文件' },
    { id: 'preview', title: '预览数据' },
    { id: 'confirm', title: '确认导入' },
    { id: 'result', title: '导入结果' },
  ];
  
  return (
    <div className="import-wizard">
      <Steps current={currentStep} items={steps} />
      
      <div className="wizard-content">
        {currentStep === 'upload' && (
          <ImportUpload 
            onSuccess={(id, data) => {
              setBatchId(id);
              setPreviewData(data);
              setCurrentStep('preview');
            }}
          />
        )}
        
        {currentStep === 'preview' && (
          <ImportPreview 
            data={previewData}
            onNext={() => setCurrentStep('confirm')}
            onBack={() => setCurrentStep('upload')}
          />
        )}
        
        {currentStep === 'confirm' && (
          <ImportConfirm 
            batchId={batchId}
            conflictCount={previewData?.conflict_count || 0}
            onSuccess={(result) => {
              setResultData(result);
              setCurrentStep('result');
            }}
            onBack={() => setCurrentStep('preview')}
          />
        )}
        
        {currentStep === 'result' && (
          <ImportResult 
            data={resultData}
            onReset={() => {
              setBatchId(null);
              setPreviewData(null);
              setCurrentStep('upload');
            }}
          />
        )}
      </div>
    </div>
  );
}
```

#### 2. ImportUpload 上传组件

```tsx
// src/features/hr/components/ImportExport/ImportUpload.tsx
import { Upload, Button } from '@/components/ui';
import { useMutation } from '@tanstack/react-query';

interface ImportUploadProps {
  onSuccess: (batchId: string, data: ImportPreviewResponse) => void;
}

export function ImportUpload({ onSuccess }: ImportUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  
  const previewMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/api/admin/users/import/preview', formData);
    },
    onSuccess: (response) => {
      onSuccess(response.batch_id, response);
    },
  });
  
  return (
    <div className="import-upload">
      <Upload.Dragger
        accept=".xlsx"
        maxSize={10 * 1024 * 1024}
        beforeUpload={(file) => {
          setFile(file);
          return false;
        }}
      >
        <div className="upload-hint">
          <Icon name="upload" size={48} />
          <p>拖拽或点击上传 Excel 文件</p>
          <p className="text-muted">支持格式: .xlsx  最大: 10MB</p>
        </div>
      </Upload.Dragger>
      
      <div className="upload-actions">
        <Button 
          variant="outline" 
          onClick={() => window.open('/api/admin/users/import/template')}
        >
          下载模板
        </Button>
        
        <Button 
          type="primary"
          loading={previewMutation.isPending}
          disabled={!file}
          onClick={() => file && previewMutation.mutate(file)}
        >
          上传并预览
        </Button>
      </div>
    </div>
  );
}
```

#### 3. ImportPreview 预览组件

```tsx
// src/features/hr/components/ImportExport/ImportPreview.tsx
import { Table, Tag, Badge, Collapse } from '@/components/ui';

interface ImportPreviewProps {
  data: ImportPreviewResponse;
  onNext: () => void;
  onBack: () => void;
}

export function ImportPreview({ data, onNext, onBack }: ImportPreviewProps) {
  return (
    <div className="import-preview">
      <div className="preview-stats">
        <Card>
          <Statistic title="总行数" value={data.total_count} />
        </Card>
        <Card>
          <Statistic title="可导入" value={data.success_count} valueStyle={{ color: '#3f8600' }} />
        </Card>
        <Card>
          <Statistic title="冲突" value={data.conflict_count} valueStyle={{ color: '#faad14' }} />
        </Card>
        <Card>
          <Statistic title="错误" value={data.error_count} valueStyle={{ color: '#cf1322' }} />
        </Card>
      </div>
      
      {data.conflicts.length > 0 && (
        <Collapse>
          <Panel header={`冲突列表 (${data.conflicts.length})`} key="conflicts">
            <Table 
              dataSource={data.conflicts}
              columns={[
                { title: '行号', dataIndex: 'row_number' },
                { title: '字段', dataIndex: 'field' },
                { title: '值', dataIndex: 'value' },
                { title: '冲突类型', dataIndex: 'conflict_type', render: renderConflictType },
                { title: '建议', dataIndex: 'suggestion' },
              ]}
              size="small"
            />
          </Panel>
        </Collapse>
      )}
      
      {data.errors.length > 0 && (
        <Collapse>
          <Panel header={`错误列表 (${data.errors.length})`} key="errors">
            <Table 
              dataSource={data.errors}
              columns={[
                { title: '行号', dataIndex: 'row_number' },
                { title: '字段', dataIndex: 'field' },
                { title: '值', dataIndex: 'value' },
                { title: '错误', dataIndex: 'message' },
              ]}
              size="small"
            />
          </Panel>
        </Collapse>
      )}
      
      <div className="preview-actions">
        <Button onClick={onBack}>重新上传</Button>
        <Button type="primary" onClick={onNext}>
          下一步：确认导入
        </Button>
      </div>
    </div>
  );
}
```

#### 4. ExportPanel 导出面板

```tsx
// src/features/hr/components/ImportExport/ExportPanel.tsx
import { useState } from 'react';
import { Form, Select, Checkbox, Button } from '@/components/ui';

export function ExportPanel() {
  const [exportScope, setExportScope] = useState<'all' | 'department' | 'filter'>('all');
  const [selectedFields, setSelectedFields] = useState<string[]>(ALL_FIELDS);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  
  const exportMutation = useMutation({
    mutationFn: () => apiClient.post('/api/admin/users/export', {
      scope: exportScope,
      department_id: selectedDepartment,
      fields: selectedFields,
    }),
    onSuccess: (blob) => {
      // 下载文件
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${Date.now()}.xlsx`;
      a.click();
    },
  });
  
  return (
    <div className="export-panel">
      <Form layout="vertical">
        <Form.Item label="导出范围">
          <Radio.Group value={exportScope} onChange={e => setExportScope(e.target.value)}>
            <Radio value="all">全部用户</Radio>
            <Radio value="department">按部门</Radio>
            <Radio value="filter">按筛选条件</Radio>
          </Radio.Group>
        </Form.Item>
        
        {exportScope === 'department' && (
          <Form.Item label="选择部门">
            <DepartmentSelect 
              value={selectedDepartment}
              onChange={setSelectedDepartment}
            />
          </Form.Item>
        )}
        
        <Form.Item label="导出字段">
          <Checkbox.Group
            value={selectedFields}
            onChange={setSelectedFields}
            options={FIELD_OPTIONS}
          />
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary"
            loading={exportMutation.isPending}
            onClick={() => exportMutation.mutate()}
          >
            导出
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

const ALL_FIELDS = ['username', 'real_name', 'employee_code', 'email', 'phone', 'department', 'position', 'status'];

const FIELD_OPTIONS = [
  { label: '用户名', value: 'username' },
  { label: '姓名', value: 'real_name' },
  { label: '工号', value: 'employee_code' },
  { label: '邮箱', value: 'email' },
  { label: '手机', value: 'phone' },
  { label: '部门', value: 'department' },
  { label: '岗位', value: 'position' },
  { label: '状态', value: 'status' },
];
```

### 数据流

```
Upload File
     │
     ▼
┌─────────────┐
│  Preview    │──► POST /import/preview
│  API        │◄── batch_id + preview data
└─────────────┘
     │
     ▼
┌─────────────┐
│  Confirm    │──► POST /import/commit
│  API        │◄── result data
└─────────────┘
     │
     ▼
┌─────────────┐
│  Receipt    │──► GET /import/batches/:id/receipt
│  Download   │◄── Excel file
└─────────────┘
```

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐
│ ImportExport  │────►│  Import APIs  │
│     UI        │     │  (后端接口)   │
└───────────────┘     └───────────────┘
        │
        │
        ▼
┌───────────────┐
│  Department   │
│   Selector    │
└───────────────┘
```