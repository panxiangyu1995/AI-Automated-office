import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StocktakingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  currentQuantity: number;
  onSuccess?: () => void;
}

export function StocktakingDialog({
  open,
  onOpenChange,
  productId,
  productName,
  currentQuantity,
  onSuccess,
}: StocktakingDialogProps) {
  const [actualQuantity, setActualQuantity] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ adjustment: number; success: boolean } | null>(null);

  const quantity = parseInt(actualQuantity) || 0;
  const adjustment = quantity - currentQuantity;

  const handleSubmit = async () => {
    if (quantity < 0) return;
    setLoading(true);
    try {
      const record = await invoke<{ adjustment: number }>('warehouse_stocktaking', {
        request: {
          product_id: productId,
          actual_quantity: quantity,
          remark: remark || null,
        },
      });
      setResult({ adjustment: record.adjustment, success: true });
      onSuccess?.();
    } catch (error) {
      console.error('Stocktaking failed:', error);
      setResult({ adjustment: 0, success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActualQuantity('');
    setRemark('');
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>库存盘点</DialogTitle>
          <DialogDescription>对商品进行库存盘点，修正实际库存数量</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">商品信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品名称</span>
                <span className="font-medium">{productName}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-muted-foreground">系统库存</span>
                <span className="font-bold text-lg">{currentQuantity}</span>
              </div>
            </CardContent>
          </Card>

          {/* Adjustment Preview */}
          {actualQuantity && (
            <Card className={adjustment >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">调整数量</span>
                  <span className={`text-xl font-bold ${adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {adjustment >= 0 ? '+' : ''}{adjustment}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form */}
          <div className="space-y-2">
            <Label htmlFor="actual-quantity">实际库存数量 *</Label>
            <Input
              id="actual-quantity"
              type="number"
              min="0"
              value={actualQuantity}
              onChange={(e) => setActualQuantity(e.target.value)}
              placeholder="请输入实际库存数量"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remark">备注</Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="可选：记录盘点原因"
              rows={3}
            />
          </div>

          {/* Result */}
          {result && (
            <Card className={result.success ? 'border-green-200' : 'border-red-200'}>
              <CardContent className="flex items-center gap-3 pt-4">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.success ? `盘点成功，调整数量: ${result.adjustment >= 0 ? '+' : ''}${result.adjustment}` : '盘点失败'}
                </span>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!actualQuantity || loading}>
            {loading ? '提交中...' : '确认盘点'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
