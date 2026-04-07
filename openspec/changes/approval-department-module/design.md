# Design: Approval审批中心模块

## 数据模型

```typescript
interface ApprovalFlow {
  id: string;
  name: string;
  description: string;
  steps: ApprovalStep[];
  formSchema: FormSchema;
  status: 'draft' | 'active' | 'archived';
}

interface ApprovalStep {
  id: string;
  order: number;
  approvers: Approver[];
  type: 'sequential' | 'parallel';
  condition?: ApprovalCondition;
}

interface ApprovalRecord {
  id: string;
  flowId: string;
  applicantId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  currentStep: number;
  formData: Record<string, unknown>;
  history: ApprovalHistory[];
}
```

## API 设计

```typescript
POST   /api/approval/flows                    // 创建流程
GET    /api/approval/flows                   // 流程列表
POST   /api/approval/records                 // 发起审批
GET    /api/approval/records/:id             // 审批详情
POST   /api/approval/records/:id/approve    // 审批通过
POST   /api/approval/records/:id/reject      // 审批驳回
GET    /api/approval/my-records              // 我的申请
GET    /api/approval/to-approve             // 待我审批
```
