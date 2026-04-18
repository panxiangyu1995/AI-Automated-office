import { useEffect, useRef, useCallback, useState } from 'react';

export interface UseAutoRefreshOptions {
  /** 刷新间隔（毫秒），默认 30000 (30秒) */
  interval?: number;
  /** 是否启用自动刷新 */
  enabled?: boolean;
  /** 刷新回调函数 */
  onRefresh: () => void | Promise<void>;
  /** 刷新前的回调 */
  onBeforeRefresh?: () => void;
  /** 刷新后的回调 */
  onAfterRefresh?: () => void;
  /** 刷新失败时的回调 */
  onError?: (error: Error) => void;
}

/** 自动刷新Hook */
export function useAutoRefresh({
  interval = 30000,
  enabled = true,
  onRefresh,
  onBeforeRefresh,
  onAfterRefresh,
  onError,
}: UseAutoRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onRefreshRef = useRef(onRefresh);
  const onBeforeRefreshRef = useRef(onBeforeRefresh);
  const onAfterRefreshRef = useRef(onAfterRefresh);
  const onErrorRef = useRef(onError);

  // 更新回调引用
  useEffect(() => {
    onRefreshRef.current = onRefresh;
    onBeforeRefreshRef.current = onBeforeRefresh;
    onAfterRefreshRef.current = onAfterRefresh;
    onErrorRef.current = onError;
  }, [onRefresh, onBeforeRefresh, onAfterRefresh, onError]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setError(null);

    try {
      onBeforeRefreshRef.current?.();
      await onRefreshRef.current();
      onAfterRefreshRef.current?.();
      setLastRefreshTime(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // 启动定时器
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // 立即刷新一次
    refresh();

    // 设置定时器
    timerRef.current = setInterval(() => {
      refresh();
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, interval, refresh]);

  return {
    isRefreshing,
    lastRefreshTime,
    error,
    refresh,
    setInterval,
    setEnabled: (enabled: boolean) => {
      if (!enabled && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
  };
}

/** 格式化时间间隔 */
export function formatTimeSince(date: Date | null): string {
  if (!date) return '从未刷新';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
  return `${Math.floor(seconds / 86400)}天前`;
}
