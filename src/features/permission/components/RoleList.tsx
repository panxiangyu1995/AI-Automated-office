/**
 * 角色列表组件
 * 
 * PermissionCenter 中使用的角色列表组件
 */

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Shield, Users, Plus } from 'lucide-react';
import type { Role } from '../types/permission.types';

export interface RoleListProps {
  roles: Role[];
  selectedId: string | null;
  onSelect: (roleId: string | null) => void;
  onCreate: () => void;
  isLoading?: boolean;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
}

function RoleListItem({
  role,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  role: Role;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{role.name}</span>
                      {role.is_system && (
                        <Badge variant="secondary" className="text-xs shrink-0">系统</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <Users className="w-3 h-3" />
                      <span>{role.user_count || 0}</span>
                    </div>
                  </div>
                </div>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && <DropdownMenuItem onClick={onEdit}>编辑</DropdownMenuItem>}
                {!role.is_system && onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    删除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RoleList({
  roles,
  selectedId,
  onSelect,
  onCreate,
  isLoading,
  onEdit,
  onDelete,
}: RoleListProps) {
  return (
    <div className="w-72 border-r bg-gray-50 flex flex-col">
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">角色</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreate}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            暂无角色
          </div>
        ) : (
          roles.map((role) => (
            <RoleListItem
              key={role.id}
              role={role}
              isSelected={selectedId === role.id}
              onSelect={() => onSelect(role.id)}
              onEdit={onEdit ? () => onEdit(role) : undefined}
              onDelete={onDelete ? () => onDelete(role) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
