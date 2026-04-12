/**
 * System Commands Registration
 * 
 * Registers all built-in system commands for the Command Palette.
 * This module should be imported once at app startup.
 */

import { CommandRegistry } from './commandRegistry'
import { Plus, FolderOpen, Save, Copy, Clipboard, Search, PanelLeftClose, Eye, PanelRightClose, Terminal, RefreshCw, Download, Upload, Settings, User, Bell, Users, Shield, Info, HelpCircle, Bug } from 'lucide-react'

export interface SystemCommands {
  /** Initialize all system commands */
  init(): void
  /** Cleanup commands (for testing or hot reload) */
  cleanup(): void
}

function initSystemCommands() {
  const commands = [
    // File commands
    {
      id: 'file.new',
      label: '新建',
      description: '创建新文件或文档',
      icon: Plus,
      category: 'file' as const,
      shortcut: 'Ctrl+N',
      action: () => console.log('[Command] file.new'),
    },
    {
      id: 'file.open',
      label: '打开文件',
      description: '打开现有文件',
      icon: FolderOpen,
      category: 'file' as const,
      shortcut: 'Ctrl+O',
      action: () => console.log('[Command] file.open'),
    },
    {
      id: 'file.save',
      label: '保存',
      description: '保存当前文件',
      icon: Save,
      category: 'file' as const,
      shortcut: 'Ctrl+S',
      action: () => console.log('[Command] file.save'),
    },
    {
      id: 'file.saveAs',
      label: '另存为',
      description: '将当前文件另存为',
      icon: Save,
      category: 'file' as const,
      shortcut: 'Ctrl+Shift+S',
      action: () => console.log('[Command] file.saveAs'),
    },

    // Edit commands
    {
      id: 'edit.copy',
      label: '复制',
      description: '复制选中的内容',
      icon: Copy,
      category: 'edit' as const,
      shortcut: 'Ctrl+C',
      action: () => console.log('[Command] edit.copy'),
    },
    {
      id: 'edit.paste',
      label: '粘贴',
      description: '粘贴剪贴板内容',
      icon: Clipboard,
      category: 'edit' as const,
      shortcut: 'Ctrl+V',
      action: () => console.log('[Command] edit.paste'),
    },
    {
      id: 'edit.find',
      label: '查找',
      description: '在当前文件或项目中查找',
      icon: Search,
      category: 'edit' as const,
      shortcut: 'Ctrl+F',
      action: () => console.log('[Command] edit.find'),
    },
    {
      id: 'edit.replace',
      label: '替换',
      description: '查找并替换文本',
      icon: Search,
      category: 'edit' as const,
      shortcut: 'Ctrl+H',
      action: () => console.log('[Command] edit.replace'),
    },

    // View commands
    {
      id: 'view.toggleSidebar',
      label: '切换侧边栏',
      description: '显示或隐藏侧边栏',
      icon: PanelLeftClose,
      category: 'view' as const,
      shortcut: 'Ctrl+B',
      action: () => console.log('[Command] view.toggleSidebar'),
    },
    {
      id: 'view.toggleActivityBar',
      label: '切换活动栏',
      description: '显示或隐藏活动栏',
      icon: Eye,
      category: 'view' as const,
      action: () => console.log('[Command] view.toggleActivityBar'),
    },
    {
      id: 'view.toggleAiPanel',
      label: '切换AI面板',
      description: '显示或隐藏AI对话面板',
      icon: PanelRightClose,
      category: 'view' as const,
      shortcut: 'Ctrl+J',
      action: () => console.log('[Command] view.toggleAiPanel'),
    },
    {
      id: 'view.toggleBottomPanel',
      label: '切换底部面板',
      description: '显示或隐藏底部面板',
      icon: Terminal,
      category: 'view' as const,
      action: () => console.log('[Command] view.toggleBottomPanel'),
    },
    {
      id: 'view.zoomIn',
      label: '放大',
      description: '放大工作区视图',
      icon: Eye,
      category: 'view' as const,
      shortcut: 'Ctrl+=',
      action: () => console.log('[Command] view.zoomIn'),
    },
    {
      id: 'view.zoomOut',
      label: '缩小',
      description: '缩小工作区视图',
      icon: Eye,
      category: 'view' as const,
      shortcut: 'Ctrl+-',
      action: () => console.log('[Command] view.zoomOut'),
    },

    // Tool commands
    {
      id: 'tool.sync',
      label: '同步数据',
      description: '手动触发数据同步',
      icon: RefreshCw,
      category: 'tool' as const,
      action: () => console.log('[Command] tool.sync'),
    },
    {
      id: 'tool.export',
      label: '导出数据',
      description: '导出项目数据',
      icon: Download,
      category: 'tool' as const,
      action: () => console.log('[Command] tool.export'),
    },
    {
      id: 'tool.import',
      label: '导入数据',
      description: '导入外部数据',
      icon: Upload,
      category: 'tool' as const,
      action: () => console.log('[Command] tool.import'),
    },
    {
      id: 'tool.terminal',
      label: '打开终端',
      description: '打开集成终端',
      icon: Terminal,
      category: 'tool' as const,
      shortcut: 'Ctrl+`',
      action: () => console.log('[Command] tool.terminal'),
    },

    // Settings commands
    {
      id: 'settings.open',
      label: '打开设置',
      description: '打开应用设置',
      icon: Settings,
      category: 'settings' as const,
      shortcut: 'Ctrl+,',
      action: () => console.log('[Command] settings.open'),
    },
    {
      id: 'settings.account',
      label: '账户设置',
      description: '管理账户信息',
      icon: User,
      category: 'settings' as const,
      action: () => console.log('[Command] settings.account'),
    },
    {
      id: 'settings.notifications',
      label: '通知设置',
      description: '管理通知偏好',
      icon: Bell,
      category: 'settings' as const,
      action: () => console.log('[Command] settings.notifications'),
    },
    {
      id: 'settings.shortcuts',
      label: '快捷键',
      description: '查看和修改快捷键',
      icon: Terminal,
      category: 'settings' as const,
      action: () => console.log('[Command] settings.shortcuts'),
    },

    // Navigation commands
    {
      id: 'nav.homepage',
      label: '工作台',
      description: '返回工作台首页',
      icon: Eye,
      category: 'navigation' as const,
      shortcut: 'Ctrl+1',
      action: () => console.log('[Command] nav.homepage'),
    },
    {
      id: 'nav.hr',
      label: '人事管理',
      description: '跳转到人事管理模块',
      icon: Users,
      category: 'navigation' as const,
      action: () => console.log('[Command] nav.hr'),
    },
    {
      id: 'nav.finance',
      label: '财务管理',
      description: '跳转到财务管理模块',
      icon: Shield,
      category: 'navigation' as const,
      action: () => console.log('[Command] nav.finance'),
    },
    {
      id: 'nav.warehouse',
      label: '仓储管理',
      description: '跳转到仓储管理模块',
      icon: Download,
      category: 'navigation' as const,
      action: () => console.log('[Command] nav.warehouse'),
    },
    {
      id: 'nav.sales',
      label: '销售管理',
      description: '跳转到销售管理模块',
      icon: Shield,
      category: 'navigation' as const,
      action: () => console.log('[Command] nav.sales'),
    },
    {
      id: 'nav.admin',
      label: '管理层',
      description: '跳转到管理层视图',
      icon: Shield,
      category: 'navigation' as const,
      action: () => console.log('[Command] nav.admin'),
    },
    {
      id: 'nav.aiChat',
      label: 'AI 对话',
      description: '打开 AI 对话面板',
      icon: Terminal,
      category: 'navigation' as const,
      shortcut: 'Ctrl+Shift+A',
      action: () => console.log('[Command] nav.aiChat'),
    },

    // Help commands
    {
      id: 'help.about',
      label: '关于',
      description: '查看应用信息',
      icon: Info,
      category: 'tool' as const,
      action: () => console.log('[Command] help.about'),
    },
    {
      id: 'help.documentation',
      label: '帮助文档',
      description: '打开帮助文档',
      icon: HelpCircle,
      category: 'tool' as const,
      action: () => console.log('[Command] help.documentation'),
    },
    {
      id: 'help.feedback',
      label: '反馈问题',
      description: '报告问题或提供反馈',
      icon: Bug,
      category: 'tool' as const,
      action: () => console.log('[Command] help.feedback'),
    },
    {
      id: 'help.checkUpdate',
      label: '检查更新',
      description: '检查应用更新',
      icon: RefreshCw,
      category: 'tool' as const,
      action: () => console.log('[Command] help.checkUpdate'),
    },
  ]

  CommandRegistry.registerMany(commands)
}

export const systemCommands: SystemCommands = {
  init: initSystemCommands,
  cleanup: () => CommandRegistry.clear(),
}
