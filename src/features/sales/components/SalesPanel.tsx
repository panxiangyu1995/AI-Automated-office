/**
 * 客户列表组件
 */

import { useEffect } from 'react'
import { Users, FileText, Handshake, TrendingUp, Loader2, RefreshCw, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSalesStore } from '../stores/salesStore'
import type { CustomerLevel, QuoteStatus, ContractStatus } from '../types/sales.types'

const LEVEL_COLORS: Record<CustomerLevel, string> = { A: 'bg-red-500', B: 'bg-yellow-500', C: 'bg-gray-400' }
const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = { draft: 'bg-gray-400', sent: 'bg-blue-500', accepted: 'bg-green-500', rejected: 'bg-red-500' }
const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = { draft: 'bg-gray-400', signed: 'bg-blue-500', executing: 'bg-yellow-500', completed: 'bg-green-500' }

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
}

export function SalesPanel() {
  const { customers, quotes, contracts, stats, isLoading, fetchCustomers, fetchQuotes, fetchContracts, fetchStats } = useSalesStore()

  useEffect(() => {
    fetchCustomers()
    fetchQuotes()
    fetchContracts()
    fetchStats()
  }, [fetchCustomers, fetchQuotes, fetchContracts, fetchStats])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">销售中心</h2>
        <Button variant="outline" size="sm" onClick={() => { fetchCustomers(); fetchQuotes(); fetchContracts(); fetchStats() }}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              </div>
              <p className="text-xs text-muted-foreground">客户总数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                <div className="text-2xl font-bold">{stats.totalQuotes}</div>
              </div>
              <p className="text-xs text-muted-foreground">报价单</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-purple-500" />
                <div className="text-2xl font-bold">{stats.totalContracts}</div>
              </div>
              <p className="text-xs text-muted-foreground">合同</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              </div>
              <p className="text-xs text-muted-foreground">合同总额</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">客户</TabsTrigger>
          <TabsTrigger value="quotes">报价单</TabsTrigger>
          <TabsTrigger value="contracts">合同</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {customers.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {c.customerType === 'corporate' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted-foreground">{c.phone} | {c.email}</div>
                      </div>
                    </div>
                    <Badge className={`${LEVEL_COLORS[c.level]} text-white border-0`}>{c.level}级</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quotes">
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {quotes.map((q) => (
                <Card key={q.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{q.number}</div>
                      <div className="text-sm text-muted-foreground">{q.customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(q.totalAmount)}</div>
                      <Badge className={`${QUOTE_STATUS_COLORS[q.status]} text-white border-0 mt-1`}>{q.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contracts">
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {contracts.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.number}</div>
                      <div className="text-sm text-muted-foreground">{c.customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(c.totalAmount)}</div>
                      <Badge className={`${CONTRACT_STATUS_COLORS[c.status]} text-white border-0 mt-1`}>{c.status}</Badge>
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
