// Capability package installer hook

import { useState, useCallback } from 'react';
import { safeInvoke } from '@/lib/tauri';
import type {
  InstallResponse,
  InstallWizardState,
  InstallStep,
} from '../types/capability.types';

const INITIAL_STATE: InstallWizardState = {
  currentStep: 'select_source',
  source: null,
};

export function useInstaller() {
  const [state, setState] = useState<InstallWizardState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  const setStep = useCallback((step: InstallStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const installLocal = useCallback(
    async (data: number[], fileName: string, skipApprove: boolean = false, sandboxMode: boolean = true) => {
      setLoading(true);
      try {
        const response = await safeInvoke<InstallResponse>('capability_install_local', {
          data,
          fileName,
          skipApprove,
          sandboxMode,
          tenantId: 'default',
          requestedBy: 'current_user',
        });
        return response ?? { status: 'error', message: 'Installation failed' } as InstallResponse;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const installFromMarket = useCallback(
    async (resourceId: string, version?: string, marketplace: string = 'marketplace', skipApprove: boolean = false) => {
      setLoading(true);
      try {
        const response = await safeInvoke<InstallResponse>('capability_install_from_market', {
          resourceId,
          version,
          marketplace,
          skipApprove,
          sandboxMode: true,
        });
        return response ?? { status: 'error', message: 'Installation failed' } as InstallResponse;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const installFromUrl = useCallback(
    async (url: string, version?: string, skipApprove: boolean = false) => {
      setLoading(true);
      try {
        const response = await safeInvoke<InstallResponse>('capability_install_from_url', {
          url,
          version,
          skipApprove,
          sandboxMode: true,
        });
        return response ?? { status: 'error', message: 'Installation failed' } as InstallResponse;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const submitApproval = useCallback(
    async (packageId: string, reason: string, urgency: string = 'normal') => {
      setLoading(true);
      try {
        const requestId = await safeInvoke<string>('capability_submit_approval', {
          packageId,
          reason,
          urgency,
          tenantId: 'default',
          requestedBy: 'current_user',
        });
        setState((prev) => ({ ...prev, approvalRequestId: requestId ?? '' }));
        return requestId ?? '';
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    loading,
    setStep,
    installLocal,
    installFromMarket,
    installFromUrl,
    submitApproval,
    reset,
  };
}
