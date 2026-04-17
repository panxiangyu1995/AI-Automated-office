/**
 * 审批插件类型定义
 */

/**
 * 审批单状态
 */
export type ApprovalStatus = 
  | 'pending'      // 待审批
  | 'approved'     // 已通过
  | 'rejected'     // 已拒绝
  | 'delegated'    // 已委托
  | 'cancelled';   // 已撤回

/**
 * 审批单
 */
export interface Approval {
  id: string;
  title: string;
  description?: string;
  applicant: {
    id: string;
    name: string;
    department: string;
  };
  approvers: ApprovalStep[];
  status: ApprovalStatus;
  templateId?: string;
  formData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * 审批步骤
 */
export interface ApprovalStep {
  step: number;
  approver: {
    id: string;
    name: string;
    department: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comment?: string;
  decidedAt?: string;
}

/**
 * 审批模板
 */
export interface ApprovalTemplate {
  id: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  steps: TemplateStep[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 模板字段
 */
export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'file' | 'currency';
  required: boolean;
  options?: { value: string; label: string }[];
}

/**
 * 模板步骤
 */
export interface TemplateStep {
  step: number;
  name: string;
  approverType: 'user' | 'role' | 'department_head';
  approverId?: string;
  approverRole?: string;
}

/**
 * 插件配置
 */
export interface ApprovalPluginConfig {
  enableAiAssist: boolean;
  enableAutoDistribute: boolean;
  enableReminder: boolean;
  reminderHours: number;
}
