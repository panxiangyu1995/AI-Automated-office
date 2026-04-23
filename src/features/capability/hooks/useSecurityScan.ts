// Security scan hook for capability packages

import { useState, useCallback } from 'react';
import { safeInvoke } from '@/lib/tauri';
import type { SecurityScanResponse } from '../types/capability.types';

interface UseSecurityScanReturn {
  scanning: boolean;
  scanResult: SecurityScanResponse | null;
  error: string | null;
  scan: (data: number[]) => Promise<SecurityScanResponse | null>;
  clearResult: () => void;
}

export function useSecurityScan(): UseSecurityScanReturn {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SecurityScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (data: number[]): Promise<SecurityScanResponse | null> => {
    setScanning(true);
    setError(null);
    try {
      const result = await safeInvoke<SecurityScanResponse>('capability_security_scan', { data });
      setScanResult(result ?? null);
      return result ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setScanning(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  return {
    scanning,
    scanResult,
    error,
    scan,
    clearResult,
  };
}
