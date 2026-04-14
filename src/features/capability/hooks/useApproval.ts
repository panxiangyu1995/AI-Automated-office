// Approval workflow hook

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ApprovalRequest } from '../types/capability.types';

interface UseApprovalReturn {
  loading: boolean;
  pendingApprovals: ApprovalRequest[];
  error: string | null;
  fetchPending: () => Promise<ApprovalRequest[]>;
  approve: (requestId: string, notes?: string) => Promise<string>;
  reject: (requestId: string, reason: string) => Promise<string>;
}

export function useApproval(): UseApprovalReturn {
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async (): Promise<ApprovalRequest[]> => {
    setLoading(true);
    setError(null);
    try {
      const approvals = await invoke<ApprovalRequest[]>('capability_pending_approvals');
      setPendingApprovals(approvals);
      return approvals;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const approve = useCallback(async (requestId: string, notes?: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const status = await invoke<string>('capability_process_approval', {
        requestId,
        decision: 'approve',
        notes,
        userId: 'current_user',
      });
      setPendingApprovals((prev) => prev.filter((a) => a.requestId !== requestId));
      return status;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reject = useCallback(async (requestId: string, reason: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const status = await invoke<string>('capability_process_approval', {
        requestId,
        decision: 'reject',
        notes: reason,
        userId: 'current_user',
      });
      setPendingApprovals((prev) => prev.filter((a) => a.requestId !== requestId));
      return status;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    pendingApprovals,
    error,
    fetchPending,
    approve,
    reject,
  };
}
