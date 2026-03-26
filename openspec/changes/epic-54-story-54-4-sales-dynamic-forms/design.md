# Design: 销售模块 - 动态表单与数据绑定

## 技术方案

### 实现类型
- **implementationType**: `refactor`
- **优先级**: `high`
- **阶段**: Phase 4 - 业务模块动态化
- **Epic**: Epic 54 (业务模块动态化)
- **Story**: Story 54.4

### 技术栈选择
- **前端**: React + TypeScript + Zustand + Shadcn/ui
- **后端**: Rust + Tauri (复用 Story 54.3)
- **动态表单**: DynamicFormRenderer 组件

## Schema 定义

### 基础类型定义

```typescript
// src/features/dynamic-ui/types/schema.types.ts

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'ref'
  | 'textarea'
  | 'richtext'
  | 'file'
  | 'table';

export interface BaseField {
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  disabled?: boolean;
  readonly?: boolean;
  visible?: boolean;
  required?: boolean;
  validation?: ValidationRule[];
  helpText?: string;
  width?: number; // 表单栅格宽度，默认 24（占满）
}

export interface StringField extends BaseField {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface NumberField extends BaseField {
  type: 'number';
  min?: number;
  max?: number;
  precision?: number; // 小数位数
  step?: number;
}

export interface SelectField extends BaseField {
  type: 'select' | 'multiselect';
  options: { label: string; value: string }[];
  allowClear?: boolean;
  searchable?: boolean;
}

export interface RefField extends BaseField {
  type: 'ref';
  refEntity: 'customer' | 'quotation' | 'contract' | 'order' | 'product';
  refField?: string; // 显示哪个字段，默认 name
  filters?: Record<string, any>;
}

export interface TableField extends BaseField {
  type: 'table';
  columns: TableColumn[];
  minRows?: number;
  maxRows?: number;
  editable?: boolean;
  sortable?: boolean;
}

export interface TableColumn {
  name: string;
  label: string;
  type: FieldType;
  width?: number;
  editable?: boolean;
  required?: boolean;
  validation?: ValidationRule[];
}

export interface FieldPermission {
  read?: boolean;
  write?: boolean;
  hide?: boolean;
}

export interface DynamicSchema {
  name: string;
  title: string;
  fields: (BaseField | StringField | NumberField | SelectField | RefField | TableField)[];
  permissions?: {
    read?: string[];      // 允许读取的角色
    write?: string[];      // 允许写入的角色
    fields?: Record<string, string[]>;  // 字段级权限
  };
  layout?: 'vertical' | 'horizontal' | 'grid';
  sections?: FormSection[];
}

export interface FormSection {
  title?: string;
  fields: string[];  // 字段名数组
  collapsed?: boolean;
}
```

### 客户 Schema

```typescript
// src/features/sales/schemas/customerSchema.ts

import type { DynamicSchema } from '@/features/dynamic-ui/types/schema.types';

export const customerSchema: DynamicSchema = {
  name: 'customer',
  title: '客户管理',
  layout: 'vertical',
  fields: [
    {
      name: 'name',
      type: 'string',
      label: '客户名称',
      placeholder: '请输入客户名称',
      required: true,
      maxLength: 200,
      width: 12,
      validation: [
        { type: 'required', message: '请输入客户名称' },
      ],
    },
    {
      name: 'contact_person',
      type: 'string',
      label: '联系人',
      placeholder: '请输入联系人姓名',
      required: true,
      maxLength: 100,
      width: 12,
    },
    {
      name: 'contact_phone',
      type: 'string',
      label: '联系电话',
      placeholder: '请输入联系电话',
      required: true,
      maxLength: 50,
      width: 12,
      validation: [
        { type: 'required', message: '请输入联系电话' },
        { type: 'pattern', value: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/, message: '请输入正确的电话号码' },
      ],
    },
    {
      name: 'contact_email',
      type: 'string',
      label: '联系邮箱',
      placeholder: '请输入邮箱地址',
      maxLength: 100,
      width: 12,
      validation: [
        { type: 'pattern', value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱地址' },
      ],
    },
    {
      name: 'customer_type',
      type: 'select',
      label: '客户类型',
      required: true,
      width: 12,
      options: [
        { label: '企业客户', value: 'enterprise' },
        { label: '个人客户', value: 'individual' },
        { label: '政府客户', value: 'government' },
      ],
    },
    {
      name: 'industry',
      type: 'string',
      label: '所属行业',
      placeholder: '请输入行业',
      maxLength: 100,
      width: 12,
    },
    {
      name: 'status',
      type: 'select',
      label: '客户状态',
      defaultValue: 'active',
      width: 12,
      options: [
        { label: '活跃', value: 'active' },
        { label: '潜在', value: 'potential' },
        { label: '已流失', value: 'inactive' },
      ],
    },
    {
      name: 'credit_limit',
      type: 'number',
      label: '信用额度',
      min: 0,
      precision: 2,
      width: 12,
    },
    {
      name: 'tax_number',
      type: 'string',
      label: '税号',
      maxLength: 50,
      width: 12,
    },
    {
      name: 'bank_account',
      type: 'string',
      label: '银行账号',
      maxLength: 50,
      width: 12,
    },
    {
      name: 'address',
      type: 'textarea',
      label: '地址',
      placeholder: '请输入详细地址',
      maxLength: 500,
      width: 24,
    },
    {
      name: 'notes',
      type: 'textarea',
      label: '备注',
      placeholder: '请输入备注信息',
      maxLength: 2000,
      width: 24,
    },
  ],
  permissions: {
    read: ['sales_manager', 'sales', 'admin'],
    write: ['sales_manager', 'admin'],
    fields: {
      status: ['admin'],
      credit_limit: ['sales_manager', 'admin'],
    },
  },
};
```

### 报价单 Schema

```typescript
// src/features/sales/schemas/quotationSchema.ts

import type { DynamicSchema } from '@/features/dynamic-ui/types/schema.types';

export const quotationSchema: DynamicSchema = {
  name: 'quotation',
  title: '报价单管理',
  layout: 'vertical',
  fields: [
    {
      name: 'quotation_no',
      type: 'string',
      label: '报价单编号',
      readonly: true,
      width: 12,
    },
    {
      name: 'customer_id',
      type: 'ref',
      label: '客户',
      refEntity: 'customer',
      refField: 'name',
      required: true,
      width: 12,
      validation: [
        { type: 'required', message: '请选择客户' },
      ],
    },
    {
      name: 'sales_person_id',
      type: 'string',
      label: '业务员',
      readonly: true,
      width: 12,
    },
    {
      name: 'title',
      type: 'string',
      label: '报价标题',
      placeholder: '请输入报价标题',
      required: true,
      maxLength: 200,
      width: 24,
    },
    {
      name: 'valid_from',
      type: 'date',
      label: '有效期开始',
      required: true,
      width: 12,
    },
    {
      name: 'valid_until',
      type: 'date',
      label: '有效期结束',
      required: true,
      width: 12,
      validation: [
        { type: 'required', message: '请选择有效期结束日期' },
      ],
    },
    {
      name: 'items',
      type: 'table',
      label: '报价明细',
      width: 24,
      minRows: 1,
      editable: true,
      columns: [
        { name: 'product_name', label: '产品名称', type: 'string', width: 150, required: true },
        { name: 'specification', label: '规格', type: 'string', width: 120 },
        { name: 'unit', label: '单位', type: 'string', width: 80, required: true },
        { name: 'quantity', label: '数量', type: 'number', width: 100, required: true, editable: true },
        { name: 'unit_price', label: '单价', type: 'number', width: 100, required: true, editable: true },
        { name: 'discount_rate', label: '折扣率', type: 'number', width: 80, editable: true },
        { name: 'amount', label: '金额', type: 'number', width: 100, readonly: true },
        { name: 'notes', label: '备注', type: 'string', width: 120 },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      label: '小计金额',
      readonly: true,
      precision: 2,
      width: 8,
    },
    {
      name: 'discount',
      type: 'number',
      label: '折扣金额',
      min: 0,
      precision: 2,
      width: 8,
    },
    {
      name: 'tax_rate',
      type: 'number',
      label: '税率(%)',
      min: 0,
      max: 100,
      precision: 2,
      width: 8,
    },
    {
      name: 'tax_amount',
      type: 'number',
      label: '税额',
      readonly: true,
      precision: 2,
      width: 8,
    },
    {
      name: 'total_amount',
      type: 'number',
      label: '总金额',
      readonly: true,
      precision: 2,
      width: 8,
    },
    {
      name: 'status',
      type: 'select',
      label: '状态',
      width: 12,
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发送', value: 'sent' },
        { label: '已接受', value: 'accepted' },
        { label: '已拒绝', value: 'rejected' },
        { label: '已过期', value: 'expired' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: '备注',
      placeholder: '请输入备注信息',
      maxLength: 2000,
      width: 24,
    },
  ],
  permissions: {
    read: ['sales_manager', 'sales', 'admin'],
    write: ['sales_manager', 'sales', 'admin'],
    fields: {
      status: ['sales_manager', 'admin'],
      quotation_no: ['sales_manager', 'admin'],
      subtotal: ['sales_manager', 'admin'],
      tax_amount: ['sales_manager', 'admin'],
      total_amount: ['sales_manager', 'admin'],
    },
  },
};
```

### 合同 Schema

```typescript
// src/features/sales/schemas/contractSchema.ts

import type { DynamicSchema } from '@/features/dynamic-ui/types/schema.types';

export const contractSchema: DynamicSchema = {
  name: 'contract',
  title: '合同管理',
  layout: 'vertical',
  fields: [
    {
      name: 'contract_no',
      type: 'string',
      label: '合同编号',
      readonly: true,
      width: 12,
    },
    {
      name: 'title',
      type: 'string',
      label: '合同标题',
      placeholder: '请输入合同标题',
      required: true,
      maxLength: 200,
      width: 12,
    },
    {
      name: 'customer_id',
      type: 'ref',
      label: '客户',
      refEntity: 'customer',
      refField: 'name',
      required: true,
      width: 12,
    },
    {
      name: 'party_a',
      type: 'string',
      label: '甲方',
      required: true,
      maxLength: 200,
      width: 12,
    },
    {
      name: 'party_b',
      type: 'string',
      label: '乙方',
      required: true,
      maxLength: 200,
      width: 12,
    },
    {
      name: 'sign_date',
      type: 'date',
      label: '签订日期',
      required: true,
      width: 12,
    },
    {
      name: 'effective_date',
      type: 'date',
      label: '生效日期',
      required: true,
      width: 12,
    },
    {
      name: 'expiry_date',
      type: 'date',
      label: '到期日期',
      required: true,
      width: 12,
    },
    {
      name: 'total_amount',
      type: 'number',
      label: '合同金额',
      required: true,
      min: 0,
      precision: 2,
      width: 12,
    },
    {
      name: 'payment_terms',
      type: 'textarea',
      label: '付款条款',
      maxLength: 1000,
      width: 24,
    },
    {
      name: 'quotation_id',
      type: 'ref',
      label: '关联报价单',
      refEntity: 'quotation',
      refField: 'quotation_no',
      width: 12,
    },
    {
      name: 'status',
      type: 'select',
      label: '状态',
      width: 12,
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已签订', value: 'signed' },
        { label: '执行中', value: 'in_progress' },
        { label: '已终止', value: 'terminated' },
        { label: '已完成', value: 'completed' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: '备注',
      maxLength: 2000,
      width: 24,
    },
  ],
  permissions: {
    read: ['sales_manager', 'sales', 'admin'],
    write: ['sales_manager', 'admin'],
    fields: {
      status: ['admin'],
      contract_no: ['admin'],
      total_amount: ['sales_manager', 'admin'],
    },
  },
};
```

### 订单 Schema

```typescript
// src/features/sales/schemas/orderSchema.ts

import type { DynamicSchema } from '@/features/dynamic-ui/types/schema.types';

export const orderSchema: DynamicSchema = {
  name: 'order',
  title: '订单管理',
  layout: 'vertical',
  fields: [
    {
      name: 'order_no',
      type: 'string',
      label: '订单编号',
      readonly: true,
      width: 12,
    },
    {
      name: 'customer_id',
      type: 'ref',
      label: '客户',
      refEntity: 'customer',
      refField: 'name',
      required: true,
      width: 12,
    },
    {
      name: 'contract_id',
      type: 'ref',
      label: '关联合同',
      refEntity: 'contract',
      refField: 'contract_no',
      width: 12,
    },
    {
      name: 'sales_person_id',
      type: 'string',
      label: '业务员',
      readonly: true,
      width: 12,
    },
    {
      name: 'title',
      type: 'string',
      label: '订单标题',
      required: true,
      maxLength: 200,
      width: 24,
    },
    {
      name: 'items',
      type: 'table',
      label: '订单明细',
      width: 24,
      minRows: 1,
      editable: true,
      columns: [
        { name: 'product_name', label: '产品名称', type: 'string', width: 150, required: true },
        { name: 'specification', label: '规格', type: 'string', width: 120 },
        { name: 'unit', label: '单位', type: 'string', width: 80, required: true },
        { name: 'quantity', label: '数量', type: 'number', width: 100, required: true },
        { name: 'unit_price', label: '单价', type: 'number', width: 100, required: true },
        { name: 'amount', label: '金额', type: 'number', width: 100, readonly: true },
        { name: 'delivered_quantity', label: '已交货', type: 'number', width: 100, readonly: true },
        { name: 'notes', label: '备注', type: 'string', width: 120 },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      label: '小计金额',
      readonly: true,
      precision: 2,
      width: 8,
    },
    {
      name: 'discount',
      type: 'number',
      label: '折扣金额',
      min: 0,
      precision: 2,
      width: 8,
    },
    {
      name: 'tax_rate',
      type: 'number',
      label: '税率(%)',
      min: 0,
      max: 100,
      precision: 2,
      width: 8,
    },
    {
      name: 'tax_amount',
      type: 'number',
      label: '税额',
      readonly: true,
      precision: 2,
      width: 8,
    },
    {
      name: 'total_amount',
      type: 'number',
      label: '总金额',
      readonly: true,
      precision: 2,
      width: 8,
    },
    {
      name: 'delivery_address',
      type: 'textarea',
      label: '交货地址',
      maxLength: 500,
      width: 24,
    },
    {
      name: 'expected_delivery_date',
      type: 'date',
      label: '预计交货日期',
      width: 12,
    },
    {
      name: 'actual_delivery_date',
      type: 'date',
      label: '实际交货日期',
      width: 12,
    },
    {
      name: 'status',
      type: 'select',
      label: '状态',
      width: 12,
      options: [
        { label: '待确认', value: 'pending' },
        { label: '已确认', value: 'confirmed' },
        { label: '生产中', value: 'in_production' },
        { label: '已发货', value: 'shipped' },
        { label: '已完成', value: 'completed' },
        { label: '已取消', value: 'cancelled' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: '备注',
      maxLength: 2000,
      width: 24,
    },
  ],
  permissions: {
    read: ['sales_manager', 'sales', 'admin'],
    write: ['sales_manager', 'sales', 'admin'],
    fields: {
      status: ['sales_manager', 'admin'],
      order_no: ['admin'],
      total_amount: ['sales_manager', 'admin'],
    },
  },
};
```

## Hook 设计

### useSalesEntity Hook

```typescript
// src/features/sales/hooks/useSalesEntity.ts

import { useState, useEffect, useCallback } from 'react';
import { useSalesStore } from '../stores/salesStore';
import type { Customer, Quotation, Contract, Order } from '../types';

type EntityType = 'customer' | 'quotation' | 'contract' | 'order';
type Entity<T> = T extends 'customer' ? Customer
  : T extends 'quotation' ? Quotation
  : T extends 'contract' ? Contract
  : Order;

export function useSalesEntity<T extends EntityType>(
  entityType: T,
  entityId?: string
) {
  const [data, setData] = useState<Entity<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loadEntity, saveEntity, createEntity } = useSalesStore();

  // 加载数据
  const load = useCallback(async () => {
    if (!entityId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await loadEntity(entityType, entityId);
      setData(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, loadEntity]);

  // 保存数据
  const save = useCallback(async (formData: Partial<Entity<T>>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await saveEntity(entityType, entityId!, formData);
      setData(result);
      return result;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, saveEntity]);

  // 创建数据
  const create = useCallback(async (formData: Partial<Entity<T>>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createEntity(entityType, formData);
      setData(result);
      return result;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [entityType, createEntity]);

  useEffect(() => {
    if (entityId) {
      load();
    } else {
      setData(null);
    }
  }, [entityId, load]);

  return { data, loading, error, load, save, create };
}
```

### useAutoSave Hook

```typescript
// src/features/sales/hooks/useAutoSave.ts

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  interval?: number;      // 自动保存间隔（毫秒），默认 30000
  enabled?: boolean;      // 是否启用，默认 true
  onSave?: () => void;   // 保存回调
  onError?: (e: Error) => void;  // 错误回调
}

export function useAutoSave(
  data: any,
  save: (data: any) => Promise<any>,
  options: UseAutoSaveOptions = {}
) {
  const {
    interval = 30000,
    enabled = true,
    onSave,
    onError,
  } = options;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<any>(null);
  const isDirtyRef = useRef(false);

  // 检测数据变化
  useEffect(() => {
    if (data) {
      const isChanged = JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
      isDirtyRef.current = isChanged;
    }
  }, [data]);

  // 定时保存
  const saveIfDirty = useCallback(async () => {
    if (isDirtyRef.current && data) {
      try {
        await save(data);
        lastDataRef.current = JSON.parse(JSON.stringify(data));
        isDirtyRef.current = false;
        onSave?.();
      } catch (e) {
        onError?.(e as Error);
      }
    }
  }, [data, save, onSave, onError]);

  // 设置定时器
  useEffect(() => {
    if (enabled && entityId) {
      timerRef.current = setInterval(saveIfDirty, interval);
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [enabled, interval, saveIfDirty, entityId]);

  // 离开页面提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '有未保存的更改，确定要离开吗？';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return { saveIfDirty };
}
```

### useFieldPermissions Hook

```typescript
// src/features/sales/hooks/useFieldPermissions.ts

import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { DynamicSchema, FieldPermission } from '@/features/dynamic-ui/types/schema.types';

export function useFieldPermissions(schema: DynamicSchema) {
  const { permissions: userPermissions, roles } = useAuthStore();

  return useMemo(() => {
    const result: Record<string, FieldPermission> = {};

    for (const field of schema.fields) {
      const fieldName = field.name;

      // 默认权限
      let read = true;
      let write = true;
      let hide = false;

      // Schema 级读取权限
      if (schema.permissions?.read?.length) {
        read = roles.some(r => schema.permissions!.read!.includes(r));
      }

      // Schema 级写入权限
      if (schema.permissions?.write?.length) {
        write = roles.some(r => schema.permissions!.write!.includes(r));
      }

      // 字段级权限
      if (schema.permissions?.fields?.[fieldName]) {
        const allowedRoles = schema.permissions.fields[fieldName];
        read = roles.some(r => allowedRoles.includes(r));
        write = false; // 有字段级配置时，默认禁止编辑
      }

      result[fieldName] = { read, write, hide };
    }

    return result;
  }, [schema, roles, userPermissions]);
}
```

## 组件设计

### CustomerForm

```typescript
// src/features/sales/components/CustomerForm.tsx

import React from 'react';
import { DynamicFormRenderer } from '@/features/dynamic-ui/components/DynamicFormRenderer';
import { useSalesEntity } from '../hooks/useSalesEntity';
import { useAutoSave } from '../hooks/useAutoSave';
import { useFieldPermissions } from '../hooks/useFieldPermissions';
import { customerSchema } from '../schemas/customerSchema';
import { customerApi } from '../api/customerApi';
import { Button, Card, Spin, Alert } from 'shadcn/ui';

interface CustomerFormProps {
  customerId?: string;
  onSaved?: (customer: Customer) => void;
  onCancel?: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customerId,
  onSaved,
  onCancel,
}) => {
  const { data, loading, error, save, create } = useSalesEntity('customer', customerId);
  const fieldPermissions = useFieldPermissions(customerSchema);

  // 自动保存
  const { saveIfDirty } = useAutoSave(data, async (formData) => {
    if (customerId) {
      return await customerApi.update(customerId, formData);
    } else {
      return await customerApi.create(formData as any);
    }
  }, { interval: 30000 });

  // 提交处理
  const handleSubmit = async (formData: any) => {
    try {
      let result;
      if (customerId) {
        result = await save(formData);
      } else {
        result = await create(formData);
      }
      onSaved?.(result);
    } catch (e) {
      // 错误由 useSalesEntity 处理
    }
  };

  // 计算有效字段（考虑权限）
  const effectiveSchema = useMemo(() => {
    return {
      ...customerSchema,
      fields: customerSchema.fields.map(field => ({
        ...field,
        disabled: !fieldPermissions[field.name]?.write,
        visible: !fieldPermissions[field.name]?.hide,
      })),
    };
  }, [fieldPermissions]);

  if (loading && !data) {
    return <Spin tip="加载中..." />;
  }

  if (error && !data) {
    return <Alert type="error" message={error} />;
  }

  return (
    <Card>
      <DynamicFormRenderer
        schema={effectiveSchema}
        initialData={data}
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    </Card>
  );
};
```

### SalesTable

```typescript
// src/features/sales/components/SalesTable.tsx

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag } from 'shadcn/ui';
import type { TableColumn } from '@/features/dynamic-ui/types/schema.types';

interface SalesTableProps {
  entityType: 'customer' | 'quotation' | 'contract' | 'order';
  columns: TableColumn[];
  onRowClick?: (row: any) => void;
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({
  entityType,
  columns,
  onRowClick,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const api = getApi(entityType);
      const result = await api.list({
        page: pagination.page,
        page_size: pagination.pageSize,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [entityType, pagination.page, pagination.pageSize]);

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'green',
      potential: 'blue',
      inactive: 'gray',
      draft: 'default',
      sent: 'blue',
      accepted: 'green',
      rejected: 'red',
      expired: 'orange',
      signed: 'green',
      in_progress: 'blue',
      terminated: 'red',
      completed: 'green',
      pending: 'orange',
      confirmed: 'blue',
      in_production: 'cyan',
      shipped: 'purple',
      cancelled: 'red',
    };
    return colors[status] || 'default';
  };

  return (
    <Table
      dataSource={data}
      columns={columns.map(col => ({
        ...col,
        render: (value: any, row: any) => {
          if (col.name === 'status') {
            return <Tag color={getStatusColor(value)}>{value}</Tag>;
          }
          return value;
        },
      }))}
      loading={loading}
      pagination={{
        current: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onChange: (page, pageSize) => {
          setPagination({ page, pageSize, total: pagination.total });
        },
      }}
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: { cursor: 'pointer' },
      })}
    />
  );
};

// 获取对应的 API
function getApi(entityType: string) {
  const apis: Record<string, any> = {
    customer: customerApi,
    quotation: quotationApi,
    contract: contractApi,
    order: orderApi,
  };
  return apis[entityType];
}
```

## 状态管理

### Sales Store

```typescript
// src/features/sales/stores/salesStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { customerApi, quotationApi, contractApi, orderApi } from '../api';
import type { Customer, Quotation, Contract, Order } from '../types';

type EntityType = 'customer' | 'quotation' | 'contract' | 'order';

interface SalesState {
  // 列表数据
  customerList: Customer[];
  quotationList: Quotation[];
  contractList: Contract[];
  orderList: Order[];

  // 当前实体
  currentCustomer: Customer | null;
  currentQuotation: Quotation | null;
  currentContract: Contract | null;
  currentOrder: Order | null;

  // 加载状态
  loading: boolean;
  error: string | null;

  // 操作
  loadEntity: (type: EntityType, id: string) => Promise<any>;
  saveEntity: (type: EntityType, id: string, data: any) => Promise<any>;
  createEntity: (type: EntityType, data: any) => Promise<any>;
  deleteEntity: (type: EntityType, id: string) => Promise<void>;
  loadList: (type: EntityType, params?: any) => Promise<any[]>;
}

export const useSalesStore = create<SalesState>()(
  immer((set, get) => ({
    customerList: [],
    quotationList: [],
    contractList: [],
    orderList: [],
    currentCustomer: null,
    currentQuotation: null,
    currentContract: null,
    currentOrder: null,
    loading: false,
    error: null,

    loadEntity: async (type, id) => {
      set({ loading: true, error: null });
      try {
        const apis: Record<string, any> = {
          customer: customerApi,
          quotation: quotationApi,
          contract: contractApi,
          order: orderApi,
        };
        const result = await apis[type].get(id);
        set({ [`current${type.charAt(0).toUpperCase() + type.slice(1)}`]: result });
        return result;
      } catch (e) {
        set({ error: (e as Error).message });
        throw e;
      } finally {
        set({ loading: false });
      }
    },

    saveEntity: async (type, id, data) => {
      set({ loading: true, error: null });
      try {
        const apis: Record<string, any> = {
          customer: customerApi,
          quotation: quotationApi,
          contract: contractApi,
          order: orderApi,
        };
        const result = await apis[type].update(id, data);
        set({ [`current${type.charAt(0).toUpperCase() + type.slice(1)}`]: result });
        return result;
      } catch (e) {
        set({ error: (e as Error).message });
        throw e;
      } finally {
        set({ loading: false });
      }
    },

    createEntity: async (type, data) => {
      set({ loading: true, error: null });
      try {
        const apis: Record<string, any> = {
          customer: customerApi,
          quotation: quotationApi,
          contract: contractApi,
          order: orderApi,
        };
        const result = await apis[type].create(data);
        return result;
      } catch (e) {
        set({ error: (e as Error).message });
        throw e;
      } finally {
        set({ loading: false });
      }
    },

    deleteEntity: async (type, id) => {
      set({ loading: true, error: null });
      try {
        const apis: Record<string, any> = {
          customer: customerApi,
          quotation: quotationApi,
          contract: contractApi,
          order: orderApi,
        };
        await apis[type].delete(id);
      } catch (e) {
        set({ error: (e as Error).message });
        throw e;
      } finally {
        set({ loading: false });
      }
    },

    loadList: async (type, params) => {
      set({ loading: true, error: null });
      try {
        const apis: Record<string, any> = {
          customer: customerApi,
          quotation: quotationApi,
          contract: contractApi,
          order: orderApi,
        };
        const result = await apis[type].list(params);
        set({ [`${type}List`]: result.items });
        return result.items;
      } catch (e) {
        set({ error: (e as Error).message });
        throw e;
      } finally {
        set({ loading: false });
      }
    },
  }))
);
```

## 模块结构

```
src/features/sales/
├── api/
│   ├── customerApi.ts        # (Story 54.3)
│   ├── quotationApi.ts      # (Story 54.3)
│   ├── contractApi.ts       # (Story 54.3)
│   └── orderApi.ts          # (Story 54.3)
├── schemas/
│   ├── customerSchema.ts    # 客户 Schema (新增)
│   ├── quotationSchema.ts   # 报价单 Schema (新增)
│   ├── contractSchema.ts    # 合同 Schema (新增)
│   ├── orderSchema.ts      # 订单 Schema (新增)
│   └── index.ts            # Schema 导出
├── components/
│   ├── CustomerForm.tsx     # 客户表单 (新增)
│   ├── QuotationForm.tsx    # 报价单表单 (新增)
│   ├── ContractForm.tsx     # 合同表单 (新增)
│   ├── OrderForm.tsx        # 订单表单 (新增)
│   └── SalesTable.tsx       # 销售列表 (新增)
├── hooks/
│   ├── useSalesEntity.ts    # 销售实体 Hook (新增)
│   ├── useAutoSave.ts       # 自动保存 Hook (新增)
│   └── useFieldPermissions.ts  # 字段权限 Hook (新增)
├── stores/
│   └── salesStore.ts        # 销售状态管理 (新增)
├── types/
│   └── (Story 54.3)
└── index.ts                 # 入口导出
```
