# 第5章：业务层规范 (Business Specification)

> 业务层负责实现插件的业务逻辑、事件处理、定时任务和跨插件通信。

---

## 5.1 目录结构

```
services/                   # 业务服务
├── contract.service.ts
├── order.service.ts
└── customer.service.ts

handlers/                   # 事件处理器
├── approval.handler.ts
├── inventory.handler.ts
└── payment.handler.ts

schedules/                  # 定时任务
├── contract-expire.task.ts
└── report-daily.task.ts

events/                     # 事件定义
└── index.ts
```

---

## 5.2 业务服务

### 5.2.1 服务定义规范

```typescript
// services/contract.service.ts
import { Service, Injectable } from '@office/plugin-sdk';
import { ContractRepository } from '../data/repositories/contract.repo';
import { ApprovalService } from '@/plugins/approval/services/approval.service';

@Injectable()
@Service()
export class ContractService {
  constructor(
    private contractRepo: ContractRepository,
    private approvalService: ApprovalService
  ) {}
  
  /**
   * 创建合同
   */
  async createContract(data: CreateContractDto, context: ServiceContext): Promise<Contract> {
    // 1. 数据验证
    this.validateContractData(data);
    
    // 2. 生成合同编号
    const contractNo = await this.generateContractNo(context.companyId);
    
    // 3. 创建合同
    const contract = await this.contractRepo.create({
      ...data,
      contractNo,
      status: 'draft',
      companyId: context.companyId,
      createdBy: context.userId
    });
    
    // 4. 发布事件
    context.emitEvent('sales:contract:created', contract);
    
    return contract;
  }
  
  /**
   * 提交审批
   */
  async submitForApproval(contractId: string, context: ServiceContext): Promise<void> {
    // 1. 检查合同状态
    const contract = await this.contractRepo.findById(contractId);
    if (contract.status !== 'draft') {
      throw new BusinessError('只能提交草稿状态的合同');
    }
    
    // 2. 调用审批服务
    const approvalRequest = await this.approvalService.createRequest({
      type: 'contract',
      entityId: contractId,
      title: `合同审批：${contract.title}`,
      amount: contract.amount,
      requesterId: context.userId
    }, context);
    
    // 3. 更新合同状态
    await this.contractRepo.update(contractId, {
      status: 'pending',
      approvalId: approvalRequest.id
    });
    
    // 4. 发布事件
    context.emitEvent('sales:contract:submitted', { contractId, approvalId: approvalRequest.id });
  }
  
  /**
   * 执行合同操作
   */
  async executeAction(
    action: string, 
    contractId: string, 
    params: any, 
    context: ServiceContext
  ): Promise<ActionResult> {
    const contract = await this.contractRepo.findById(contractId);
    
    switch (action) {
      case 'approve':
        return this.handleApprove(contract, params, context);
      case 'reject':
        return this.handleReject(contract, params, context);
      case 'sign':
        return this.handleSign(contract, params, context);
      case 'cancel':
        return this.handleCancel(contract, params, context);
      case 'renew':
        return this.handleRenew(contract, params, context);
      default:
        throw new BusinessError(`不支持的操作: ${action}`);
    }
  }
  
  private async handleApprove(contract: Contract, params: any, context: ServiceContext) {
    if (contract.status !== 'pending') {
      throw new BusinessError('只能审批待审批状态的合同');
    }
    
    await this.contractRepo.update(contract.id, {
      status: 'signed',
      signedAt: new Date(),
      updatedBy: context.userId
    });
    
    context.emitEvent('sales:contract:approved', { contractId: contract.id });
    
    return { success: true, message: '合同审批通过' };
  }
  
  // ... 其他私有方法
}
```

### 5.2.2 服务注册

```typescript
// services/index.ts
import { ContractService } from './contract.service';
import { OrderService } from './order.service';
import { CustomerService } from './customer.service';

export const services = [
  ContractService,
  OrderService,
  CustomerService
];

export { ContractService, OrderService, CustomerService };
```

---

## 5.3 事件处理

### 5.3.1 事件定义

```typescript
// events/index.ts

// 插件发布的事件
export const PublishedEvents = {
  'sales:contract:created': {
    description: '合同创建',
    payload: { contractId: string, contractNo: string, amount: number }
  },
  'sales:contract:submitted': {
    description: '合同提交审批',
    payload: { contractId: string, approvalId: string }
  },
  'sales:contract:approved': {
    description: '合同审批通过',
    payload: { contractId: string }
  },
  'sales:contract:signed': {
    description: '合同签订',
    payload: { contractId: string, signedAt: Date }
  },
  'sales:order:created': {
    description: '订单创建',
    payload: { orderId: string, contractId: string, amount: number }
  }
};

// 插件订阅的事件
export const SubscribedEvents = {
  'approval:approved': '审批通过时更新合同状态',
  'approval:rejected': '审批驳回时更新合同状态',
  'warehouse:inventory:low': '库存不足时提醒',
  'payment:received': '收到付款时更新订单状态'
};
```

### 5.3.2 事件处理器

```typescript
// handlers/approval.handler.ts
import { EventHandler, OnEvent } from '@office/plugin-sdk';
import { ContractRepository } from '../data/repositories/contract.repo';

@EventHandler()
export class ApprovalHandler {
  constructor(private contractRepo: ContractRepository) {}
  
  /**
   * 处理审批通过事件
   */
  @OnEvent('approval:approved')
  async handleApprovalApproved(event: ApprovalApprovedEvent, context: HandlerContext) {
    // 只处理合同类型的审批
    if (event.type !== 'contract') return;
    
    const contract = await this.contractRepo.findById(event.entityId);
    
    await this.contractRepo.update(event.entityId, {
      status: 'signed',
      signedAt: new Date(),
      updatedBy: event.approverId
    });
    
    context.logger.info('合同审批通过，状态已更新', {
      contractId: event.entityId,
      approvalId: event.approvalId
    });
    
    // 发布合同签订事件
    context.emitEvent('sales:contract:signed', {
      contractId: event.entityId,
      signedAt: new Date()
    });
  }
  
  /**
   * 处理审批驳回事件
   */
  @OnEvent('approval:rejected')
  async handleApprovalRejected(event: ApprovalRejectedEvent, context: HandlerContext) {
    if (event.type !== 'contract') return;
    
    await this.contractRepo.update(event.entityId, {
      status: 'draft',
      updatedBy: event.approverId
    });
    
    context.logger.info('合同审批被驳回', {
      contractId: event.entityId,
      reason: event.reason
    });
  }
}
```

### 5.3.3 事件处理器注册

```typescript
// handlers/index.ts
import { ApprovalHandler } from './approval.handler';
import { InventoryHandler } from './inventory.handler';
import { PaymentHandler } from './payment.handler';

export const handlers = [
  ApprovalHandler,
  InventoryHandler,
  PaymentHandler
];
```

---

## 5.4 定时任务

### 5.4.1 任务定义

```typescript
// schedules/contract-expire.task.ts
import { Schedule, Cron } from '@office/plugin-sdk';
import { ContractRepository } from '../data/repositories/contract.repo';

@Schedule()
export class ContractExpireTask {
  constructor(private contractRepo: ContractRepository) {}
  
  /**
   * 每天检查即将到期的合同
   * 每天 09:00 执行
   */
  @Cron('0 9 * * *')
  async checkExpiringContracts(context: TaskContext) {
    const expiringContracts = await this.contractRepo.findMany({
      filters: {
        status: 'executing',
        endDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天内到期
        }
      }
    });
    
    for (const contract of expiringContracts.items) {
      // 发送到期提醒
      await context.notify({
        type: 'contract_expiring',
        userId: contract.salesId,
        title: '合同即将到期提醒',
        content: `合同 ${contract.title} 将于 ${contract.endDate} 到期`,
        data: { contractId: contract.id }
      });
    }
    
    context.logger.info('合同到期检查完成', {
      count: expiringContracts.total
    });
  }
  
  /**
   * 每天更新已到期合同状态
   * 每天 00:05 执行
   */
  @Cron('5 0 * * *')
  async updateExpiredContracts(context: TaskContext) {
    const expiredContracts = await this.contractRepo.findMany({
      filters: {
        status: 'executing',
        endDate: { lt: new Date() }
      }
    });
    
    for (const contract of expiredContracts.items) {
      await this.contractRepo.update(contract.id, {
        status: 'completed'
      });
      
      context.emitEvent('sales:contract:completed', { contractId: contract.id });
    }
    
    context.logger.info('已到期合同状态更新完成', {
      count: expiredContracts.total
    });
  }
}
```

### 5.4.2 Cron表达式

| 表达式 | 说明 |
|--------|------|
| `* * * * *` | 每分钟 |
| `0 * * * *` | 每小时 |
| `0 9 * * *` | 每天 09:00 |
| `0 9 * * 1` | 每周一 09:00 |
| `0 9 1 * *` | 每月1日 09:00 |
| `0 0 * * *` | 每天午夜 |

### 5.4.3 任务注册

```typescript
// schedules/index.ts
import { ContractExpireTask } from './contract-expire.task';
import { ReportDailyTask } from './report-daily.task';

export const schedules = [
  ContractExpireTask,
  ReportDailyTask
];
```

---

## 5.5 跨插件通信

### 5.5.1 事件总线

```typescript
// 发布事件
context.emitEvent('sales:contract:signed', {
  contractId: 'C001',
  signedAt: new Date()
});

// 订阅事件
@OnEvent('approval:approved')
async handleApprovalApproved(event, context) {
  // 处理逻辑
}
```

### 5.5.2 服务共享

在 `plugin.json` 中声明导出：

```json
{
  "exports": {
    "services": ["contractService", "orderService"]
  }
}
```

其他插件导入：

```typescript
import { ContractService } from '@office/plugins/sales';

@Injectable()
export class MyService {
  constructor(private contractService: ContractService) {}
  
  async doSomething() {
    const contract = await this.contractService.getById('C001');
    // ...
  }
}
```

### 5.5.3 数据共享

在 `plugin.json` 中声明数据访问：

```json
{
  "dataAccess": {
    "externalModels": [
      {
        "plugin": "hr",
        "models": ["employee", "department"],
        "access": "read"
      }
    ]
  }
}
```

在代码中使用：

```typescript
// 通过工具调用访问其他插件数据
const employees = await context.callTool('hr_query', {
  entity: 'employee',
  filters: { departmentId: 'D001' }
});
```

---

## 5.6 错误处理

### 5.6.1 错误类型

```typescript
// 业务错误
class BusinessError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

// 验证错误
class ValidationError extends Error {
  constructor(message: string, public fields: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 权限错误
class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

// 数据不存在错误
class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}
```

### 5.6.2 错误处理示例

```typescript
async submitForApproval(contractId: string, context: ServiceContext): Promise<void> {
  const contract = await this.contractRepo.findById(contractId);
  
  // 检查数据是否存在
  if (!contract) {
    throw new NotFoundError('Contract', contractId);
  }
  
  // 检查状态
  if (contract.status !== 'draft') {
    throw new BusinessError('只能提交草稿状态的合同', 'INVALID_STATUS');
  }
  
  // 检查权限
  if (!context.hasPermission('sales:contract:submit')) {
    throw new PermissionError('您没有提交合同审批的权限');
  }
  
  // 执行业务逻辑...
}
```

---

## 5.7 事务处理

```typescript
async createContractWithOrder(
  contractData: CreateContractDto,
  orderData: CreateOrderDto,
  context: ServiceContext
): Promise<{ contract: Contract; order: Order }> {
  // 使用事务
  return context.transaction(async (tx) => {
    // 创建合同
    const contract = await tx.contractRepo.create({
      ...contractData,
      companyId: context.companyId
    });
    
    // 创建订单
    const order = await tx.orderRepo.create({
      ...orderData,
      contractId: contract.id,
      companyId: context.companyId
    });
    
    return { contract, order };
  });
}
```

---

## 下一步

- [第6章：权限层规范](./06-permission-spec.md)
- [第7章：生命周期规范](./07-lifecycle-spec.md)
