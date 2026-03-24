/**
 * Resource Security Management - Story 10.6
 * 资源安全管理 - 验证、扫描和审批控制
 *
 * 功能：
 * - 验证来源和签名
 * - 运行静态检查和基于策略的安全扫描
 * - 将风险安装限制在管理员审批之后
 *
 * 铁律合规：
 * - FR746, FR747, FR748, FR749, FR750, FR753, FR754, FR755
 * - NFR14, NFR16
 * - ADR-046, ADR-047
 * - UX-02
 */

import { useState, useMemo } from 'react'
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Key,
  Clock,
  Search,
  RefreshCw,
  Eye,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Types
export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'warning'
export type ScanLevel = 'basic' | 'standard' | 'deep'
export type SecurityRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type SignatureType = 'none' | 'sha256' | 'pgp' | 'x509'

export interface SecurityValidation {
  id: string
  resourceId: string
  resourceName: string
  resourceType: 'plugin' | 'skill' | 'template' | 'knowledge'
  source: string
  signatureType: SignatureType
  signatureValid: boolean
  signatureVerifiedAt?: string
  signer?: string
  validationStatus: ValidationStatus
  validationMessage?: string
}

export interface SecurityScan {
  id: string
  resourceId: string
  resourceName: string
  scanLevel: ScanLevel
  riskLevel: SecurityRiskLevel
  issues: SecurityIssue[]
  scannedAt: string
  duration: number
  scanner: string
}

export interface SecurityIssue {
  id: string
  severity: SecurityRiskLevel
  category: 'vulnerability' | 'malware' | 'permissions' | 'signature' | 'policy'
  title: string
  description: string
  location?: string
  fixAvailable: boolean
  fixSuggestion?: string
}

export interface ApprovalRequest {
  id: string
  resourceId: string
  resourceName: string
  resourceType: 'plugin' | 'skill' | 'template' | 'knowledge'
  requester: string
  requestedAt: string
  riskLevel: SecurityRiskLevel
  reason: string
  status: ApprovalStatus
  reviewedBy?: string
  reviewedAt?: string
  reviewComment?: string
  securityScanId?: string
}

export interface SecurityAuditEntry {
  id: string
  timestamp: string
  actor: string
  action: 'validate' | 'scan' | 'approve' | 'reject' | 'bypass'
  resourceId: string
  resourceName: string
  result: 'success' | 'failure'
  details?: string
}

export interface SecurityPolicy {
  id: string
  name: string
  enabled: boolean
  requireSignature: boolean
  minScanLevel: ScanLevel
  autoApproveLowRisk: boolean
  requireAdminApprovalHighRisk: boolean
  maxRiskLevel: SecurityRiskLevel
}

export interface ResourceSecurityStats {
  totalResources: number
  validatedResources: number
  pendingValidation: number
  failedValidation: number
  riskyResources: number
  pendingApprovals: number
  approvedToday: number
  rejectedToday: number
}

// Mock Data
const MOCK_VALIDATIONS: SecurityValidation[] = [
  {
    id: 'val-1',
    resourceId: 'plugin-1',
    resourceName: 'HR Employee Manager',
    resourceType: 'plugin',
    source: 'official-market',
    signatureType: 'sha256',
    signatureValid: true,
    signatureVerifiedAt: '2026-03-24T10:30:00Z',
    signer: 'ClawHub Official',
    validationStatus: 'valid',
  },
  {
    id: 'val-2',
    resourceId: 'plugin-2',
    resourceName: 'Finance OCR Scanner',
    resourceType: 'plugin',
    source: 'private-market',
    signatureType: 'none',
    signatureValid: false,
    validationStatus: 'warning',
    validationMessage: 'No signature provided - source not verified',
  },
  {
    id: 'val-3',
    resourceId: 'skill-1',
    resourceName: 'Document Parser',
    resourceType: 'skill',
    source: 'external',
    signatureType: 'pgp',
    signatureValid: false,
    validationStatus: 'invalid',
    validationMessage: 'PGP signature verification failed',
    signer: 'Unknown Developer',
  },
]

const MOCK_SCANS: SecurityScan[] = [
  {
    id: 'scan-1',
    resourceId: 'plugin-1',
    resourceName: 'HR Employee Manager',
    scanLevel: 'deep',
    riskLevel: 'low',
    issues: [],
    scannedAt: '2026-03-24T10:35:00Z',
    duration: 12500,
    scanner: 'ClawHub Security Scanner v2.1',
  },
  {
    id: 'scan-2',
    resourceId: 'plugin-2',
    resourceName: 'Finance OCR Scanner',
    scanLevel: 'standard',
    riskLevel: 'high',
    issues: [
      {
        id: 'issue-1',
        severity: 'high',
        category: 'permissions',
        title: 'Excessive file system access',
        description: 'Plugin requests access to read/write user home directory',
        location: 'manifest.json::permissions[3]',
        fixAvailable: true,
        fixSuggestion: 'Limit to specific directories required for functionality',
      },
      {
        id: 'issue-2',
        severity: 'medium',
        category: 'vulnerability',
        title: 'Outdated dependency',
        description: 'Uses axios version with known CVE-2024-1234',
        location: 'node_modules/axios/package.json',
        fixAvailable: true,
        fixSuggestion: 'Update to axios >= 1.6.0',
      },
    ],
    scannedAt: '2026-03-24T09:20:00Z',
    duration: 8200,
    scanner: 'ClawHub Security Scanner v2.1',
  },
  {
    id: 'scan-3',
    resourceId: 'skill-1',
    resourceName: 'Document Parser',
    scanLevel: 'deep',
    riskLevel: 'critical',
    issues: [
      {
        id: 'issue-3',
        severity: 'critical',
        category: 'malware',
        title: 'Suspicious network behavior detected',
        description: 'Makes connections to known malware command servers',
        location: 'index.js::fetch("https://malware-c2.com/api")',
        fixAvailable: false,
      },
    ],
    scannedAt: '2026-03-24T08:15:00Z',
    duration: 15000,
    scanner: 'ClawHub Security Scanner v2.1',
  },
]

const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: 'apr-1',
    resourceId: 'plugin-2',
    resourceName: 'Finance OCR Scanner',
    resourceType: 'plugin',
    requester: 'admin@company.com',
    requestedAt: '2026-03-24T11:00:00Z',
    riskLevel: 'high',
    reason: 'Finance team needs OCR functionality for invoice processing',
    status: 'pending',
    securityScanId: 'scan-2',
  },
  {
    id: 'apr-2',
    resourceId: 'skill-2',
    resourceName: 'Email Auto-Reply',
    resourceType: 'skill',
    requester: 'support@company.com',
    requestedAt: '2026-03-24T10:30:00Z',
    riskLevel: 'low',
    reason: 'Standard email automation for customer responses',
    status: 'pending',
  },
]

const MOCK_AUDIT: SecurityAuditEntry[] = [
  {
    id: 'audit-1',
    timestamp: '2026-03-24T11:05:00Z',
    actor: 'admin@company.com',
    action: 'approve',
    resourceId: 'skill-2',
    resourceName: 'Email Auto-Reply',
    result: 'success',
    details: 'Approved after security scan passed',
  },
  {
    id: 'audit-2',
    timestamp: '2026-03-24T10:35:00Z',
    actor: 'system',
    action: 'scan',
    resourceId: 'plugin-1',
    resourceName: 'HR Employee Manager',
    result: 'success',
    details: 'Deep scan completed - 0 issues found',
  },
  {
    id: 'audit-3',
    timestamp: '2026-03-24T10:30:00Z',
    actor: 'system',
    action: 'validate',
    resourceId: 'plugin-1',
    resourceName: 'HR Employee Manager',
    result: 'success',
    details: 'SHA256 signature verified - signer: ClawHub Official',
  },
  {
    id: 'audit-4',
    timestamp: '2026-03-24T09:20:00Z',
    actor: 'system',
    action: 'scan',
    resourceId: 'plugin-2',
    resourceName: 'Finance OCR Scanner',
    result: 'success',
    details: 'Standard scan completed - 2 issues found (1 high, 1 medium)',
  },
]

const MOCK_POLICY: SecurityPolicy = {
  id: 'policy-1',
  name: 'Default Security Policy',
  enabled: true,
  requireSignature: true,
  minScanLevel: 'standard',
  autoApproveLowRisk: true,
  requireAdminApprovalHighRisk: true,
  maxRiskLevel: 'medium',
}

// Helper functions
function getRiskColor(level: SecurityRiskLevel): string {
  switch (level) {
    case 'low': return 'bg-green-100 text-green-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'critical': return 'bg-red-100 text-red-800'
  }
}

function getValidationIcon(status: ValidationStatus) {
  switch (status) {
    case 'valid': return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'invalid': return <XCircle className="h-4 w-4 text-red-500" />
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'pending': return <Clock className="h-4 w-4 text-gray-400" />
  }
}

function getRiskIcon(level: SecurityRiskLevel) {
  switch (level) {
    case 'low': return <Shield className="h-4 w-4 text-green-500" />
    case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />
    case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}天前`
}

function calculateStats(validations: SecurityValidation[], scans: SecurityScan[], approvals: ApprovalRequest[]): ResourceSecurityStats {
  const today = new Date().toISOString().split('T')[0]
  return {
    totalResources: validations.length,
    validatedResources: validations.filter(v => v.validationStatus === 'valid').length,
    pendingValidation: validations.filter(v => v.validationStatus === 'pending').length,
    failedValidation: validations.filter(v => v.validationStatus === 'invalid').length,
    riskyResources: scans.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length,
    pendingApprovals: approvals.filter(a => a.status === 'pending').length,
    approvedToday: approvals.filter(a => a.status === 'approved' && a.reviewedAt?.startsWith(today)).length,
    rejectedToday: approvals.filter(a => a.status === 'rejected' && a.reviewedAt?.startsWith(today)).length,
  }
}

// Main component
export function ResourceSecurityManagement() {
  const [activeTab, setActiveTab] = useState('validation')
  const [validations] = useState<SecurityValidation[]>(MOCK_VALIDATIONS)
  const [scans] = useState<SecurityScan[]>(MOCK_SCANS)
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(MOCK_APPROVALS)
  const [audit] = useState<SecurityAuditEntry[]>(MOCK_AUDIT)
  const [policy, setPolicy] = useState<SecurityPolicy>(MOCK_POLICY)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResource, setSelectedResource] = useState<SecurityValidation | SecurityScan | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [reviewComment, setReviewComment] = useState('')

  const stats = useMemo(() => calculateStats(validations, scans, approvals), [validations, scans, approvals])

  const filteredValidations = useMemo(() => {
    if (!searchQuery) return validations
    const query = searchQuery.toLowerCase()
    return validations.filter(v =>
      v.resourceName.toLowerCase().includes(query) ||
      v.source.toLowerCase().includes(query)
    )
  }, [validations, searchQuery])

  const filteredScans = useMemo(() => {
    if (!searchQuery) return scans
    const query = searchQuery.toLowerCase()
    return scans.filter(s =>
      s.resourceName.toLowerCase().includes(query) ||
      s.scanner.toLowerCase().includes(query)
    )
  }, [scans, searchQuery])

  const filteredApprovals = useMemo(() => {
    if (!searchQuery) return approvals
    const query = searchQuery.toLowerCase()
    return approvals.filter(a =>
      a.resourceName.toLowerCase().includes(query) ||
      a.requester.toLowerCase().includes(query)
    )
  }, [approvals, searchQuery])

  const handleApprovalAction = (request: ApprovalRequest, action: 'approve' | 'reject') => {
    setSelectedResource(request as unknown as SecurityValidation)
    setApprovalAction(action)
    setReviewComment('')
    setShowApprovalDialog(true)
  }

  const confirmApproval = () => {
    if (!selectedResource) return
    setApprovals(prev => prev.map(a => {
      if (a.id === (selectedResource as unknown as ApprovalRequest).id) {
        return {
          ...a,
          status: approvalAction === 'approve' ? 'approved' : 'rejected',
          reviewedBy: 'admin@company.com',
          reviewedAt: new Date().toISOString(),
          reviewComment,
        }
      }
      return a
    }))
    setShowApprovalDialog(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">资源安全管理</h2>
        <p className="text-sm text-slate-500 mt-1">验证来源和签名，运行安全扫描，管理风险资源审批</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">总资源数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.totalResources}</div>
            <p className="text-xs text-slate-500 mt-1">
              已验证 {stats.validatedResources} | 待验证 {stats.pendingValidation}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">风险资源</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.riskyResources}</div>
            <p className="text-xs text-slate-500 mt-1">
              高风险/严重风险资源数
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">待审批</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-slate-500 mt-1">
              今日已批准 {stats.approvedToday} | 已拒绝 {stats.rejectedToday}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">签名验证</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {validations.filter(v => v.signatureValid).length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              有效签名 / {validations.length} 资源
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索资源..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重新扫描
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="validation">签名验证</TabsTrigger>
          <TabsTrigger value="scanning">安全扫描</TabsTrigger>
          <TabsTrigger value="approvals">
            审批队列
            {stats.pendingApprovals > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingApprovals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="policy">安全策略</TabsTrigger>
          <TabsTrigger value="audit">审计日志</TabsTrigger>
        </TabsList>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">来源和签名验证</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>资源</TableHead>
                    <TableHead>来源</TableHead>
                    <TableHead>签名类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>验证时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredValidations.map((validation) => (
                    <TableRow key={validation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getValidationIcon(validation.validationStatus)}
                          <div>
                            <div className="font-medium">{validation.resourceName}</div>
                            <div className="text-xs text-slate-500">{validation.resourceType}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{validation.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-slate-400" />
                          <span className="uppercase text-sm">{validation.signatureType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {validation.signatureValid ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">有效</span>
                            {validation.signer && (
                              <span className="text-xs text-slate-500">by {validation.signer}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">无效</span>
                          </div>
                        )}
                        {validation.validationMessage && (
                          <p className="text-xs text-slate-500 mt-1">{validation.validationMessage}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {validation.signatureVerifiedAt
                          ? formatRelativeTime(validation.signatureVerifiedAt)
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scanning Tab */}
        <TabsContent value="scanning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">安全扫描结果</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>资源</TableHead>
                    <TableHead>扫描级别</TableHead>
                    <TableHead>风险等级</TableHead>
                    <TableHead>问题数</TableHead>
                    <TableHead>扫描时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRiskIcon(scan.riskLevel)}
                          <span className="font-medium">{scan.resourceName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">{scan.scanLevel}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(scan.riskLevel)}>
                          {scan.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {scan.issues.length === 0 ? (
                          <span className="text-green-600">无问题</span>
                        ) : (
                          <div>
                            <span className="text-orange-600">{scan.issues.length} 问题</span>
                            <p className="text-xs text-slate-500">
                              高 {scan.issues.filter(i => i.severity === 'high' || i.severity === 'critical').length} |
                              中 {scan.issues.filter(i => i.severity === 'medium').length}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-500">
                          {formatRelativeTime(scan.scannedAt)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDuration(scan.duration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Issue Details */}
          {scans.some(s => s.issues.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">问题详情</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scans.filter(s => s.issues.length > 0).map(scan => (
                    <div key={scan.id}>
                      <h4 className="text-sm font-medium mb-2">{scan.resourceName}</h4>
                      <div className="space-y-2">
                        {scan.issues.map(issue => (
                          <div key={issue.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className={`mt-0.5 ${issue.severity === 'critical' || issue.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{issue.title}</span>
                                <Badge className={getRiskColor(issue.severity)} variant="outline">
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mt-1">{issue.description}</p>
                              {issue.location && (
                                <p className="text-xs text-slate-400 mt-1">位置: {issue.location}</p>
                              )}
                              {issue.fixAvailable && issue.fixSuggestion && (
                                <p className="text-xs text-green-600 mt-1">
                                  修复建议: {issue.fixSuggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">审批队列</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredApprovals.filter(a => a.status === 'pending').length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>暂无待审批的资源</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>资源</TableHead>
                      <TableHead>申请人</TableHead>
                      <TableHead>风险等级</TableHead>
                      <TableHead>申请理由</TableHead>
                      <TableHead>申请时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApprovals.filter(a => a.status === 'pending').map(request => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRiskIcon(request.riskLevel)}
                            <div>
                              <div className="font-medium">{request.resourceName}</div>
                              <div className="text-xs text-slate-500">{request.resourceType}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500">{request.requester}</TableCell>
                        <TableCell>
                          <Badge className={getRiskColor(request.riskLevel)}>
                            {request.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-slate-600">
                          {request.reason}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatRelativeTime(request.requestedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleApprovalAction(request, 'approve')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              批准
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleApprovalAction(request, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              拒绝
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policy Tab */}
        <TabsContent value="policy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">安全策略配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">启用安全策略</Label>
                  <p className="text-sm text-slate-500">开启后将强制执行所有安全检查</p>
                </div>
                <Switch
                  checked={policy.enabled}
                  onCheckedChange={(checked) => setPolicy(p => ({ ...p, enabled: checked }))}
                />
              </div>

              <div className="border-t pt-6">
                <h4 className="text-sm font-medium mb-4">验证设置</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>要求签名验证</Label>
                      <p className="text-sm text-slate-500">禁止安装没有有效签名的资源</p>
                    </div>
                    <Switch
                      checked={policy.requireSignature}
                      onCheckedChange={(checked) => setPolicy(p => ({ ...p, requireSignature: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>最低扫描级别</Label>
                      <p className="text-sm text-slate-500">资源必须通过此级别的安全扫描</p>
                    </div>
                    <div className="flex gap-2">
                      {(['basic', 'standard', 'deep'] as ScanLevel[]).map(level => (
                        <Button
                          key={level}
                          size="sm"
                          variant={policy.minScanLevel === level ? 'default' : 'outline'}
                          onClick={() => setPolicy(p => ({ ...p, minScanLevel: level }))}
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-sm font-medium mb-4">审批设置</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>低风险自动批准</Label>
                      <p className="text-sm text-slate-500">低风险资源自动批准安装</p>
                    </div>
                    <Switch
                      checked={policy.autoApproveLowRisk}
                      onCheckedChange={(checked) => setPolicy(p => ({ ...p, autoApproveLowRisk: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>高风险需管理员审批</Label>
                      <p className="text-sm text-slate-500">高风险和严重风险资源需要管理员审批</p>
                    </div>
                    <Switch
                      checked={policy.requireAdminApprovalHighRisk}
                      onCheckedChange={(checked) => setPolicy(p => ({ ...p, requireAdminApprovalHighRisk: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>最大风险等级</Label>
                      <p className="text-sm text-slate-500">超过此风险等级的资源将被阻止安装</p>
                    </div>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as SecurityRiskLevel[]).map(level => (
                        <Button
                          key={level}
                          size="sm"
                          variant={policy.maxRiskLevel === level ? 'default' : 'outline'}
                          onClick={() => setPolicy(p => ({ ...p, maxRiskLevel: level }))}
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">审计日志</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>操作人</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>资源</TableHead>
                    <TableHead>结果</TableHead>
                    <TableHead>详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audit.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-slate-500 text-sm">
                        {formatRelativeTime(entry.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">{entry.actor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{entry.resourceName}</TableCell>
                      <TableCell>
                        {entry.result === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-xs truncate">
                        {entry.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? '批准资源安装' : '拒绝资源安装'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve'
                ? '确定要批准此资源的安装请求吗？'
                : '确定要拒绝此资源的安装请求吗？该操作无法撤销。'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedResource && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium">{(selectedResource as unknown as ApprovalRequest).resourceName}</div>
                <div className="text-sm text-slate-500">
                  {(selectedResource as unknown as ApprovalRequest).resourceType}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>审批意见</Label>
              <Input
                placeholder={approvalAction === 'approve' ? '可选：添加审批备注...' : '必填：说明拒绝原因...'}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              取消
            </Button>
            <Button
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              onClick={confirmApproval}
              disabled={approvalAction === 'reject' && !reviewComment}
            >
              {approvalAction === 'approve' ? '确认批准' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
