//! KnowledgeContribution 组件 - 知识贡献面板

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookOpen, Send, CheckCircle, Lightbulb, AlertCircle } from 'lucide-react';

interface KnowledgeContributionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketTitle: string;
  processingSummary?: string;
  customerName: string;
  onSubmit: (data: KnowledgeContributionData) => Promise<void>;
}

export interface KnowledgeContributionData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  sourceTicketId: string;
}

const defaultCategories = [
  '维修经验',
  '故障排查',
  '产品使用',
  '客户培训',
  '最佳实践',
];

export function KnowledgeContribution({
  open,
  onOpenChange,
  ticketId,
  ticketTitle,
  processingSummary,
  customerName,
  onSubmit,
}: KnowledgeContributionProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<KnowledgeContributionData>({
    title: `${ticketTitle} - 解决方案`,
    content: processingSummary || '',
    category: '维修经验',
    tags: [],
    sourceTicketId: ticketId,
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleClose = () => {
    setSubmitted(false);
    onOpenChange(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex flex-col items-center py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">提交成功</h3>
            <p className="text-muted-foreground text-center mb-4">
              您的维修经验已提交审核，审核通过后将自动添加到知识库
            </p>
            <Button onClick={handleClose}>关闭</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            贡献知识
          </DialogTitle>
          <DialogDescription>
            将您的维修经验分享到知识库，帮助同事解决类似问题
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 知识标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">知识标题</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="简要描述问题和解决方案"
              required
            />
          </div>

          {/* 分类 */}
          <div className="space-y-2">
            <Label>知识分类</Label>
            <div className="flex flex-wrap gap-2">
              {defaultCategories.map((cat) => (
                <Badge
                  key={cat}
                  variant={formData.category === cat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFormData({ ...formData, category: cat })}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <Label>标签</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="输入标签后回车添加"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                添加
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 知识内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">知识内容</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="详细描述问题原因、解决步骤和注意事项..."
              rows={8}
              required
            />
            <p className="text-xs text-muted-foreground">
              建议包含：问题现象、原因分析、解决方案、注意事项
            </p>
          </div>

          {/* 来源信息 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                来源信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">工单:</span>
                <span className="font-mono">#{ticketId.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">客户:</span>
                <span>{customerName}</span>
              </div>
            </CardContent>
          </Card>

          {/* 提示 */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">提交后需审核</p>
                  <p className="text-blue-600 dark:text-blue-300">
                    您的知识内容将经过审核后添加到知识库，审核通常在1-2个工作日内完成。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.content}>
              {loading ? (
                '提交中...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  提交审核
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
