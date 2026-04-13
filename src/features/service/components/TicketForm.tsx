//! TicketForm 组件 - 工单创建/编辑表单

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CreateTicketRequest, TicketType, TicketPriority } from '../types/service';

interface TicketFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTicketRequest) => Promise<void>;
  defaultValues?: Partial<CreateTicketRequest>;
  mode?: 'create' | 'edit';
}

export function TicketForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode = 'create',
}: TicketFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTicketRequest>({
    title: defaultValues?.title || '',
    description: defaultValues?.description || '',
    ticketType: defaultValues?.ticketType || 'repair',
    priority: defaultValues?.priority || 'medium',
    customerName: defaultValues?.customerName || '',
    customerContact: defaultValues?.customerContact || '',
    customerEmail: defaultValues?.customerEmail || '',
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      // 重置表单
      setFormData({
        title: '',
        description: '',
        ticketType: 'repair',
        priority: 'medium',
        customerName: '',
        customerContact: '',
        customerEmail: '',
      });
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '创建工单' : '编辑工单'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? '填写工单信息创建新的售后工单' : '修改工单信息'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">工单标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入工单标题"
              required
            />
          </div>
          
          {/* 工单类型和优先级 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticketType">工单类型 *</Label>
              <Select
                value={formData.ticketType}
                onValueChange={(value) => setFormData({ ...formData, ticketType: value as TicketType })}
              >
                <SelectTrigger id="ticketType">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="repair">维修</SelectItem>
                  <SelectItem value="consultation">咨询</SelectItem>
                  <SelectItem value="complaint">投诉</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">优先级 *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="urgent">紧急</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 客户信息 */}
          <div className="space-y-2">
            <Label htmlFor="customerName">客户姓名 *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="请输入客户姓名"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerContact">联系电话</Label>
              <Input
                id="customerContact"
                value={formData.customerContact || ''}
                onChange={(e) => setFormData({ ...formData, customerContact: e.target.value })}
                placeholder="请输入联系电话"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerEmail">电子邮箱</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail || ''}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="请输入邮箱"
              />
            </div>
          </div>
          
          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">工单描述</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请详细描述工单内容..."
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '提交中...' : mode === 'create' ? '创建工单' : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
