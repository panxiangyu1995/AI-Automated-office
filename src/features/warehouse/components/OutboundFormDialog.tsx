import { useState } from 'react';
import { safeInvoke } from '@/lib/tauri';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface OutboundFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface OutboundItem {
  productId: string;
  productName: string;
  quantity: number;
}

export function OutboundFormDialog({ open, onOpenChange, onSuccess }: OutboundFormDialogProps) {
  const [outboundType, setOutboundType] = useState<string>('sale');
  const [customerName, setCustomerName] = useState('');
  const [salesOrderId, setSalesOrderId] = useState('');
  const [items, setItems] = useState<OutboundItem[]>([
    { productId: 'prod-001', productName: '联想ThinkPad笔记本', quantity: 2 },
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OutboundItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await safeInvoke('warehouse_create_outbound', {
        request: {
          outboundType,
          salesOrderId: salesOrderId || null,
          items: items.map((item) => ({
            productId: item.productId || 'prod-001',
            productName: item.productName,
            quantity: item.quantity,
          })),
        },
      });
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to create outbound:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOutboundType('sale');
    setCustomerName('');
    setSalesOrderId('');
    setItems([{ productId: 'prod-001', productName: '联想ThinkPad笔记本', quantity: 2 }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>创建出库单</DialogTitle>
          <DialogDescription>填写出库单信息，创建新的出库记录</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>出库类型</Label>
              <Select value={outboundType} onValueChange={setOutboundType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">销售出库</SelectItem>
                  <SelectItem value="return">退货出库</SelectItem>
                  <SelectItem value="transfer">调拨出库</SelectItem>
                  <SelectItem value="damage">损耗</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>客户名称</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="输入客户名称"
              />
            </div>
          </div>

          {/* Sales Order Link */}
          <div className="space-y-2">
            <Label>关联销售订单（可选）</Label>
            <Input
              value={salesOrderId}
              onChange={(e) => setSalesOrderId(e.target.value)}
              placeholder="输入销售订单ID"
            />
            <p className="text-xs text-muted-foreground">
              关联销售订单后，系统将自动更新订单的发货状态
            </p>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>出库商品</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                添加商品
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">商品</Label>
                        <Input
                          value={item.productName}
                          onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                          placeholder="商品名称"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">数量</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              出库操作将直接扣减库存，请确认出库数量正确
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || items.length === 0}>
            {loading ? '提交中...' : '确认创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
