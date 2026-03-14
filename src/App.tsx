import { useState, useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import { AppLayout } from './components/common'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { listen } from '@tauri-apps/api/event'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { Button } from './components/ui/button'

function App() {
  const { setInitialized } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [showTopBarHint, setShowTopBarHint] = useState(false)

  // 注册全局快捷键监听器
  useGlobalShortcuts()

  // 直接在 App 中监听 Tauri 事件进行测试
  useEffect(() => {
    console.log('[App] 开始设置 Tauri 事件监听...')
    
    const setupListeners = async () => {
      const unlisten1 = await listen('open-ai-chat', (event) => {
        console.log('[App] 收到 open-ai-chat 事件:', event)
      })
      
      const unlisten2 = await listen('open-quick-search', (event) => {
        console.log('[App] 收到 open-quick-search 事件:', event)
      })
      
      console.log('[App] Tauri 事件监听设置完成')
      
      return () => {
        unlisten1()
        unlisten2()
      }
    }
    
    const cleanup = setupListeners()
    
    return () => {
      cleanup.then(fn => fn())
    }
  }, [])

  useEffect(() => {
    // 初始化应用
    const initApp = async () => {
      try {
        // 这里可以添加应用初始化逻辑
        // 例如：检查用户登录状态、加载配置等
        await new Promise((resolve) => setTimeout(resolve, 500))
        setInitialized(true)
      } catch (error) {
        console.error('应用初始化失败:', error)
      } finally {
        setLoading(false)
      }
    }

    initApp()
  }, [setInitialized])

  useEffect(() => {
    const dismissed = localStorage.getItem('topbar-hint-dismissed')
    if (!dismissed) {
      setShowTopBarHint(true)
    }
  }, [])

  const handleDismissTopBarHint = () => {
    localStorage.setItem('topbar-hint-dismissed', 'true')
    setShowTopBarHint(false)
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">正在初始化...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {showTopBarHint && (
        <div className="fixed left-1/2 top-4 z-50 w-[520px] -translate-x-1/2">
          <Alert className="border-slate-200 bg-white shadow-lg">
            <AlertTitle className="text-slate-900">欢迎使用顶部菜单栏</AlertTitle>
            <AlertDescription className="mt-2 text-slate-600">
              <div>快捷键提示：Ctrl+Shift+M 切换菜单栏，Ctrl+B 切换左侧栏，Ctrl+Shift+I 切换 AI Chat Panel。</div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={handleDismissTopBarHint}>
                  知道了
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <AppLayout />
    </>
  )
}

export default App
