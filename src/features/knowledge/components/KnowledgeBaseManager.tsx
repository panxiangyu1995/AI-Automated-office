import { useState, useEffect } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import type { CreateKnowledgeBaseRequest, UpdateKnowledgeBaseRequest, KnowledgeBaseFilter } from '../types';
import { KnowledgePermission } from '../types';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  FileText,
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface KnowledgeBaseManagerProps {
  onSelectKnowledgeBase?: (id: string) => void;
}

export function KnowledgeBaseManager({ onSelectKnowledgeBase }: KnowledgeBaseManagerProps) {
  const {
    knowledgeBases,
    pagination,
    totalCount,
    isLoading,
    error,
    fetchKnowledgeBases,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    clearError,
  } = useKnowledgeBase();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedKb, setSelectedKb] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateKnowledgeBaseRequest>({
    name: '',
    description: '',
    permission: KnowledgePermission.PartialTeam,
    tags: [],
    embedding_model: undefined,
    indexing_technique: undefined,
  });

  useEffect(() => {
    fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  const handleSearch = () => {
    const filter: KnowledgeBaseFilter = {
      search: searchQuery || undefined,
    };
    fetchKnowledgeBases(filter);
  };

  const handleCreate = async () => {
    const result = await createKnowledgeBase(formData);
    if (result) {
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedKb) return;
    const request: UpdateKnowledgeBaseRequest = {
      name: formData.name,
      description: formData.description,
      permission: formData.permission,
      tags: formData.tags,
    };
    const result = await updateKnowledgeBase(selectedKb, request);
    if (result) {
      setShowEditDialog(false);
      setSelectedKb(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!selectedKb) return;
    const result = await deleteKnowledgeBase(selectedKb);
    if (result) {
      setShowDeleteDialog(false);
      setSelectedKb(null);
    }
  };

  const openEditDialog = (id: string) => {
    const kb = knowledgeBases.find(k => k.id === id);
    if (kb) {
      setSelectedKb(id);
      setFormData({
        name: kb.name,
        description: kb.description || '',
        permission: kb.permission,
        tags: kb.tags,
      });
      setShowEditDialog(true);
    }
  };

  const openDeleteDialog = (id: string) => {
    setSelectedKb(id);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permission: KnowledgePermission.PartialTeam,
      tags: [],
    });
  };

  const getPermissionBadge = (permission: KnowledgePermission) => {
    const variants: Record<KnowledgePermission, 'default' | 'secondary' | 'outline'> = {
      [KnowledgePermission.OnlyMe]: 'outline',
      [KnowledgePermission.AllTeam]: 'secondary',
      [KnowledgePermission.PartialTeam]: 'default',
    };
    const labels: Record<KnowledgePermission, string> = {
      [KnowledgePermission.OnlyMe]: '仅我',
      [KnowledgePermission.AllTeam]: '全团队',
      [KnowledgePermission.PartialTeam]: '部分成员',
    };
    return <Badge variant={variants[permission]}>{labels[permission]}</Badge>;
  };

  const totalPages = Math.ceil(totalCount / pagination.page_size);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <h2 className="font-semibold">知识库管理</h2>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建知识库
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="搜索知识库..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
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
              <TableHead>名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>权限</TableHead>
              <TableHead>文档</TableHead>
              <TableHead>片段</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : knowledgeBases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  暂无知识库
                </TableCell>
              </TableRow>
            ) : (
              knowledgeBases.map((kb) => (
                <TableRow key={kb.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => onSelectKnowledgeBase?.(kb.id)}
                      >
                        {kb.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[200px]">
                    {kb.description || '-'}
                  </TableCell>
                  <TableCell>{getPermissionBadge(kb.permission)}</TableCell>
                  <TableCell>{kb.document_count}</TableCell>
                  <TableCell>{kb.chunk_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(kb.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(kb.id)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSelectKnowledgeBase?.(kb.id)}>
                          <FileText className="w-4 h-4 mr-2" />
                          管理文档
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" />
                          管理成员
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(kb.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => fetchKnowledgeBases({}, { ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page <= 1}
                />
              </PaginationItem>
              <PaginationItem className="px-4">
                第 {pagination.page} / {totalPages} 页，共 {totalCount} 条
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => fetchKnowledgeBases({}, { ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建知识库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入知识库名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入知识库描述"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission">权限</Label>
              <Select
                value={formData.permission}
                onValueChange={(value) => setFormData({ ...formData, permission: value as KnowledgePermission })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KnowledgePermission.OnlyMe}>仅我</SelectItem>
                  <SelectItem value={KnowledgePermission.AllTeam}>全团队</SelectItem>
                  <SelectItem value={KnowledgePermission.PartialTeam}>部分成员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑知识库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">名称</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-permission">权限</Label>
              <Select
                value={formData.permission}
                onValueChange={(value) => setFormData({ ...formData, permission: value as KnowledgePermission })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KnowledgePermission.OnlyMe}>仅我</SelectItem>
                  <SelectItem value={KnowledgePermission.AllTeam}>全团队</SelectItem>
                  <SelectItem value={KnowledgePermission.PartialTeam}>部分成员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            确定要删除这个知识库吗？此操作将同时删除所有关联的文档和片段，且无法恢复。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
