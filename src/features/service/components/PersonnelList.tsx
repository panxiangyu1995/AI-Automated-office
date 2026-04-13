//! PersonnelList 组件 - 服务人员列表

import { useEffect } from 'react';
import { useServiceStore } from '../stores/serviceStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import type { PersonnelListItem } from '../types/service';

interface PersonnelListProps {
  onPersonnelClick?: (personnel: PersonnelListItem) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  available: {
    label: '可用',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  busy: {
    label: '忙碌',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  offline: {
    label: '离线',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
};

export function PersonnelList({ onPersonnelClick }: PersonnelListProps) {
  const { personnel, personnelLoading, fetchPersonnel } = useServiceStore();
  
  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);
  
  if (personnelLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (personnel.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>暂无服务人员</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {personnel.map((person) => {
        const config = statusConfig[person.status] || statusConfig.offline;
        const loadPercent = Math.round((person.currentTicketCount / person.maxTicketCount) * 100);
        
        return (
          <Card
            key={person.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onPersonnelClick?.(person)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{person.userName}</CardTitle>
                    {person.department && (
                      <CardDescription>{person.department}</CardDescription>
                    )}
                  </div>
                </div>
                <Badge className={config.className}>{config.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">当前工单</span>
                  <span className="font-medium">
                    {person.currentTicketCount} / {person.maxTicketCount}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      loadPercent >= 90
                        ? 'bg-red-500'
                        : loadPercent >= 70
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(loadPercent, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
