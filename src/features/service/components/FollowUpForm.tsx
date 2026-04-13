//! FollowUpForm 组件 - 回访表单

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Star } from 'lucide-react';
import type { CreateFollowUpRequest } from '../types/service';

interface FollowUpFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateFollowUpRequest) => Promise<void>;
  ticketId: string;
  customerName: string;
  customerContact: string;
  defaultValues?: Partial<CreateFollowUpRequest>;
  mode?: 'create' | 'edit';
}

export function FollowUpForm({
  open,
  onOpenChange,
  onSubmit,
  ticketId,
  customerName,
  customerContact,
  defaultValues,
  mode = 'create',
}: FollowUpFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateFollowUpRequest>({
    ticketId,
    customerName: defaultValues?.customerName || customerName,
    customerContact: defaultValues?.customerContact || customerContact,
    visitType: defaultValues?.visitType || 'phone',
    satisfactionLevel: defaultValues?.satisfactionLevel || 5,
    feedback: defaultValues?.feedback || '',
    issues: defaultValues?.issues || [],
    followUpRequired: defaultValues?.followUpRequired || false,
    nextVisitDate: defaultValues?.nextVisitDate,
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSatisfactionChange = (level: number) => {
    setFormData({ ...formData, satisfactionLevel: level as 1 | 2 | 3 | 4 | 5 });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '创建回访记录' : '编辑回访记录'}
          </DialogTitle>
          <DialogDescription>
            记录客户回访信息和服务满意度
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 客户信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>客户姓名</Label>
              <p className="text-sm font-medium">{formData.customerName}</p>
            </div>
            <div className="space-y-2">
              <Label>联系方式</Label>
              <p className="text-sm font-medium">{formData.customerContact}</p>
            </div>
          </div>
          
          {/* 回访方式 */}
          <div className="space-y-2">
            <Label htmlFor="visitType">回访方式</Label>
            <Select
              value={formData.visitType}
              onValueChange={(value) => setFormData({ ...formData, visitType: value as 'phone' | 'visit' | 'online' })}
            >
              <SelectTrigger id="visitType">
                <SelectValue placeholder="选择回访方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">电话回访</SelectItem>
                <SelectItem value="visit">上门回访</SelectItem>
                <SelectItem value="online">在线回访</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* 满意度评分 */}
          <div className="space-y-2">
            <Label>服务满意度</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleSatisfactionChange(level)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      level <= formData.satisfactionLevel
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {formData.satisfactionLevel === 5 && '非常满意'}
                {formData.satisfactionLevel === 4 && '满意'}
                {formData.satisfactionLevel === 3 && '一般'}
                {formData.satisfactionLevel === 2 && '不满意'}
                {formData.satisfactionLevel === 1 && '非常不满意'}
              </span>
            </div>
          </div>
          
          {/* 反馈内容 */}
          <div className="space-y-2">
            <Label htmlFor="feedback">回访反馈</Label>
            <Textarea
              id="feedback"
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              placeholder="请记录客户反馈..."
              rows={4}
            />
          </div>
          
          {/* 是否需要后续跟进 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="followUpRequired"
              checked={formData.followUpRequired}
              onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="followUpRequired" className="font-normal">
              需要后续跟进
            </Label>
          </div>
          
          {formData.followUpRequired && (
            <div className="space-y-2">
              <Label htmlFor="nextVisitDate">下次回访日期</Label>
              <Input
                id="nextVisitDate"
                type="date"
                value={formData.nextVisitDate ? new Date(formData.nextVisitDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  nextVisitDate: e.target.value ? new Date(e.target.value).getTime() : undefined,
                })}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '提交中...' : mode === 'create' ? '创建回访' : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
