/**
 * Notification Settings Component
 * 通知设置页面
 */

import { useState } from 'react'
import { Bell, Mail, MessageSquare, Smartphone, Clock, Moon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useNotificationPreferences } from '../hooks/useMessage'
import type { DoNotDisturb, NotificationChannels, NotificationTypes } from '../types/message.types'

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences()
  const [saving, setSaving] = useState(false)

  const [channels, setChannels] = useState<NotificationChannels>({
    inApp: preferences?.channels?.inApp ?? true,
    email: preferences?.channels?.email ?? false,
    push: preferences?.channels?.push ?? false,
  })

  const [types, setTypes] = useState<NotificationTypes>({
    system: preferences?.types?.system ?? true,
    approval: preferences?.types?.approval ?? true,
    task: preferences?.types?.task ?? true,
    mention: preferences?.types?.mention ?? true,
    chat: preferences?.types?.chat ?? true,
  })

  const [dnd, setDnd] = useState<DoNotDisturb>({
    enabled: preferences?.doNotDisturb?.enabled ?? false,
    startTime: preferences?.doNotDisturb?.startTime ?? '22:00',
    endTime: preferences?.doNotDisturb?.endTime ?? '08:00',
    days: preferences?.doNotDisturb?.days ?? [0, 1, 2, 3, 4, 5, 6],
  })

  const handleChannelChange = async (key: keyof NotificationChannels, value: boolean) => {
    const updated = { ...channels, [key]: value }
    setChannels(updated)
    await savePreferences(updated, types, dnd)
  }

  const handleTypeChange = async (key: keyof NotificationTypes, value: boolean) => {
    const updated = { ...types, [key]: value }
    setTypes(updated)
    await savePreferences(channels, updated, dnd)
  }

  const handleDndChange = async (key: keyof DoNotDisturb, value: string | boolean | number[] | undefined) => {
    const updated = { ...dnd, [key]: value }
    setDnd(updated)
    await savePreferences(channels, types, updated)
  }

  const savePreferences = async (
    newChannels: NotificationChannels,
    newTypes: NotificationTypes,
    newDnd: DoNotDisturb
  ) => {
    setSaving(true)
    try {
      await updatePreferences({
        userId: preferences?.userId || '',
        channels: newChannels,
        types: newTypes,
        doNotDisturb: newDnd,
      })
    } finally {
      setSaving(false)
    }
  }

  const channelItems: { key: keyof NotificationChannels; label: string; icon: React.ReactNode; description: string }[] = [
    {
      key: 'inApp',
      label: '应用内通知',
      icon: <Bell className="h-5 w-5" />,
      description: '在应用内显示通知提醒',
    },
    {
      key: 'email',
      label: '邮件通知',
      icon: <Mail className="h-5 w-5" />,
      description: '发送邮件到您的邮箱',
    },
    {
      key: 'push',
      label: '推送通知',
      icon: <Smartphone className="h-5 w-5" />,
      description: '发送移动端推送通知',
    },
  ]

  const typeItems: { key: keyof NotificationTypes; label: string; description: string }[] = [
    { key: 'system', label: '系统通知', description: '系统公告、更新提示等' },
    { key: 'approval', label: '审批通知', description: '审批申请、审批结果等' },
    { key: 'task', label: '任务通知', description: '任务分配、任务提醒等' },
    { key: 'mention', label: '提及通知', description: '被@提及、评论等' },
    { key: 'chat', label: '聊天消息', description: '私信、群聊消息等' },
  ]

  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  if (isLoading) {
    return <div className={cn('p-4', className)}>加载中...</div>
  }

  return (
    <div className={cn('space-y-6 p-4 max-w-2xl mx-auto', className)}>
      {/* Channel Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            通知渠道
          </CardTitle>
          <CardDescription>选择您希望接收通知的方式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channelItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">{item.icon}</div>
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              </div>
              <Switch
                checked={channels[item.key]}
                onCheckedChange={(checked) => handleChannelChange(item.key, checked)}
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Type Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知类型
          </CardTitle>
          <CardDescription>选择您希望接收的通知类型</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {typeItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-muted-foreground">{item.description}</div>
              </div>
              <Switch
                checked={types[item.key]}
                onCheckedChange={(checked) => handleTypeChange(item.key, checked)}
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Do Not Disturb Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            免打扰模式
          </CardTitle>
          <CardDescription>在指定时间段内暂停所有通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">开启免打扰</div>
              <div className="text-sm text-muted-foreground">暂停所有渠道的通知</div>
            </div>
            <Switch
              checked={dnd.enabled}
              onCheckedChange={(checked) => handleDndChange('enabled', checked)}
              disabled={saving}
            />
          </div>

          {dnd.enabled && (
            <>
              <Separator />

              {/* Time Range */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">时间段</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={dnd.startTime || '22:00'}
                    onChange={(e) => handleDndChange('startTime', e.target.value)}
                    className="border rounded px-2 py-1"
                    disabled={saving}
                  />
                  <span className="text-muted-foreground">至</span>
                  <input
                    type="time"
                    value={dnd.endTime || '08:00'}
                    onChange={(e) => handleDndChange('endTime', e.target.value)}
                    className="border rounded px-2 py-1"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Days */}
              <div className="space-y-2">
                <span className="font-medium">适用日期</span>
                <div className="flex flex-wrap gap-2">
                  {dayNames.map((day, index) => (
                    <Button
                      key={day}
                      variant={dnd.days?.includes(index) ? 'default' : 'outline'}
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        const newDays = dnd.days?.includes(index)
                          ? dnd.days.filter((d) => d !== index)
                          : [...(dnd.days || []), index]
                        handleDndChange('days', newDays)
                      }}
                      disabled={saving}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
