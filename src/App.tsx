import { useState, useEffect } from 'react'
import { useAppStore } from './stores/appStore'

function App() {
  const { initialized, setInitialized } = useAppStore()
  const [loading, setLoading] = useState(true)

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
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">AI-Automated-office</h1>
        <div className="text-sm text-muted-foreground">
          {initialized ? '已就绪' : '未初始化'}
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold text-brand-800">
            欢迎使用 AI-Automated-office
          </h2>
          <p className="text-muted-foreground">
            AI 赋能的企业 ERP 系统
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
