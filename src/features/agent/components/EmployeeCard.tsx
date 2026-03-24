/**
 * Employee Card - Story 11.2
 * 员工名片查看 - 用户和参与者身份详情界面
 *
 * 功能：
 * - 显示员工资料和角色详情
 * - 显示可用的联系和协作操作
 * - 遵守敏感字段的可见性边界
 *
 * 铁律合规：
 * - FR601, FR602
 * - NFR16
 * - ADR-037
 * - UX-01, UX-02
 */

import { useState } from 'react'
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  MessageSquare,
  Video,
  PhoneCall,
  MoreHorizontal,
  Edit,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  QrCode,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

// Types
export type EmployeeStatus = 'online' | 'offline' | 'busy' | 'away'

export type ParticipantType = 'human' | 'agent' | 'system' | 'group'

export interface EmployeeProfile {
  id: string
  name: string
  avatar?: string
  department: string
  position: string
  email: string
  phone?: string
  status: EmployeeStatus
  participantType: ParticipantType
  joinDate?: string
  bio?: string
  skills?: string[]
  isFavorite?: boolean
  lastSeen?: string
  isCurrentUser?: boolean
}

export interface ContactAction {
  id: string
  type: 'message' | 'video' | 'phone' | 'email'
  label: string
  available: boolean
  disabledReason?: string
}

export interface VisibilitySettings {
  showPhone: boolean
  showEmail: boolean
  showDepartment: boolean
  showSkills: boolean
  showBio: boolean
}

export interface EmployeeCardProps {
  employee: EmployeeProfile
  currentUserId?: string
  visibilitySettings?: VisibilitySettings
  onMessage?: (employeeId: string) => void
  onVideoCall?: (employeeId: string) => void
  onPhoneCall?: (employeeId: string) => void
  onEmail?: (employeeId: string) => void
  onToggleFavorite?: (employeeId: string) => void
  onEditProfile?: (employeeId: string) => void
  onViewQRCode?: (employeeId: string) => void
}

// Mock current user ID
const CURRENT_USER_ID = 'current-user'

// Status color and text
function getStatusColor(status: EmployeeStatus): string {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'busy':
      return 'bg-red-500'
    case 'away':
      return 'bg-yellow-500'
    case 'offline':
      return 'bg-gray-400'
    default:
      return 'bg-gray-400'
  }
}

function getStatusText(status: EmployeeStatus): string {
  switch (status) {
    case 'online':
      return '在线'
    case 'busy':
      return '忙碌'
    case 'away':
      return '离开'
    case 'offline':
      return '离线'
    default:
      return '未知'
  }
}

function getParticipantTypeText(type: ParticipantType): string {
  switch (type) {
    case 'human':
      return '人员'
    case 'agent':
      return 'Agent'
    case 'system':
      return '系统'
    case 'group':
      return '群组'
    default:
      return '未知'
  }
}

function getParticipantTypeBadgeColor(type: ParticipantType): string {
  switch (type) {
    case 'human':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'agent':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'system':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'group':
      return 'bg-green-100 text-green-700 border-green-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

// Get available contact actions
function getContactActions(
  employee: EmployeeProfile,
  isOwnProfile: boolean
): ContactAction[] {
  const actions: ContactAction[] = [
    {
      id: 'message',
      type: 'message',
      label: '发送消息',
      available: !isOwnProfile && employee.status !== 'offline',
      disabledReason: isOwnProfile ? '无法给自己发消息' : '当前不在线',
    },
    {
      id: 'video',
      type: 'video',
      label: '视频通话',
      available: !isOwnProfile && employee.status === 'online',
      disabledReason: isOwnProfile ? '无法给自己发起视频' : '对方不在线',
    },
    {
      id: 'phone',
      type: 'phone',
      label: '语音通话',
      available: !isOwnProfile && !!employee.phone && employee.status !== 'offline',
      disabledReason: !employee.phone ? '对方未设置电话' : isOwnProfile ? '无法给自己打电话' : '当前不在线',
    },
    {
      id: 'email',
      type: 'email',
      label: '发送邮件',
      available: !isOwnProfile && !!employee.email,
      disabledReason: isOwnProfile ? '无法给自己发邮件' : '对方未设置邮箱',
    },
  ]
  return actions
}

// Default visibility settings
const DEFAULT_VISIBILITY: VisibilitySettings = {
  showPhone: true,
  showEmail: true,
  showDepartment: true,
  showSkills: true,
  showBio: true,
}

/**
 * Employee Card Component
 */
export function EmployeeCard({
  employee,
  currentUserId = CURRENT_USER_ID,
  visibilitySettings,
  onMessage,
  onVideoCall,
  onPhoneCall,
  onEmail,
  onToggleFavorite,
  onEditProfile,
  onViewQRCode,
}: EmployeeCardProps) {
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const isOwnProfile = employee.id === currentUserId || employee.isCurrentUser === true
  const settings = visibilitySettings || DEFAULT_VISIBILITY
  const actions = getContactActions(employee, isOwnProfile)

  // Format last seen time
  const formatLastSeen = (lastSeen?: string): string => {
    if (!lastSeen) return ''
    const date = new Date(lastSeen)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    return `${days} 天前`
  }

  // Handle action click
  const handleAction = (action: ContactAction) => {
    if (!action.available) return
    switch (action.type) {
      case 'message':
        onMessage?.(employee.id)
        break
      case 'video':
        onVideoCall?.(employee.id)
        break
      case 'phone':
        onPhoneCall?.(employee.id)
        break
      case 'email':
        onEmail?.(employee.id)
        break
    }
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar with status */}
              <div className="relative">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={employee.avatar} />
                  <AvatarFallback className="text-lg">
                    {employee.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${getStatusColor(
                    employee.status
                  )}`}
                />
              </div>

              {/* Basic info */}
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{employee.name}</CardTitle>
                  {employee.isFavorite && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
                <p className="text-sm text-slate-500">{employee.position}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getParticipantTypeBadgeColor(employee.participantType)}`}
                  >
                    {getParticipantTypeText(employee.participantType)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(employee.status)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* More actions */}
            <div className="flex items-center gap-1">
              {onToggleFavorite && !isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(employee.id)}
                >
                  <Star
                    className={`h-4 w-4 ${
                      employee.isFavorite
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-400'
                    }`}
                  />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowDetailDialog(true)}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick contact actions */}
          <div className="flex items-center gap-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.available ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                disabled={!action.available}
                title={action.disabledReason}
                onClick={() => handleAction(action)}
              >
                {action.type === 'message' && <MessageSquare className="h-4 w-4 mr-1" />}
                {action.type === 'video' && <Video className="h-4 w-4 mr-1" />}
                {action.type === 'phone' && <PhoneCall className="h-4 w-4 mr-1" />}
                {action.type === 'email' && <Mail className="h-4 w-4 mr-1" />}
                {action.label}
              </Button>
            ))}
          </div>

          <Separator />

          {/* Basic info section */}
          <div className="space-y-2">
            {settings.showDepartment && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">部门：</span>
                <span className="text-slate-800">{employee.department}</span>
              </div>
            )}

            {settings.showEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">邮箱：</span>
                <span className="text-slate-800 truncate">{employee.email}</span>
              </div>
            )}

            {settings.showPhone && employee.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">电话：</span>
                <span className="text-slate-800">{employee.phone}</span>
              </div>
            )}

            {employee.lastSeen && !isOwnProfile && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">最后活动：</span>
                <span className="text-slate-800">
                  {employee.status === 'offline' ? formatLastSeen(employee.lastSeen) : '现在'}
                </span>
              </div>
            )}
          </div>

          {/* Expandable section */}
          {isExpanded && (
            <div className="space-y-3 pt-2">
              <Separator />

              {settings.showBio && employee.bio && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-1">个人简介</h4>
                  <p className="text-sm text-slate-600">{employee.bio}</p>
                </div>
              )}

              {settings.showSkills && employee.skills && employee.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">技能标签</h4>
                  <div className="flex flex-wrap gap-1">
                    {employee.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {employee.joinDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">入职时间：</span>
                  <span className="text-slate-800">{employee.joinDate}</span>
                </div>
              )}

              {isOwnProfile && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">成员类型：</span>
                  <span className="text-slate-800">
                    {getParticipantTypeText(employee.participantType)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Expand/collapse button */}
          {(settings.showBio || settings.showSkills || employee.joinDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  收起详情
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  查看更多
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={employee.avatar} />
                <AvatarFallback className="text-xl">
                  {employee.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">{employee.name}</DialogTitle>
                <DialogDescription className="text-base">
                  {employee.position}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={`${getParticipantTypeBadgeColor(employee.participantType)}`}
                  >
                    {getParticipantTypeText(employee.participantType)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(employee.status)} text-white border-0`}
                  >
                    {getStatusText(employee.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">
                基本信息
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex-1">
                联系操作
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger value="privacy" className="flex-1">
                  隐私设置
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">部门</p>
                  <p className="text-sm font-medium">{employee.department}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">职位</p>
                  <p className="text-sm font-medium">{employee.position}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">邮箱</p>
                  <p className="text-sm font-medium">{employee.email}</p>
                </div>
                {employee.phone && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">电话</p>
                    <p className="text-sm font-medium">{employee.phone}</p>
                  </div>
                )}
                {employee.joinDate && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">入职时间</p>
                    <p className="text-sm font-medium">{employee.joinDate}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">成员ID</p>
                  <p className="text-sm font-medium text-slate-600">{employee.id}</p>
                </div>
              </div>

              {employee.bio && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">个人简介</p>
                  <p className="text-sm">{employee.bio}</p>
                </div>
              )}

              {employee.skills && employee.skills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">技能标签</p>
                  <div className="flex flex-wrap gap-1">
                    {employee.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.available ? 'default' : 'outline'}
                    className="h-20 flex-col gap-2"
                    disabled={!action.available}
                    title={action.disabledReason}
                    onClick={() => handleAction(action)}
                  >
                    {action.type === 'message' && (
                      <MessageSquare className="h-6 w-6" />
                    )}
                    {action.type === 'video' && <Video className="h-6 w-6" />}
                    {action.type === 'phone' && <PhoneCall className="h-6 w-6" />}
                    {action.type === 'email' && <Mail className="h-6 w-6" />}
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                {onViewQRCode && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onViewQRCode(employee.id)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    查看二维码
                  </Button>
                )}
                {isOwnProfile && onEditProfile && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onEditProfile(employee.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    编辑资料
                  </Button>
                )}
              </div>
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="privacy" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-phone">显示电话</Label>
                      <p className="text-xs text-slate-500">其他人可以看到您的电话号码</p>
                    </div>
                    <Switch id="show-phone" defaultChecked={settings.showPhone} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-email">显示邮箱</Label>
                      <p className="text-xs text-slate-500">其他人可以看到您的邮箱地址</p>
                    </div>
                    <Switch id="show-email" defaultChecked={settings.showEmail} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-department">显示部门</Label>
                      <p className="text-xs text-slate-500">其他人可以看到您所属的部门</p>
                    </div>
                    <Switch id="show-department" defaultChecked={settings.showDepartment} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-skills">显示技能</Label>
                      <p className="text-xs text-slate-500">其他人可以看到您的技能标签</p>
                    </div>
                    <Switch id="show-skills" defaultChecked={settings.showSkills} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-bio">显示简介</Label>
                      <p className="text-xs text-slate-500">其他人可以看到您的个人简介</p>
                    </div>
                    <Switch id="show-bio" defaultChecked={settings.showBio} />
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
            {!isOwnProfile && (
              <Button onClick={() => onMessage?.(employee.id)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                发消息
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Export sub-components for flexibility
export { EmployeeCard as default }
