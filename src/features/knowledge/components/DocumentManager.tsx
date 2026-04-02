import { useState, useEffect } from 'react';
import { useDocument } from '../hooks/useDocument';
import type { DocumentFilter, DocumentStatus, DocumentType, UpdateDocumentRequest } from '../types';
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
import {
  Badge,
  Button,
  Input,
  Label,
} from '@/components/ui';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  FileText,
  File,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface DocumentManagerProps {
  knowledgeBaseId: string;
  onBack?: () => void;
}

export function DocumentManager({ knowledgeBaseId, onBack }: DocumentManagerProps) {
  const {
    documents,
    currentDocument,
    pagination,
    totalCount,
    isLoading,
    error,
    fetchDocuments,
    updateDocument,
    deleteDocument,
    batchUpdateStatus,
    clearError,
  } = useDocument();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<UpdateDocumentRequest>({
    name: undefined,
    tags: [],
    metadata: undefined,
    status: undefined,
  });

  useEffect(() => {
    fetchDocuments(knowledgeBaseId);
  }, [knowledgeBaseId, fetchDocuments]);

  const handleSearch = () => {
    const filter: DocumentFilter = {
      search: searchQuery || undefined,
    };
    fetchDocuments(knowledgeBaseId, filter);
  };

  const handleEdit = async () => {
    if (!selectedDoc) return;
    const result = await updateDocument(selectedDoc, formData);
    if (result) {
      setShowEditDialog(false);
      setSelectedDoc(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    const result = await deleteDocument(selectedDoc);
    if (result) {
      setShowDeleteDialog(false);
      setSelectedDoc(null);
      fetchDocuments(knowledgeBaseId);
    }
  };

  const handleBatchArchive = async () => {
    const result = await batchUpdateStatus(selectedDocs, DocumentStatus.Archived);
    if (result.length > 0) {
      setSelectedDocs([]);
      fetchDocuments(knowledgeBaseId);
    }
  };

  const openEditDialog = (id: string) => {
    setSelectedDoc(id);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (id: string) => {
    setSelectedDoc(id);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: undefined,
      tags: [],
      metadata: undefined,
      status: undefined,
    });
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const variants: Record<DocumentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      [DocumentStatus.Pending]: 'outline',
      [DocumentStatus.Processing]: 'secondary',
      [DocumentStatus.Indexed]: 'default',
      [DocumentStatus.Failed]: 'destructive',
      [DocumentStatus.Archived]: 'outline',
    };
    const labels: Record<DocumentStatus, string> = {
      [DocumentStatus.Pending]: '待处理',
      [DocumentStatus.Processing]: '处理中',
      [DocumentStatus.Indexed]: '已索引',
      [DocumentStatus.Failed]: '失败',
      [DocumentStatus.Archived]: '已归档',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getFileTypeIcon = (fileType: DocumentType) => {
    switch (fileType) {
      case DocumentType.Pdf:
        return <FileText className="w-4 h-4 text-red-500" />;
      case DocumentType.Word:
      case DocumentType.Excel:
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleSelect = (id: string) => {
    setSelectedDocs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(d => d.id));
    }
  };

  const totalPages = Math.ceil(totalCount / pagination.page_size);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <RefreshCw className="w-4 h-4 rotate-180" />
          </Button>
          <FileText className="w-5 h-5" />
          <h2 className="font-semibold">文档管理</h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedDocs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  批量操作 ({selectedDocs.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleBatchArchive}>
                  批量归档
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            上传文档
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="搜索文档..."
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
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  checked={selectedDocs.length === documents.length && documents.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>片段</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  暂无文档
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileTypeIcon(doc.file_type)}
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="uppercase">{doc.file_type}</TableCell>
                  <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>{doc.chunk_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(doc.updated_at * 1000).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(doc.id)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            更新状态
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => updateDocument(doc.id, { status: DocumentStatus.Pending })}>
                              待处理
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateDocument(doc.id, { status: DocumentStatus.Processing })}>
                              处理中
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateDocument(doc.id, { status: DocumentStatus.Indexed })}>
                              已索引
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateDocument(doc.id, { status: DocumentStatus.Archived })}>
                              已归档
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(doc.id)}
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
                  onClick={() => fetchDocuments(knowledgeBaseId, {}, { ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page <= 1}
                />
              </PaginationItem>
              <PaginationItem className="px-4">
                第 {pagination.page} / {totalPages} 页，共 {totalCount} 条
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => fetchDocuments(knowledgeBaseId, {}, { ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Upload Dialog (Placeholder) */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传文档</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                拖拽文件到此处，或点击选择文件
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                支持 PDF、Word、Excel、TXT、Markdown 等格式
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              取消
            </Button>
            <Button disabled>
              上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑文档</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">名称</Label>
              <Input
                id="edit-name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">状态</Label>
              <Select
                value={formData.status || currentDocument?.status || DocumentStatus.Pending}
                onValueChange={(value) => setFormData({ ...formData, status: value as DocumentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DocumentStatus.Pending}>待处理</SelectItem>
                  <SelectItem value={DocumentStatus.Processing}>处理中</SelectItem>
                  <SelectItem value={DocumentStatus.Indexed}>已索引</SelectItem>
                  <SelectItem value={DocumentStatus.Failed}>失败</SelectItem>
                  <SelectItem value={DocumentStatus.Archived}>已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEdit}>
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
            确定要删除这个文档吗？此操作将同时删除所有关联的片段，且无法恢复。
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
