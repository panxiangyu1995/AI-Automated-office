import { useState } from 'react';
import { RefreshCw, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatTimeSince } from './useAutoRefresh';

export interface AutoRefreshConfig {
  enabled: boolean;
  interval: number;
}

export interface AutoRefreshBarProps {
  isRefreshing: boolean;
  lastRefreshTime: Date | null;
  config: AutoRefreshConfig;
  onConfigChange: (config: AutoRefreshConfig) => void;
  onRefresh: () => void;
}

export function AutoRefreshBar({
  isRefreshing,
  lastRefreshTime,
  config,
  onConfigChange,
  onRefresh,
}: AutoRefreshBarProps) {
  const [showSettings, setShowSettings] = useState(false);

  const intervalOptions = [
    { value: 10000, label: '10秒' },
    { value: 30000, label: '30秒' },
    { value: 60000, label: '1分钟' },
    { value: 300000, label: '5分钟' },
    { value: 600000, label: '10分钟' },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* 刷新状态 */}
      <span className="text-xs text-muted-foreground">
        {isRefreshing ? (
          '刷新中...'
        ) : (
          <>上次刷新: {formatTimeSince(lastRefreshTime)}</>
        )}
      </span>

      {/* 手动刷新按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>

      {/* 设置按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSettings(!showSettings)}
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* 设置面板 */}
      {showSettings && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border bg-background p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">刷新设置</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* 启用自动刷新 */}
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh" className="text-sm">
                自动刷新
              </Label>
              <Switch
                id="auto-refresh"
                checked={config.enabled}
                onCheckedChange={(checked) =>
                  onConfigChange({ ...config, enabled: checked })
                }
              />
            </div>

            {/* 刷新间隔 */}
            {config.enabled && (
              <div className="space-y-2">
                <Label htmlFor="interval" className="text-sm">
                  刷新间隔
                </Label>
                <Select
                  value={String(config.interval)}
                  onValueChange={(value) =>
                    onConfigChange({
                      ...config,
                      interval: Number(value),
                    })
                  }
                >
                  <SelectTrigger id="interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {intervalOptions.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
