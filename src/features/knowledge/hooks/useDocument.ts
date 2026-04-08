import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type {
  KnowledgeDocument,
  DocumentSummary,
  DocumentFilter,
  UploadDocumentRequest,
  UpdateDocumentRequest,
  PaginationParams,
  PaginatedResult,
  DocumentStatus,
} from '../types';

// Default pagination
const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  page_size: 20,
};

export interface UseDocumentReturn {
  // State
  documents: DocumentSummary[];
  currentDocument: KnowledgeDocument | null;
  pagination: PaginationParams;
  totalCount: number;
  isLoading: boolean;
  error: string | null;

  // Document CRUD
  fetchDocuments: (knowledgeBaseId: string, filter?: DocumentFilter, pagination?: PaginationParams) => Promise<void>;
  fetchDocument: (id: string) => Promise<KnowledgeDocument | null>;
  uploadDocument: (request: UploadDocumentRequest) => Promise<KnowledgeDocument | null>;
  updateDocument: (id: string, request: UpdateDocumentRequest) => Promise<KnowledgeDocument | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  batchUpdateStatus: (ids: string[], status: DocumentStatus) => Promise<string[]>;

  // Pagination
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // Utilities
  clearError: () => void;
  clearCurrentDocument: () => void;
}

export function useDocument(): UseDocumentReturn {
  // State
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [currentDocument, setCurrentDocument] = useState<KnowledgeDocument | null>(null);
  const [pagination, setPaginationState] = useState<PaginationParams>(DEFAULT_PAGINATION);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get user context (kept for future use)
  // @ts-expect-error - kept for future use when access tracking is implemented
  const _getUserContext = useCallback(() => ({
    user_id: 'current_user', // TODO: Get from auth store
    tenant_id: 'current_tenant', // TODO: Get from auth store
    department_id: undefined,
  }), []);

  // Fetch documents
  const fetchDocuments = useCallback(async (
    knowledgeBaseId: string,
    filter: DocumentFilter = {},
    paginationParams: PaginationParams = DEFAULT_PAGINATION
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<PaginatedResult<DocumentSummary> | null>(
        'knowledge_document_list',
        {
          userId: 'current_user',
          tenantId: 'current_tenant',
          knowledgeBaseId,
          pagination: paginationParams,
          filter,
        }
      );
      if (result) {
        setDocuments(result.items);
        setTotalCount(result.total);
        setPaginationState(paginationParams);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch single document
  const fetchDocument = useCallback(async (id: string): Promise<KnowledgeDocument | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<KnowledgeDocument | null>('knowledge_document_get', {
        userId: 'current_user',
        tenantId: 'current_tenant',
        id,
      });
      setCurrentDocument(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upload document
  const uploadDocument = useCallback(async (
    request: UploadDocumentRequest
  ): Promise<KnowledgeDocument | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<KnowledgeDocument | null>('knowledge_document_upload', {
        userId: 'current_user',
        tenantId: 'current_tenant',
        request,
      });
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update document
  const updateDocument = useCallback(async (
    id: string,
    request: UpdateDocumentRequest
  ): Promise<KnowledgeDocument | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<KnowledgeDocument | null>('knowledge_document_update', {
        userId: 'current_user',
        tenantId: 'current_tenant',
        id,
        request,
      });
      if (result) {
        setCurrentDocument(result);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete document
  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<boolean>('knowledge_document_delete', {
        userId: 'current_user',
        tenantId: 'current_tenant',
        id,
      });
      if (result) {
        setCurrentDocument(null);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Batch update status
  const batchUpdateStatus = useCallback(async (
    ids: string[],
    status: DocumentStatus
  ): Promise<string[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<string[]>('knowledge_document_batch_update_status', {
        userId: 'current_user',
        tenantId: 'current_tenant',
        ids,
        status,
      });
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pagination helpers
  const setPage = useCallback((page: number) => {
    setPaginationState(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPaginationState({ page: 1, page_size: pageSize });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear current document
  const clearCurrentDocument = useCallback(() => {
    setCurrentDocument(null);
  }, []);

  return {
    documents,
    currentDocument,
    pagination,
    totalCount,
    isLoading,
    error,
    fetchDocuments,
    fetchDocument,
    uploadDocument,
    updateDocument,
    deleteDocument,
    batchUpdateStatus,
    setPage,
    setPageSize,
    clearError,
    clearCurrentDocument,
  };
}
