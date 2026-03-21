import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { listen } from '@tauri-apps/api/event'
import { useAppStore } from './stores/appStore'
import { useAuthStore } from './stores/authStore'
import { usePermissionStore } from './stores/permissionStore'
import { AppLayout, OfflineIndicator } from './components/common'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useUpdate } from './hooks/useUpdate'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { Button } from './components/ui/button'
import { LoginPage } from './features/auth/pages/LoginPage'
import { AuthGuard } from './components/common/AuthGuard'
import { UpdateDialog } from './components/common/UpdateDialog'
import { UserListPage, UserCreatePage, UserEditPage, OrganizationPage } from './features/admin/pages'
import { PermissionCenter, FineGrainedPermissionPage } from './features/permission'
import { ForbiddenPage, ForbiddenModal } from './components/permission'
import { Toaster } from './components/ui/toaster'
import { setForbiddenHandler } from './lib/api/interceptors'

function App() {
  const { setInitialized } = useAppStore()
  const { restoreSession } = useAuthStore()
  const showForbidden = usePermissionStore((state) => state.showForbidden)
  const hideForbidden = usePermissionStore((state) => state.hideForbidden)
  const forbiddenModal = usePermissionStore((state) => state.forbiddenModal)
  const [loading, setLoading] = useState(true)
  const [showTopBarHint, setShowTopBarHint] = useState(false)
  const { updateInfo, downloading, progress, checkUpdate, downloadAndInstall, dismiss } = useUpdate()

  useGlobalShortcuts()

  // 设置 403 拦截器
  useEffect(() => {
    setForbiddenHandler((data) => {
      showForbidden(data)
    })
    return () => {
      setForbiddenHandler(null)
    }
  }, [showForbidden])

  useEffect(() => {
    const setupListeners = async () => {
      const unlisten1 = await listen('open-ai-chat', () => {
        // noop in App layer
      })
      const unlisten2 = await listen('open-quick-search', () => {
        // noop in App layer
      })

      return () => {
        unlisten1()
        unlisten2()
      }
    }

    const cleanup = setupListeners()
    return () => {
      cleanup.then((fn) => fn())
    }
  }, [])

  useEffect(() => {
    const initApp = async () => {
      try {
        await restoreSession()
        await new Promise((resolve) => setTimeout(resolve, 500))
        setInitialized(true)
      } catch (error) {
        console.error('应用初始化失败', error)
      } finally {
        setLoading(false)
      }
    }

    void initApp()
  }, [restoreSession, setInitialized])

  const handleAutoCheckUpdate = useCallback(async () => {
    await checkUpdate()
  }, [checkUpdate])

  useEffect(() => {
    if (!loading) {
      void handleAutoCheckUpdate()
    }
  }, [loading, handleAutoCheckUpdate])

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

  const isLoginRoute = typeof window !== 'undefined' && window.location.pathname === '/login'

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
    <BrowserRouter>
      <OfflineIndicator />
      {showTopBarHint && !isLoginRoute && (
        <div className="fixed left-1/2 top-4 z-50 w-[520px] -translate-x-1/2">
          <Alert className="border-slate-200 bg-white shadow-lg">
            <AlertTitle className="text-slate-900">欢迎使用顶部菜单栏</AlertTitle>
            <AlertDescription className="mt-2 text-slate-600">
              <div>快捷键提示: Ctrl+Shift+M 切换菜单栏，Ctrl+B 切换左侧栏，Ctrl+Shift+I 切换 AI Chat Panel。</div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={handleDismissTopBarHint}>
                  知道了
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          {/* Admin routes - rendered via Outlet in Workbench */}
          <Route path="admin/users" element={<UserListPage />} />
          <Route path="admin/users/create" element={<UserCreatePage />} />
          <Route path="admin/users/:id/edit" element={<UserEditPage />} />
          <Route path="admin/organization" element={<OrganizationPage />} />
          {/* Permission center route */}
          <Route path="admin/permissions" element={<PermissionCenter />} />
          {/* Fine-grained permission configuration route */}
          <Route path="admin/permissions/fine-grained" element={<FineGrainedPermissionPage />} />
        </Route>
      </Routes>
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={downloading}
        progress={progress}
        onDownload={downloadAndInstall}
        onDismiss={dismiss}
      />
      <ForbiddenModal
        open={forbiddenModal.open}
        onClose={hideForbidden}
        data={forbiddenModal.data}
      />
      <Toaster />
    </BrowserRouter>
  )
}

export default App
