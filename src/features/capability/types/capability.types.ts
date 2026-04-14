// Capability package management types

export interface InstallRequest {
  source: 'local' | 'marketplace' | 'private_market' | 'url';
  resourceId: string;
  version?: string;
  skipApprove: boolean;
  sandboxMode: boolean;
}

export interface InstallResponse {
  status: 'success' | 'pending_approval' | 'security_blocked' | 'dependency_missing' | 'error';
  capabilityId?: string;
  installedPath?: string;
  version?: string;
  requestId?: string;
  estimatedWait?: number;
  reason?: string;
  details?: string;
  missing?: DependencyInfo[];
  code?: string;
  message?: string;
}

export interface DependencyInfo {
  id: string;
  name: string;
  requiredVersion: string;
  currentVersion?: string;
}

export interface SecurityScanResponse {
  passed: boolean;
  score: number;
  warnings: SecurityWarning[];
  errors: SecurityError[];
  scanDurationMs: number;
}

export type SecurityWarning =
  | { type: 'network_access'; path: string }
  | { type: 'file_system_access'; path: string }
  | { type: 'sensitive_api'; api: string }
  | { type: 'dynamic_code'; method: string };

export type SecurityError =
  | { type: 'malicious_pattern'; pattern: string; location: string }
  | { type: 'tampered_signature' }
  | { type: 'unknown_source' }
  | { type: 'excessive_permissions'; required: string[] }
  | { type: 'suspicious_behavior'; behavior: string };

export interface ApprovalRequest {
  requestId: string;
  packageId: string;
  packageName: string;
  requestedBy: string;
  requestedAt: number;
  urgency: 'normal' | 'urgent' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

export interface UpdateInfo {
  packageId: string;
  currentVersion: string;
  latestVersion: string;
}

export interface SandboxConfig {
  sandboxType: 'none' | 'process' | 'wasm' | 'container';
  maxMemoryMb: number;
  maxCpuPercent: number;
  maxDurationSecs: number;
  networkAllowed: boolean;
  filesystemReadonly: boolean;
  environmentVars: Record<string, string>;
  allowedSyscalls: string[];
  deniedSyscalls: string[];
}

export type InstallStep =
  | 'select_source'
  | 'security_scan'
  | 'dependencies'
  | 'approval'
  | 'installing'
  | 'complete';

export interface InstallWizardState {
  currentStep: InstallStep;
  source: 'local' | 'marketplace' | 'url' | null;
  file?: File;
  url?: string;
  resourceId?: string;
  version?: string;
  securityScan?: SecurityScanResponse;
  dependencies?: DependencyInfo[];
  approvalRequestId?: string;
  result?: InstallResponse;
  error?: string;
}
