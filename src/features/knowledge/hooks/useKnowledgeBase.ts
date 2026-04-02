import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type {
  KnowledgeBase,
  KnowledgeBaseSummary,
  KnowledgeBaseFilter,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  KnowledgeMember,
  PaginationParams,
  PaginatedResult,
  PermissionCheckResult,
  AccessLevel,
} from '../types';

// Default pagination
const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  page_size: 20,
};

export interface UseKnowledgeBaseReturn {
  // State
  knowledgeBases: KnowledgeBaseSummary[];
  currentKnowledgeBase: KnowledgeBase | null;
  members: KnowledgeMember[];
  pagination: PaginationParams;
  totalCount: number;
  isLoading: boolean;
  error: string | null;

  // Knowledge Base CRUD
  fetchKnowledgeBases: (filter?: KnowledgeBaseFilter, pagination?: PaginationParams) => Promise<void>;
  fetchKnowledgeBase: (id: string) => Promise<KnowledgeBase | null>;
  createKnowledgeBase: (request: CreateKnowledgeBaseRequest) => Promise<KnowledgeBase | null>;
  updateKnowledgeBase: (id: string, request: UpdateKnowledgeBaseRequest) => Promise<KnowledgeBase | null>;
  deleteKnowledgeBase: (id: string) => Promise<boolean>;

  // Member Management
  fetchMembers: (knowledgeBaseId: string) => Promise<KnowledgeMember[]>;
  addMember: (knowledgeBaseId: string, userId: string, tenantId: string, accessLevel: AccessLevel) => Promise<boolean>;
  removeMember: (knowledgeBaseId: string, userId: string) => Promise<boolean>;
  updateMember: (knowledgeBaseId: string, userId: string, accessLevel: AccessLevel) => Promise<boolean>;

  // Permission Check
  checkPermission: (knowledgeBaseId: string, requiredLevel: AccessLevel) => Promise<PermissionCheckResult>;

  // Pagination
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // Utilities
  clearError: () => void;
}

export function useKnowledgeBase(): UseKnowledgeBaseReturn {
  // State
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseSummary[]>([]);
  const [currentKnowledgeBase, setCurrentKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [members, setMembers] = useState<KnowledgeMember[]>([]);
  const [pagination, setPaginationState] = useState<PaginationParams>(DEFAULT_PAGINATION);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get user context
  const getUserContext = useCallback(() => ({
    user_id: 'current_user', // TODO: Get from auth store
    tenant_id: 'current_tenant', // TODO: Get from auth store
    department_id: undefined,
  }), []);

  // Fetch knowledge bases
  const fetchKnowledgeBases = useCallback(async (
    filter: KnowledgeBaseFilter = {},
    paginationParams: PaginationParams = DEFAULT_PAGINATION
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<PaginatedResult<KnowledgeBaseSummary>>(
        'knowledge_base_list',
        {
          user: getUserContext(),
          pagination: paginationParams,
          filter,
        }
      );
      setKnowledgeBases(result.items);
      setTotalCount(result.total);
      setPaginationState(paginationParams);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [getUserContext]);

  // Fetch single knowledge base
  const fetchKnowledgeBase = useCallback(async (id: string): Promise<KnowledgeBase | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<KnowledgeBase | null>('knowledge_base_get', {
        user: getUserContext(),
        id,
      });
      setCurrentKnowledgeBase(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getUserContext]);

  // Create knowledge base
  const createKnowledgeBase = useCallback(async (
    request: CreateKnowledgeBaseRequest
  ): Promise<KnowledgeBase | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<KnowledgeBase>('knowledge_base_create', {
        user: getUserContext(),
        request,
      });
      // Refresh list
      await fetchKnowledgeBases();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getUserContext, fetchKnowledgeBases]);

  // Update knowledge base
  const updateKnowledgeBase = useCallback(async (
    id: string,
    request: UpdateKnowledgeBaseRequest
  ): Promise<KnowledgeBase | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<KnowledgeBase | null>('knowledge_base_update', {
        user: getUserContext(),
        id,
        request,
      });
      if (result) {
        setCurrentKnowledgeBase(result);
        // Refresh list
        await fetchKnowledgeBases();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getUserContext, fetchKnowledgeBases]);

  // Delete knowledge base
  const deleteKnowledgeBase = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<boolean>('knowledge_base_delete', {
        user: getUserContext(),
        id,
      });
      if (result) {
        setCurrentKnowledgeBase(null);
        // Refresh list
        await fetchKnowledgeBases();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getUserContext, fetchKnowledgeBases]);

  // Fetch members
  const fetchMembers = useCallback(async (knowledgeBaseId: string): Promise<KnowledgeMember[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<KnowledgeMember[] | null>('knowledge_member_list', {
        user: getUserContext(),
        knowledgeBaseId,
      });
      const memberList = result || [];
      setMembers(memberList);
      return memberList;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getUserContext]);

  // Add member
  const addMember = useCallback(async (
    knowledgeBaseId: string,
    userId: string,
    tenantId: string,
    accessLevel: AccessLevel
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await invoke('knowledge_member_add', {
        user: getUserContext(),
        knowledgeBaseId,
        targetUserId: userId,
        targetTenantId: tenantId,
        accessLevel,
      });
      // Refresh members
      await fetchMembers(knowledgeBaseId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getUserContext, fetchMembers]);

  // Remove member
  const removeMember = useCallback(async (
    knowledgeBaseId: string,
    userId: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<boolean>('knowledge_member_remove', {
        user: getUserContext(),
        knowledgeBaseId,
        targetUserId: userId,
      });
      if (result) {
        await fetchMembers(knowledgeBaseId);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getUserContext, fetchMembers]);

  // Update member
  const updateMember = useCallback(async (
    knowledgeBaseId: string,
    userId: string,
    accessLevel: AccessLevel
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<boolean>('knowledge_member_update', {
        user: getUserContext(),
        knowledgeBaseId,
        targetUserId: userId,
        accessLevel,
      });
      if (result) {
        await fetchMembers(knowledgeBaseId);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getUserContext, fetchMembers]);

  // Check permission
  const checkPermission = useCallback(async (
    knowledgeBaseId: string,
    requiredLevel: AccessLevel
  ): Promise<PermissionCheckResult> => {
    try {
      return await invoke<PermissionCheckResult>('knowledge_check_permission', {
        user: getUserContext(),
        knowledgeBaseId,
        requiredLevel,
      });
    } catch (err) {
      return {
        allowed: false,
        reason: err instanceof Error ? err.message : String(err),
      };
    }
  }, [getUserContext]);

  // Pagination helpers
  const setPage = useCallback((page: number) => {
    setPaginationState(prev => ({ ...prev, page }));
    fetchKnowledgeBases({}, { ...pagination, page });
  }, [fetchKnowledgeBases, pagination]);

  const setPageSize = useCallback((pageSize: number) => {
    setPaginationState({ page: 1, page_size: pageSize });
    fetchKnowledgeBases({}, { page: 1, page_size: pageSize });
  }, [fetchKnowledgeBases]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    knowledgeBases,
    currentKnowledgeBase,
    members,
    pagination,
    totalCount,
    isLoading,
    error,
    fetchKnowledgeBases,
    fetchKnowledgeBase,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    fetchMembers,
    addMember,
    removeMember,
    updateMember,
    checkPermission,
    setPage,
    setPageSize,
    clearError,
  };
}
