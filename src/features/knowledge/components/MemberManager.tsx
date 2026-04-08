import { useState, useEffect } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { AccessLevel } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Users,
  Shield,
  Crown,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MemberManagerProps {
  knowledgeBaseId: string;
  onBack?: () => void;
}

export function MemberManager({ knowledgeBaseId, onBack }: MemberManagerProps) {
  const {
    members,
    isLoading,
    error,
    fetchMembers,
    addMember,
    removeMember,
    updateMember,
    clearError,
  } = useKnowledgeBase();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Form state
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberTenantId, setNewMemberTenantId] = useState('');
  const [newMemberAccessLevel, setNewMemberAccessLevel] = useState<AccessLevel>(AccessLevel.Read);

  useEffect(() => {
    fetchMembers(knowledgeBaseId);
  }, [knowledgeBaseId, fetchMembers]);

  const handleAddMember = async () => {
    if (!newMemberId || !newMemberTenantId) return;
    const result = await addMember(knowledgeBaseId, newMemberId, newMemberTenantId, newMemberAccessLevel);
    if (result) {
      setShowAddDialog(false);
      resetForm();
    }
  };

  const handleUpdateMember = async (userId: string, accessLevel: AccessLevel) => {
    await updateMember(knowledgeBaseId, userId, accessLevel);
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    const result = await removeMember(knowledgeBaseId, selectedMember);
    if (result) {
      setShowDeleteDialog(false);
      setSelectedMember(null);
    }
  };

  const openDeleteDialog = (userId: string) => {
    setSelectedMember(userId);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setNewMemberId('');
    setNewMemberTenantId('');
    setNewMemberAccessLevel(AccessLevel.Read);
  };

  const getAccessLevelBadge = (level: AccessLevel, isOwner: boolean) => {
    if (isOwner) {
      return (
        <Badge variant="default" className="gap-1">
          <Crown className="w-3 h-3" />
          所有者
        </Badge>
      );
    }

    const variants: Record<AccessLevel, 'default' | 'secondary' | 'outline'> = {
      [AccessLevel.Read]: 'outline',
      [AccessLevel.Write]: 'secondary',
      [AccessLevel.Admin]: 'default',
    };

    const labels: Record<AccessLevel, string> = {
      [AccessLevel.Read]: '读取',
      [AccessLevel.Write]: '写入',
      [AccessLevel.Admin]: '管理',
    };

    return <Badge variant={variants[level]}>{labels[level]}</Badge>;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <RefreshCw className="w-4 h-4 rotate-180" />
          </Button>
          <Users className="w-5 h-5" />
          <h2 className="font-semibold">成员管理</h2>
          <Badge variant="secondary">{members.length} 人</Badge>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加成员
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
          <Button variant="ghost" size="sm" onClick={clearError} className="ml-2">
            关闭
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>权限</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>加入时间</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  暂无成员
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.user_id.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{member.user_id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.is_owner ? (
                      getAccessLevelBadge(member.access_level, true)
                    ) : (
                      <Select
                        value={member.access_level}
                        onValueChange={(value) => handleUpdateMember(member.user_id, value as AccessLevel)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AccessLevel.Read}>读取</SelectItem>
                          <SelectItem value={AccessLevel.Write}>写入</SelectItem>
                          <SelectItem value={AccessLevel.Admin}>管理</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.is_owner ? (
                      <Badge variant="outline" className="gap-1">
                        <Shield className="w-3 h-3" />
                        所有者
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">成员</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {!member.is_owner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateMember(member.user_id, AccessLevel.Admin)}>
                            <Shield className="w-4 h-4 mr-2" />
                            设为管理员
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(member.user_id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            移除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加成员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">用户 ID</Label>
              <Input
                id="user-id"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                placeholder="输入用户 ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-id">租户 ID</Label>
              <Input
                id="tenant-id"
                value={newMemberTenantId}
                onChange={(e) => setNewMemberTenantId(e.target.value)}
                placeholder="输入租户 ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access-level">权限</Label>
              <Select
                value={newMemberAccessLevel}
                onValueChange={(value) => setNewMemberAccessLevel(value as AccessLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AccessLevel.Read}>读取</SelectItem>
                  <SelectItem value={AccessLevel.Write}>写入</SelectItem>
                  <SelectItem value={AccessLevel.Admin}>管理</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddMember} disabled={!newMemberId || !newMemberTenantId}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认移除成员</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            确定要移除此成员吗？移除后，该成员将失去对此知识库的访问权限。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember}>
              移除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
