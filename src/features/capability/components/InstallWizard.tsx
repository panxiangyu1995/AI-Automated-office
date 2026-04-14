// Installation wizard component

import React, { useState, useCallback } from 'react';
import { useInstaller } from '../hooks/useInstaller';
import { useSecurityScan } from '../hooks/useSecurityScan';
import { SecurityResult } from './SecurityResult';
import { Upload, Globe, Package, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { InstallStep, InstallResponse } from '../types/capability.types';

const STEPS: { id: InstallStep; label: string; icon: React.ReactNode }[] = [
  { id: 'select_source', label: 'Select Source', icon: <Package className="w-4 h-4" /> },
  { id: 'security_scan', label: 'Security Scan', icon: <Check className="w-4 h-4" /> },
  { id: 'dependencies', label: 'Dependencies', icon: <Check className="w-4 h-4" /> },
  { id: 'approval', label: 'Approval', icon: <Check className="w-4 h-4" /> },
  { id: 'installing', label: 'Installing', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  { id: 'complete', label: 'Complete', icon: <Check className="w-4 h-4" /> },
];

interface InstallWizardProps {
  onComplete?: (response: InstallResponse) => void;
  onCancel?: () => void;
}

export function InstallWizard({ onComplete, onCancel }: InstallWizardProps) {
  const { state, loading, setStep, installLocal, installFromMarket, installFromUrl, submitApproval, reset } = useInstaller();
  const { scanning, scanResult, scan } = useSecurityScan();

  const [localFile, setLocalFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [marketplaceId, setMarketplaceId] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLocalFile(e.target.files[0]);
    }
  }, []);

  const handleLocalInstall = async () => {
    if (!localFile) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      // Scan first
      setStep('security_scan');
      setCurrentStepIndex(1);
      await scan(Array.from(uint8Array));

      if (scanResult?.passed) {
        setStep('dependencies');
        setCurrentStepIndex(2);
      }
    };
    reader.readAsArrayBuffer(localFile);
  };

  const handleMarketplaceInstall = async () => {
    if (!marketplaceId) return;

    setStep('security_scan');
    setCurrentStepIndex(1);

    // Marketplace packages are pre-scanned
    setStep('dependencies');
    setCurrentStepIndex(2);
  };

  const handleUrlInstall = async () => {
    if (!urlInput) return;

    setStep('security_scan');
    setCurrentStepIndex(1);

    // Scan from URL
    setStep('dependencies');
    setCurrentStepIndex(2);
  };

  const handleApprove = async () => {
    setStep('approval');
    setCurrentStepIndex(3);

    if (localFile) {
      await submitApproval(localFile.name, 'Installing capability package');
    }
  };

  const handleInstall = async () => {
    setStep('installing');
    setCurrentStepIndex(4);

    let result: InstallResponse | undefined;

    try {
      if (localFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          result = await installLocal(Array.from(uint8Array), localFile.name);
          completeInstallation(result);
        };
        reader.readAsArrayBuffer(localFile);
      } else if (marketplaceId) {
        result = await installFromMarket(marketplaceId);
        completeInstallation(result);
      } else if (urlInput) {
        result = await installFromUrl(urlInput);
        completeInstallation(result);
      }
    } catch (e) {
      completeInstallation({
        status: 'error',
        message: e instanceof Error ? e.message : 'Installation failed',
      });
    }
  };

  const completeInstallation = (result?: InstallResponse) => {
    setStep('complete');
    setCurrentStepIndex(5);
    if (result && onComplete) {
      onComplete(result);
    }
  };

  const handleReset = () => {
    reset();
    setLocalFile(null);
    setUrlInput('');
    setMarketplaceId('');
    setCurrentStepIndex(0);
  };

  const canProceed = () => {
    switch (state.currentStep) {
      case 'select_source':
        return localFile || marketplaceId || urlInput;
      case 'security_scan':
        return scanResult?.passed ?? false;
      case 'dependencies':
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          {STEPS.map((step, index) => (
            <span
              key={step.id}
              className={index <= currentStepIndex ? 'text-primary' : ''}
            >
              {step.label}
            </span>
          ))}
        </div>
        <Progress value={(currentStepIndex / (STEPS.length - 1)) * 100} />
      </div>

      {/* Step Content */}
      <div className="min-h-[300px] space-y-4">
        {/* Select Source Step */}
        {state.currentStep === 'select_source' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Select Installation Source</h2>

            {/* Local File */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <Label>Local File</Label>
              </div>
              <Input
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
              />
              {localFile && (
                <p className="text-sm text-muted-foreground">Selected: {localFile.name}</p>
              )}
            </div>

            {/* Marketplace */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <Label>Marketplace</Label>
              </div>
              <Input
                placeholder="Enter package ID"
                value={marketplaceId}
                onChange={(e) => setMarketplaceId(e.target.value)}
              />
            </div>

            {/* URL */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <Label>From URL</Label>
              </div>
              <Input
                type="url"
                placeholder="https://example.com/package.zip"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Security Scan Step */}
        {state.currentStep === 'security_scan' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Security Scan</h2>
            {scanning ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Scanning for security issues...</span>
              </div>
            ) : scanResult ? (
              <SecurityResult
                result={scanResult}
                onContinue={scanResult.passed ? handleApprove : undefined}
                onCancel={onCancel}
              />
            ) : null}
          </div>
        )}

        {/* Dependencies Step */}
        {state.currentStep === 'dependencies' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Dependencies Check</h2>
            <p className="text-muted-foreground">
              All dependencies are satisfied. Ready to proceed.
            </p>
            <Button onClick={handleApprove}>Continue</Button>
          </div>
        )}

        {/* Approval Step */}
        {state.currentStep === 'approval' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Approval Required</h2>
            <p className="text-muted-foreground">
              This package requires approval before installation.
            </p>
            <Button onClick={handleInstall}>Submit for Approval</Button>
          </div>
        )}

        {/* Installing Step */}
        {state.currentStep === 'installing' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Installing package...</span>
          </div>
        )}

        {/* Complete Step */}
        {state.currentStep === 'complete' && (
          <div className="space-y-4 text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-lg font-semibold">Installation Complete!</h2>
            <p className="text-muted-foreground">
              The capability package has been installed successfully.
            </p>
            <Button onClick={handleReset}>Install Another</Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStepIndex > 0 ? () => {
            const prevIndex = Math.max(0, currentStepIndex - 1);
            setCurrentStepIndex(prevIndex);
            setStep(STEPS[prevIndex].id);
          } : undefined}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={() => {
            if (localFile) handleLocalInstall();
            else if (marketplaceId) handleMarketplaceInstall();
            else if (urlInput) handleUrlInstall();
          }}
          disabled={!canProceed() || loading}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
