// Security result display component

import { Shield, AlertTriangle, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { SecurityScanResponse, SecurityWarning, SecurityError } from '../types/capability.types';

interface SecurityResultProps {
  result: SecurityScanResponse;
  onContinue?: () => void;
  onCancel?: () => void;
}

export function SecurityResult({ result, onContinue, onCancel }: SecurityResultProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const renderWarning = (warning: SecurityWarning, index: number) => {
    switch (warning.type) {
      case 'network_access':
        return (
          <div key={index} className="flex items-start gap-2 text-yellow-500">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Network access detected: {warning.path}</span>
          </div>
        );
      case 'file_system_access':
        return (
          <div key={index} className="flex items-start gap-2 text-yellow-500">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>File system access: {warning.path}</span>
          </div>
        );
      case 'sensitive_api':
        return (
          <div key={index} className="flex items-start gap-2 text-yellow-500">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Sensitive API call: {warning.api}</span>
          </div>
        );
      case 'dynamic_code':
        return (
          <div key={index} className="flex items-start gap-2 text-yellow-500">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Dynamic code execution: {warning.method}</span>
          </div>
        );
    }
  };

  const renderError = (error: SecurityError, index: number) => {
    switch (error.type) {
      case 'malicious_pattern':
        return (
          <div key={index} className="flex items-start gap-2 text-red-500">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Malicious pattern detected: {error.pattern} at {error.location}</span>
          </div>
        );
      case 'tampered_signature':
        return (
          <div key={index} className="flex items-start gap-2 text-red-500">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Signature has been tampered</span>
          </div>
        );
      case 'unknown_source':
        return (
          <div key={index} className="flex items-start gap-2 text-red-500">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Unknown source - cannot verify publisher</span>
          </div>
        );
      case 'excessive_permissions':
        return (
          <div key={index} className="flex items-start gap-2 text-red-500">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Excessive permissions required: {error.required.join(', ')}</span>
          </div>
        );
      case 'suspicious_behavior':
        return (
          <div key={index} className="flex items-start gap-2 text-red-500">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Suspicious behavior: {error.behavior}</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Score Section */}
      <div className={`p-4 rounded-lg border ${getScoreBg(result.score)}`}>
        <div className="flex items-center gap-4">
          <Shield className={`w-12 h-12 ${getScoreColor(result.score)}`} />
          <div className="flex-1">
            <div className="text-2xl font-bold">Security Score: {result.score}/100</div>
            <div className="text-sm text-muted-foreground">
              Scanned in {result.scanDurationMs}ms
            </div>
          </div>
          {result.passed ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : (
            <XCircle className="w-8 h-8 text-red-500" />
          )}
        </div>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-yellow-500">
            <AlertTriangle className="w-4 h-4" />
            Warnings ({result.warnings.length})
          </h4>
          <div className="space-y-1 pl-6">
            {result.warnings.map((w, i) => renderWarning(w, i))}
          </div>
        </div>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            Security Issues ({result.errors.length})
          </h4>
          <div className="space-y-1 pl-6">
            {result.errors.map((e, i) => renderError(e, i))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
          >
            Cancel
          </button>
        )}
        {onContinue && result.passed && (
          <button
            onClick={onContinue}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Continue Installation
          </button>
        )}
      </div>
    </div>
  );
}
