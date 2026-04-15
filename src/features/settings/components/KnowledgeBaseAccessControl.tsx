import { useState, useMemo } from 'react'
import {
  Shield,
  Users,
  Building,
  User,
  Lock,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Settings,
  Search,
  Filter,
  FolderOpen,
  BookOpen,
  Clock,
  Save,
  RotateCcw,
  Globe,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
export type RoleType = 'admin' | 'manager' | 'member' | 'guest'
export type AccessLevel = 'none' | 'read' | 'write' | 'admin'
export type ScopeType = 'public' | 'department' | 'team' | 'private'

export interface RolePermission {
  role: RoleType
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canAdmin: boolean
  canExport: boolean
}

export interface DepartmentAccess {
  departmentId: string
  departmentName: string
  accessLevel: AccessLevel
  grantedAt: string
  grantedBy: string
}

export interface UserAccess {
  userId: string
  userName: string
  email: string
  role: RoleType
  accessLevel: AccessLevel
  grantedAt: string
}

export interface KnowledgeBaseACL {
  id: string
  knowledgeBaseId: string
  knowledgeBaseName: string
  scopeType: ScopeType
  ownerId: string
  ownerName: string
  isPublic: boolean
  defaultAccess: AccessLevel
  rolePermissions: RolePermission[]
  departmentAccess: DepartmentAccess[]
  userAccess: UserAccess[]
  createdAt: string
  updatedAt: string
}

export interface AccessControlStats {
  totalBases: number
  publicBases: number
  restrictedBases: number
  totalUsers: number
  totalDepartments: number
  pendingRequests: number
}

export interface KnowledgeBaseAccessControlProps {
  className?: string
}

// Role labels
const ROLE_LABELS: Record<RoleType, string> = {
  admin: '管理员',
  manager: '经理',
  member: '成员',
  guest: '访客',
}

// Access level labels
const ACCESS_LABELS: Record<AccessLevel, string> = {
  none: '无权限',
  read: '只读',
  write: '读写',
  admin: '完全控制',
}

// Default role permissions
const DEFAULT_ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: 'admin',
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canAdmin: true,
    canExport: true,
  },
  {
    role: 'manager',
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canAdmin: false,
    canExport: true,
  },
  {
    role: 'member',
    canView: true,
    canCreate: true,
    canEdit: false,
    canDelete: false,
    canAdmin: false,
    canExport: false,
  },
  {
    role: 'guest',
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAdmin: false,
    canExport: false,
  },
]

// Mock knowledge bases with ACL
const MOCK_KB_ACL: KnowledgeBaseACL[] = [
  {
    id: 'acl-001',
    knowledgeBaseId: 'kb-001',
    knowledgeBaseName: '员工手册',
    scopeType: 'public',
    ownerId: 'user-001',
    ownerName: '张三',
    isPublic: true,
    defaultAccess: 'read',
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    departmentAccess: [],
    userAccess: [],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-20T14:00:00Z',
  },
  {
    id: 'acl-002',
    knowledgeBaseId: 'kb-002',
    knowledgeBaseName: '财务制度',
    scopeType: 'department',
    ownerId: 'user-002',
    ownerName: '李四',
    isPublic: false,
    defaultAccess: 'none',
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    departmentAccess: [
      {
        departmentId: 'dept-001',
        departmentName: '财务部',
        accessLevel: 'write',
        grantedAt: '2026-03-01T10:00:00Z',
        grantedBy: '李四',
      },
      {
        departmentId: 'dept-002',
        departmentName: '管理层',
        accessLevel: 'read',
        grantedAt: '2026-03-01T10:00:00Z',
        grantedBy: '李四',
      },
    ],
    userAccess: [],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z',
  },
  {
    id: 'acl-003',
    knowledgeBaseId: 'kb-003',
    knowledgeBaseName: '产品文档',
    scopeType: 'team',
    ownerId: 'user-003',
    ownerName: '王五',
    isPublic: false,
    defaultAccess: 'none',
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    departmentAccess: [
      {
        departmentId: 'dept-003',
        departmentName: '研发部',
        accessLevel: 'write',
        grantedAt: '2026-03-05T10:00:00Z',
        grantedBy: '王五',
      },
    ],
    userAccess: [
      {
        userId: 'user-010',
        userName: '赵六',
        email: 'zhaoliu@company.com',
        role: 'manager',
        accessLevel: 'write',
        grantedAt: '2026-03-05T10:00:00Z',
      },
    ],
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-03-18T09:00:00Z',
  },
  {
    id: 'acl-004',
    knowledgeBaseId: 'kb-004',
    knowledgeBaseName: '销售机密',
    scopeType: 'private',
    ownerId: 'user-004',
    ownerName: '孙七',
    isPublic: false,
    defaultAccess: 'none',
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    departmentAccess: [],
    userAccess: [
      {
        userId: 'user-005',
        userName: '周八',
        email: 'zhouba@company.com',
        role: 'admin',
        accessLevel: 'admin',
        grantedAt: '2026-03-10T10:00:00Z',
      },
    ],
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-20T16:00:00Z',
  },
]

// Format time ago
const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

// Get scope icon
const getScopeIcon = (scope: ScopeType) => {
  switch (scope) {
    case 'public':
      return <Globe className="h-4 w-4 text-green-500" />
    case 'department':
      return <Building className="h-4 w-4 text-blue-500" />
    case 'team':
      return <Users className="h-4 w-4 text-purple-500" />
    case 'private':
      return <Lock className="h-4 w-4 text-red-500" />
  }
}

// Get scope label
const getScopeLabel = (scope: ScopeType) => {
  switch (scope) {
    case 'public':
      return '公开'
    case 'department':
      return '部门'
    case 'team':
      return '团队'
    case 'private':
      return '私有'
  }
}

export function KnowledgeBaseAccessControl({ className = '' }: KnowledgeBaseAccessControlProps) {
  const [acls] = useState<KnowledgeBaseACL[]>(MOCK_KB_ACL)
  const [selectedACL, setSelectedACL] = useState<KnowledgeBaseACL | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState<ScopeType | 'all'>('all')

  // Stats
  const stats = useMemo((): AccessControlStats => {
    const total = acls.length
    const publicCount = acls.filter((a) => a.isPublic).length
    const restricted = total - publicCount
    const totalUsers = new Set(acls.flatMap((a) => a.userAccess.map((u) => u.userId))).size
    const totalDepts = new Set(acls.flatMap((a) => a.departmentAccess.map((d) => d.departmentId)))
      .size
    return {
      totalBases: total,
      publicBases: publicCount,
      restrictedBases: restricted,
      totalUsers,
      totalDepartments: totalDepts,
      pendingRequests: 3,
    }
  }, [acls])

  // Filtered ACLs
  const filteredACLs = useMemo(() => {
    return acls.filter((acl) => {
      if (searchQuery && !acl.knowledgeBaseName.toLowerCase().includes(searchQuery.toLowerCase()))
        return false
      if (scopeFilter !== 'all' && acl.scopeType !== scopeFilter) return false
      return true
    })
  }, [acls, searchQuery, scopeFilter])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            知识库权限控制
          </h2>
          <p className="text-muted-foreground">配置知识库的访问范围、角色权限和部门/用户访问控制</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-1" />
          批量配置
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalBases}</div>
                <div className="text-xs text-muted-foreground">知识库</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.publicBases}</div>
                <div className="text-xs text-muted-foreground">公开</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.restrictedBases}</div>
                <div className="text-xs text-muted-foreground">受限</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <div className="text-xs text-muted-foreground">授权用户</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalDepartments}</div>
                <div className="text-xs text-muted-foreground">授权部门</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</div>
                <div className="text-xs text-muted-foreground">待审批</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索知识库..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="border rounded px-2 py-1 text-sm"
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value as ScopeType | 'all')}
              >
                <option value="all">全部范围</option>
                <option value="public">公开</option>
                <option value="department">部门</option>
                <option value="team">团队</option>
                <option value="private">私有</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="bases">
        <TabsList className="mb-4">
          <TabsTrigger value="bases">知识库列表</TabsTrigger>
          <TabsTrigger value="roles">角色权限</TabsTrigger>
          <TabsTrigger value="requests">访问请求</TabsTrigger>
        </TabsList>

        {/* Knowledge Base List */}
        <TabsContent value="bases">
          {filteredACLs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <EmptyState title="暂无知识库" description="点击上方按钮添加知识库" icon={Shield} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredACLs.map((acl) => (
                <Card
                  key={acl.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedACL?.id === acl.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedACL(acl)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{acl.knowledgeBaseName}</span>
                      </div>
                      {getScopeIcon(acl.scopeType)}
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getScopeLabel(acl.scopeType)}
                        </Badge>
                        {acl.isPublic ? (
                          <Badge variant="default" className="text-xs bg-green-500">
                            公开访问
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            受限访问
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        所有者: {acl.ownerName} | 更新于 {formatTimeAgo(acl.updatedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {acl.departmentAccess.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {acl.departmentAccess.length} 个部门
                        </span>
                      )}
                      {acl.userAccess.length > 0 && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {acl.userAccess.length} 个用户
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Role Permissions */}
        <TabsContent value="roles">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                角色权限矩阵
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">角色</th>
                      <th className="text-center py-2 px-3 font-medium">查看</th>
                      <th className="text-center py-2 px-3 font-medium">创建</th>
                      <th className="text-center py-2 px-3 font-medium">编辑</th>
                      <th className="text-center py-2 px-3 font-medium">删除</th>
                      <th className="text-center py-2 px-3 font-medium">管理</th>
                      <th className="text-center py-2 px-3 font-medium">导出</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEFAULT_ROLE_PERMISSIONS.map((perm) => (
                      <tr key={perm.role} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">
                          <Badge variant="secondary">{ROLE_LABELS[perm.role]}</Badge>
                        </td>
                        <td className="text-center py-2 px-3">
                          {perm.canView ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-2 px-3">
                          {perm.canCreate ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-2 px-3">
                          {perm.canEdit ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-2 px-3">
                          {perm.canDelete ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-2 px-3">
                          {perm.canAdmin ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-2 px-3">
                          {perm.canExport ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Requests */}
        <TabsContent value="requests">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                待审批的访问请求
              </h3>
              <div className="space-y-3">
                {[
                  {
                    user: '陈九',
                    email: 'chenjiu@company.com',
                    kb: '财务制度',
                    dept: '销售部',
                    time: '10分钟前',
                  },
                  {
                    user: '刘十',
                    email: 'liushi@company.com',
                    kb: '产品文档',
                    dept: '市场部',
                    time: '30分钟前',
                  },
                  {
                    user: '吴十一',
                    email: 'wushiyi@company.com',
                    kb: '销售机密',
                    dept: '研发部',
                    time: '1小时前',
                  },
                ].map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="font-medium">{req.user}</div>
                        <div className="text-xs text-muted-foreground">{req.email}</div>
                        <div className="text-xs text-muted-foreground">
                          申请访问 <span className="font-medium">{req.kb}</span> - {req.dept}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{req.time}</span>
                      <Button size="sm" variant="outline">
                        <XCircle className="h-4 w-4 mr-1" />
                        拒绝
                      </Button>
                      <Button size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        批准
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ACL Detail Panel */}
      {selectedACL && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                访问控制详情
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedACL(null)}>
                关闭
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">基本信息</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">知识库</span>
                      <span className="font-medium">{selectedACL.knowledgeBaseName}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">访问范围</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getScopeIcon(selectedACL.scopeType)}
                        {getScopeLabel(selectedACL.scopeType)}
                      </Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">默认权限</span>
                      <span>{ACCESS_LABELS[selectedACL.defaultAccess]}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">所有者</span>
                      <span>{selectedACL.ownerName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">部门访问</div>
                  {selectedACL.departmentAccess.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                      暂无部门访问权限
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedACL.departmentAccess.map((dept) => (
                        <div
                          key={dept.departmentId}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{dept.departmentName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {ACCESS_LABELS[dept.accessLevel]}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    添加部门
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">用户访问</div>
                  {selectedACL.userAccess.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                      暂无用户访问权限
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedACL.userAccess.map((user) => (
                        <div
                          key={user.userId}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{user.userName}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {ROLE_LABELS[user.role]}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="mt-2">
                    <UserPlus className="h-4 w-4 mr-1" />
                    添加用户
                  </Button>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">
                    <Save className="h-4 w-4 mr-1" />
                    保存更改
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-1" />
                    重置
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
