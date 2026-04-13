//! PriorityTag 组件 - 工单优先级标签

import { cn } from '@/lib/utils';
import type { TicketPriority } from '../types/service';

interface PriorityTagProps {
  priority: TicketPriority;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const priorityConfig: Record<TicketPriority, { label: string; className: string; icon: string }> = {
  low: {
    label: '低',
    className: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    icon: '↓',
  },
  medium: {
    label: '中',
    className: 'bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-900 dark:text-blue-400 dark:border-blue-700',
    icon: '→',
  },
  high: {
    label: '高',
    className: 'bg-orange-100 text-orange-600 border-orange-300 dark:bg-orange-900 dark:text-orange-400 dark:border-orange-700',
    icon: '↑',
  },
  urgent: {
    label: '紧急',
    className: 'bg-red-100 text-red-600 border-red-300 dark:bg-red-900 dark:text-red-400 dark:border-red-700',
    icon: '⚡',
  },
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 text-xs',
  md: 'text-sm px-2 py-0.5 text-sm',
  lg: 'text-base px-2.5 py-1 text-base',
};

export function PriorityTag({ priority, size = 'md', showLabel = true }: PriorityTagProps) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded border',
        config.className,
        sizeClasses[size]
      )}
    >
      <span className="font-bold">{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
