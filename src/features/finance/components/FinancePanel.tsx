/**
 * 财务面板组件
 */

import { useEffect } from 'react'
import { Receipt, FileText, Wallet, TrendingUp, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinanceStore } from '../stores/financeStore'
import type { InvoiceStatus, LedgerStatus, LedgerType } from '../types/finance.types'

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  pending: 'bg-yellow-500',
  verified: 'bg-green-500',
  recorded: 'bg-blue-500',
}
const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending: '待审核',
  verified: '已验证',
  recorded: '已入账',
}
const LEDGER_STATUS_COLORS: Record<LedgerStatus, string> = {
  pending: 'bg-yellow-500',
  partial: 'bg-blue-500',
  completed: 'bg-green-500',
}
const LEDGER_TYPE_COLORS: Record<LedgerType, string> = {
  receivable: 'text-green-600',
  payable: 'text-red-600',
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
}

export function FinancePanel() {
  const {
    invoices,
    ledgerEntries,
    stats,
    filterType,
    isLoading,
    fetchInvoices,
    fetchLedger,
    fetchStats,
    setFilterType,
  } = useFinanceStore()

  useEffect(() => {
    fetchInvoices()
    fetchLedger(filterType)
    fetchStats()
  }, [fetchInvoices, fetchLedger, fetchStats, filterType])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">财务中心</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchInvoices()
            fetchLedger(filterType)
            fetchStats()
          }}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalReceivable)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">应收总额</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-500" />
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalPayable)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">应付总额</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-500" />
                <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              </div>
              <p className="text-xs text-muted-foreground">发票总数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-yellow-500" />
                <div className="text-2xl font-bold">{stats.pendingCount}</div>
              </div>
              <p className="text-xs text-muted-foreground">待处理</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">发票</TabsTrigger>
          <TabsTrigger value="ledger">台账</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : invoices.length === 0 ? (
            <EmptyState title="暂无发票" description="发票记录将在此处显示" icon={Receipt} />
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <Card key={inv.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{inv.number}</div>
                        <div className="text-sm text-muted-foreground">{inv.invoiceType}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(inv.amount)}</div>
                      <Badge
                        className={`${INVOICE_STATUS_COLORS[inv.status]} text-white border-0 mt-1`}
                      >
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ledger">
          <div className="mb-4">
            <Select
              value={filterType || 'all'}
              onValueChange={(v) => setFilterType(v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="台账类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="receivable">应收</SelectItem>
                <SelectItem value="payable">应付</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : ledgerEntries.length === 0 ? (
            <EmptyState title="暂无台账" description="账目记录将在此处显示" icon={Wallet} />
          ) : (
            <div className="space-y-2">
              {ledgerEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className={`h-5 w-5 ${LEDGER_TYPE_COLORS[entry.ledgerType]}`} />
                      <div>
                        <div className="font-medium">
                          {entry.ledgerType === 'receivable' ? '应收' : '应付'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          已付: {formatCurrency(entry.paidAmount)} / {formatCurrency(entry.amount)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(entry.amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        到期: {new Date(entry.dueDate * 1000).toLocaleDateString()}
                      </div>
                      <Badge
                        className={`${LEDGER_STATUS_COLORS[entry.status]} text-white border-0 mt-1`}
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
