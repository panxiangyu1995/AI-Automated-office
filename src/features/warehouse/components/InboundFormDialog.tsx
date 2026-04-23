import { useState } from 'react';
import { safeInvoke } from '@/lib/tauri';
import { Plus, Trash2 } from 'lucide-react';
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

interface InboundFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface InboundItem {
  productId: string;
  productName: string;
  quantity: number;
}

export function InboundFormDialog({ open, onOpenChange, onSuccess }: InboundFormDialogProps) {
  const [inboundType, setInboundType] = useState<string>('purchase');
  const [supplierName, setSupplierName] = useState('');
  const [items, setItems] = useState<InboundItem[]>([
    { productId: 'prod-001', productName: '联想ThinkPad笔记本', quantity: 10 },
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InboundItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await safeInvoke('warehouse_create_inbound', {
        request: {
          inboundType,
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
      console.error('Failed to create inbound:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInboundType('purchase');
    setSupplierName('');
    setItems([{ productId: 'prod-001', productName: '联想ThinkPad笔记本', quantity: 10 }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>创建入库单</DialogTitle>
          <DialogDescription>填写入库单信息，创建新的入库记录</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>入库类型</Label>
              <Select value={inboundType} onValueChange={setInboundType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">采购入库</SelectItem>
                  <SelectItem value="return">退货入库</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>供应商名称</Label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="输入供应商名称"
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>入库商品</Label>
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
