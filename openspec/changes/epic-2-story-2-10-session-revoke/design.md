# Design: Force Logout and Expiry Handling

## 技术方案

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                  Force Logout Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐      POST /session/revoke      ┌─────────┐│
│  │  管理员     │ ───────────────────────────► │  后端   ││
│  └─────────────┘                                └────┬────┘│
│                                                      │      │
│                                        撤销会话     │      │
│                                                      ▼      │
│  ┌─────────────┐                            ┌─────────────┐│
│  │  用户端     │ ◄─── 401 响应 ─────────── │  数据库     ││
│  │  (前端)     │                            │  (sessions) ││
│  └──────┬──────┘                            └─────────────┘│
│         │                                                  │
│         ▼                                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               前端处理流程                           │  │
│  │  1. 拦截 401 响应                                   │  │
│  │  2. 显示会话过期弹窗                                │  │
│  │  3. 清理本地状态                                    │  │
│  │  4. 跳转登录页                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

### 后端 API 设计

#### 1. 会话撤销 API

```go
// POST /api/auth/session/revoke
type RevokeSessionRequest struct {
    SessionID string `json:"session_id" binding:"required_without=UserID"`
    UserID    string `json:"user_id" binding:"required_without=SessionID"`  // 撤销用户所有会话
    Reason    string `json:"reason"`  // force_logout, security, admin
}

type RevokeSessionResponse struct {
    RevokedCount int      `json:"revoked_count"`
    SessionIDs   []string `json:"session_ids"`
}

// Handler
func (h *AuthHandler) RevokeSession(c *gin.Context) {
    var req RevokeSessionRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    operatorID := c.GetString("user_id")
    
    var sessionIDs []string
    var err error
    
    if req.UserID != "" {
        // 撤销用户所有会话
        sessionIDs, err = h.sessionService.RevokeAllByUserID(c, req.UserID, req.Reason)
    } else {
        // 撤销单个会话
        err = h.sessionService.RevokeSession(c, req.SessionID, req.Reason)
        sessionIDs = []string{req.SessionID}
    }
    
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // 写入审计日志
    h.auditLogger.Log(c, &AuditLog{
        EventType: "auth.session.revoke",
        Resource:  "sessions",
        Action:    "revoke",
        Result:    "success",
        Details: map[string]interface{}{
            "session_ids":   sessionIDs,
            "reason":        req.Reason,
            "operator_id":   operatorID,
        },
    })
    
    c.JSON(200, RevokeSessionResponse{
        RevokedCount: len(sessionIDs),
        SessionIDs:   sessionIDs,
    })
}
```

#### 2. 会话状态检查 API

```go
// GET /api/auth/session/check
func (h *AuthHandler) CheckSession(c *gin.Context) {
    session := c.MustGet("session").(*Session)
    
    c.JSON(200, gin.H{
        "valid":          true,
        "user_id":        session.UserID,
        "last_active_at": session.LastActiveAt,
        "expires_at":     session.ExpiresAt,
    })
}
```

### 前端处理设计

#### 1. API 响应拦截器

```typescript
// src/lib/api.ts
import { useAuthStore } from '@/stores/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      // 根据错误码显示不同的提示
      switch (errorCode) {
        case 'SESSION_EXPIRED':
          showSessionExpiredModal('您的会话已过期，请重新登录');
          break;
        case 'SESSION_IDLE_TIMEOUT':
          showSessionExpiredModal('由于长时间未操作，会话已过期');
          break;
        case 'SESSION_REVOKED':
          showSessionExpiredModal('您已被强制登出');
          break;
        default:
          showSessionExpiredModal('登录状态已失效，请重新登录');
      }
      
      // 清理认证状态
      useAuthStore.getState().clearAuth();
      
      // 跳转登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 2. 会话过期弹窗

```tsx
// src/components/common/SessionExpiredModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SessionExpiredModalProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionExpiredModal({ message, isOpen, onClose }: SessionExpiredModalProps) {
  const handleReLogin = () => {
    onClose();
    window.location.href = '/login';
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>会话已过期</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">{message}</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleReLogin}>
            重新登录
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 全局显示函数
let showModalFn: (message: string) => void;

export function setSessionExpiredModalHandler(fn: (message: string) => void) {
  showModalFn = fn;
}

export function showSessionExpiredModal(message: string) {
  if (showModalFn) {
    showModalFn(message);
  }
}
```

#### 3. 认证状态管理

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  updateToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      
      setAuth: (accessToken, refreshToken, user) => 
        set({ 
          accessToken, 
          refreshToken, 
          user, 
          isAuthenticated: true 
        }),
      
      clearAuth: () => {
        // 调用 Tauri 清理本地缓存
        if (window.__TAURI__) {
          window.__TAURI__.invoke('clear_session_cache');
        }
        
        set({ 
          accessToken: null, 
          refreshToken: null, 
          user: null, 
          isAuthenticated: false 
        });
      },
      
      updateToken: (accessToken) => 
        set({ accessToken }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
```

#### 4. Tauri 本地缓存清理

```rust
// src-tauri/src/commands/session.rs
use tauri::AppHandle;

/// 清理本地会话缓存
#[tauri::command]
pub async fn clear_session_cache(app: AppHandle) -> Result<(), String> {
    // 清理存储的会话元数据
    let app_data_dir = app.path_resolver().app_data_dir()
        .ok_or("Failed to get app data directory")?;
    
    let session_file = app_data_dir.join("session.json");
    if session_file.exists() {
        std::fs::remove_file(session_file)
            .map_err(|e| format!("Failed to remove session file: {}", e))?;
    }
    
    // 清理其他敏感数据
    // ...
    
    Ok(())
}
```

### 定期会话检查

```typescript
// src/hooks/useSessionCheck.ts
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';

export function useSessionCheck() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // 每 5 分钟检查一次会话状态
    const interval = setInterval(async () => {
      try {
        await apiClient.get('/api/auth/session/check');
      } catch (error) {
        // 401 会被拦截器处理
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);
}
```

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐
│Session Revoke │────►│Session Service│
│    API        │     │   (后端)      │
└───────────────┘     └───────────────┘
        │
        │
        ▼
┌───────────────┐     ┌───────────────┐
│  Frontend     │────►│  Auth Store   │
│  Interceptor  │     │  (状态管理)   │
└───────────────┘     └───────────────┘
```