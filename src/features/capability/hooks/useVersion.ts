// Version management hook

import { useState, useCallback } from 'react';
import { safeInvoke } from '@/lib/tauri';
import type { UpdateInfo, SandboxConfig } from '../types/capability.types';

interface UseVersionReturn {
  loading: boolean;
  updates: UpdateInfo[];
  error: string | null;
  checkUpdates: () => Promise<UpdateInfo[]>;
  executeUpdate: (packageId: string, targetVersion?: string) => Promise<boolean>;
  getSandboxConfig: () => Promise<SandboxConfig>;
  updateSandboxConfig: (config: Partial<SandboxConfig>) => Promise<SandboxConfig>;
}

const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  sandboxType: 'process',
  maxMemoryMb: 512,
  maxCpuPercent: 50,
  maxDurationSecs: 300,
  networkAllowed: false,
  filesystemReadonly: false,
  environmentVars: {},
  allowedSyscalls: [],
  deniedSyscalls: [],
};

export function useVersion(): UseVersionReturn {
  const [loading, setLoading] = useState(false);
  const [updates, setUpdates] = useState<UpdateInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkUpdates = useCallback(async (): Promise<UpdateInfo[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await safeInvoke<UpdateInfo[]>('capability_check_updates', {
        tenantId: 'default',
      });
      setUpdates(result ?? []);
      return result ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const executeUpdate = useCallback(
    async (packageId: string, targetVersion?: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await safeInvoke('capability_execute_update', {
          packageId,
          targetVersion,
        });
        setUpdates((prev) => prev.filter((u) => u.packageId !== packageId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getSandboxConfig = useCallback(async (): Promise<SandboxConfig> => {
    const result = await safeInvoke<SandboxConfig>('capability_get_sandbox_config');
    return result ?? DEFAULT_SANDBOX_CONFIG;
  }, []);

  const updateSandboxConfig = useCallback(
    async (config: Partial<SandboxConfig>): Promise<SandboxConfig> => {
      const result = await safeInvoke<SandboxConfig>('capability_update_sandbox_config', {
        sandboxType: config.sandboxType ?? 'process',
        maxMemoryMb: config.maxMemoryMb ?? 512,
        maxCpuPercent: config.maxCpuPercent ?? 50,
        maxDurationSecs: config.maxDurationSecs ?? 300,
        networkAllowed: config.networkAllowed ?? false,
      });
      return result ?? DEFAULT_SANDBOX_CONFIG;
    },
    []
  );

  return {
    loading,
    updates,
    error,
    checkUpdates,
    executeUpdate,
    getSandboxConfig,
    updateSandboxConfig,
  };
}
