// Approval dialog component

import { useState } from 'react';
import { useApproval } from '../hooks/useApproval';
import type { ApprovalRequest } from '../types/capability.types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ApprovalRequest | null;
  mode: 'approve' | 'reject' | 'submit';
}

export function ApprovalDialog({
  open,
  onOpenChange,
  request,
  mode,
}: ApprovalDialogProps) {
  const { approve, reject, loading } = useApproval();
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleApprove = async () => {
    try {
      await approve(request?.requestId || '', notes || undefined);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to approve:', e);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      return;
    }
    try {
      await reject(request?.requestId || '', reason);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to reject:', e);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-500 bg-red-500/10';
      case 'urgent':
        return 'text-yellow-500 bg-yellow-500/10';
      default:
        return 'text-blue-500 bg-blue-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!request && mode !== 'submit') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'approve' && 'Approve Installation Request'}
            {mode === 'reject' && 'Reject Installation Request'}
            {mode === 'submit' && 'Submit for Approval'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'approve' && 'Review the request details and approve the installation.'}
            {mode === 'reject' && 'Please provide a reason for rejecting this request.'}
            {mode === 'submit' && 'Explain why this package is needed.'}
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4 py-4">
            {/* Package Info */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{request.packageName}</h4>
                <p className="text-sm text-muted-foreground">ID: {request.packageId}</p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                {request.urgency.toUpperCase()}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon(request.status)}
              <span>Status: {request.status}</span>
            </div>

            {/* Requester */}
            <div className="text-sm">
              <span className="text-muted-foreground">Requested by: </span>
              <span>{request.requestedBy}</span>
            </div>

            {/* Notes for approval */}
            {mode === 'approve' && (
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes for this approval..."
                  rows={3}
                />
              </div>
            )}

            {/* Reason for rejection */}
            {mode === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  rows={3}
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {mode === 'approve' && (
            <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          )}
          {mode === 'reject' && (
            <Button onClick={handleReject} disabled={loading || !reason.trim()} variant="destructive">
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
