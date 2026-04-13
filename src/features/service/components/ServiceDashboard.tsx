//! ServiceDashboard 组件 - 售后仪表板

import { useEffect } from 'react';
import { useServiceStore } from '../stores/serviceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ServiceDashboardProps {
  className?: string;
}

export function ServiceDashboard({ className }: ServiceDashboardProps) {
  const { statistics, fetchStatistics } = useServiceStore();
  
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);
  
  const stats = [
    {
      label: '新建',
      value: statistics?.new || 0,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      label: '处理中',
      value: statistics?.processing || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      label: '待确认',
      value: statistics?.pendingConfirm || 0,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    {
      label: '已完成',
      value: statistics?.completed || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      label: '已取消',
      value: statistics?.cancelled || 0,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
  ];
  
  return (
    <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${className || ''}`}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
