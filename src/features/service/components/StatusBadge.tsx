//! StatusBadge 组件 - 工单状态徽章

import { Badge } from '@/components/ui/badge';
import type { TicketStatus } from '../types/service';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  new: {
    label: '新建',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  processing: {
    label: '处理中',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  pending_confirm: {
    label: '待确认',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  completed: {
    label: '已完成',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  cancelled: {
    label: '已取消',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new;
  
  return (
    <Badge
      variant="outline"
      className={`${config.className} ${sizeClasses[size]} font-medium`}
    >
      {config.label}
    </Badge>
  );
}
