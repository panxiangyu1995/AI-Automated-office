# Design: Local Session Cache Wrapper

## 技术方案

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  authStore (Zustand)                                        │
│  ├── accessToken (内存)                                     │
│  ├── refreshToken (持久化)                                  │
│  └── user info (内存)                                       │
├─────────────────────────────────────────────────────────────┤
│                    Tauri IPC Layer                           │
│  Commands:                                                  │
│  ├── save_session_metadata                                  │
│  ├── get_session_metadata                                   │
│  └── clear_session_cache                                    │
├─────────────────────────────────────────────────────────────┤
│                    Rust Backend Layer                        │
│  SessionCache                                               │
│  ├── validate_metadata() - 安全检查                         │
│  ├── encrypt_and_save() - 加密存储                          │
│  ├── decrypt_and_load() - 解密读取                          │
│  └── clear() - 安全清理                                     │
├─────────────────────────────────────────────────────────────┤
│                    Storage Layer                             │
│  ├── LocalEncryptor (AES-256-GCM)                           │
│  ├── SecureFileStorage (加密文件存储)                       │
│  └── MachineKeyDerivation (机器绑定密钥)                    │
└─────────────────────────────────────────────────────────────┘
```

### 数据结构设计

#### SessionMetadata

```rust
// src-tauri/src/session/metadata.rs

/// 安全的会话元数据结构
/// 注意：此结构不包含 Access Token 和密码等敏感信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMetadata {
    /// 用户 ID
    pub user_id: String,
    /// 用户名（用于显示）
    pub username: String,
    /// 显示名称
    pub display_name: Option<String>,
    /// 租户 ID
    pub tenant_id: String,
    /// 租户名称
    pub tenant_name: Option<String>,
    /// Refresh Token（用于 Token 刷新）
    pub refresh_token: String,
    /// Token 过期时间（Unix 时间戳）
    pub expires_at: i64,
    /// 最后活跃时间
    pub last_active_at: i64,
    /// 创建时间
    pub created_at: i64,
}

/// 安全检查结果
#[derive(Debug)]
pub struct SecurityCheckResult {
    pub is_valid: bool,
    pub violations: Vec<String>,
}
```

#### 禁止存储的字段

```rust
/// 安全检查：禁止存储的字段列表
const FORBIDDEN_FIELDS: &[&str] = &[
    "password",
    "password_hash",
    "access_token",
    "permissions",
    "roles",
];

impl SessionMetadata {
    /// 安全检查：确保元数据不包含敏感信息
    pub fn security_check(&self) -> SecurityCheckResult {
        let mut violations = Vec::new();
        
        // 检查 refresh_token 是否为空
        if self.refresh_token.is_empty() {
            violations.push("refresh_token cannot be empty".to_string());
        }
        
        // 检查时间戳是否合理
        if self.expires_at <= self.created_at {
            violations.push("expires_at must be greater than created_at".to_string());
        }
        
        SecurityCheckResult {
            is_valid: violations.is_empty(),
            violations,
        }
    }
}
```

### 加密存储设计

#### 加密方案

```
┌─────────────────────────────────────────────────────────────┐
│                    加密流程                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 生成机器绑定密钥                                        │
│     ├── 读取机器标识 (Machine ID)                           │
│     ├── 使用 PBKDF2 派生密钥                                │
│     └── 生成 256-bit AES 密钥                               │
│     ↓                                                       │
│  2. 加密元数据                                              │
│     ├── 序列化 SessionMetadata 为 JSON                      │
│     ├── 生成随机 12-byte Nonce                              │
│     ├── 使用 AES-256-GCM 加密                               │
│     └── 输出: Nonce + Ciphertext + Tag                      │
│     ↓                                                       │
│  3. 存储加密数据                                            │
│     ├── 写入文件: %LOCALAPPDATA%/.../session/metadata.enc   │
│     └── 设置文件权限 (仅当前用户可读)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### LocalEncryptor 实现

```rust
// src-tauri/src/crypto/local_encryptor.rs

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use pbkdf2::pbkdf2_hmac;
use sha2::Sha256;

/// 本地加密器
pub struct LocalEncryptor {
    cipher: Aes256Gcm,
}

impl LocalEncryptor {
    const NONCE_SIZE: usize = 12;
    const KEY_SIZE: usize = 32;
    const SALT: &[u8] = b"ai-automated-office-session-v1";
    const ITERATIONS: u32 = 100_000;
    
    /// 从机器标识创建加密器
    pub fn from_machine_id(machine_id: &str) -> Result<Self, CryptoError> {
        let key = Self::derive_key(machine_id);
        let cipher = Aes256Gcm::new_from_slice(&key)
            .map_err(|e| CryptoError::KeyDerivation(e.to_string()))?;
        Ok(Self { cipher })
    }
    
    /// 使用 PBKDF2 派生密钥
    fn derive_key(machine_id: &str) -> [u8; 32] {
        let mut key = [0u8; 32];
        pbkdf2_hmac::<Sha256>(
            machine_id.as_bytes(),
            Self::SALT,
            Self::ITERATIONS,
            &mut key,
        );
        key
    }
    
    /// 加密数据
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>, CryptoError> {
        let nonce_bytes = rand::thread_rng().gen::<[u8; 12]>();
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        let ciphertext = self.cipher
            .encrypt(nonce, plaintext)
            .map_err(|e| CryptoError::Encryption(e.to_string()))?;
        
        // 格式: Nonce (12 bytes) + Ciphertext + Tag (16 bytes)
        let mut result = Vec::with_capacity(Self::NONCE_SIZE + ciphertext.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend(ciphertext);
        
        Ok(result)
    }
    
    /// 解密数据
    pub fn decrypt(&self, encrypted: &[u8]) -> Result<Vec<u8>, CryptoError> {
        if encrypted.len() < Self::NONCE_SIZE {
            return Err(CryptoError::InvalidData("Data too short".to_string()));
        }
        
        let (nonce_bytes, ciphertext) = encrypted.split_at(Self::NONCE_SIZE);
        let nonce = Nonce::from_slice(nonce_bytes);
        
        self.cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| CryptoError::Decryption(e.to_string()))
    }
}
```

### Tauri 命令设计

#### save_session_metadata

```rust
// src-tauri/src/commands/session.rs

use tauri::State;
use crate::session::{SessionCache, SessionMetadata};

/// 保存会话元数据
/// 
/// # Arguments
/// * `metadata` - 会话元数据（不包含密码和 Access Token）
/// 
/// # Returns
/// * `Ok(())` - 保存成功
/// * `Err(SessionError)` - 保存失败
#[tauri::command]
pub async fn save_session_metadata(
    metadata: SessionMetadata,
    cache: State<'_, SessionCache>,
) -> Result<(), SessionError> {
    // 安全检查：验证元数据不包含敏感信息
    let check = metadata.security_check();
    if !check.is_valid {
        return Err(SessionError::SecurityViolation(check.violations.join(", ")));
    }
    
    // 检查禁止字段（额外保护）
    if metadata.contains_forbidden_fields() {
        return Err(SessionError::SecurityViolation(
            "Attempted to store forbidden fields".to_string()
        ));
    }
    
    // 加密并保存
    cache.save(metadata).await?;
    
    Ok(())
}
```

#### get_session_metadata

```rust
/// 获取会话元数据
/// 
/// # Returns
/// * `Ok(Some(SessionMetadata))` - 存在有效元数据
/// * `Ok(None)` - 无缓存的元数据
/// * `Err(SessionError)` - 读取失败
#[tauri::command]
pub async fn get_session_metadata(
    cache: State<'_, SessionCache>,
) -> Result<Option<SessionMetadata>, SessionError> {
    // 读取并解密
    let metadata = cache.load().await?;
    
    // 检查是否过期
    if let Some(ref meta) = metadata {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        
        if meta.expires_at < now {
            // 已过期，自动清理
            cache.clear().await?;
            return Ok(None);
        }
    }
    
    Ok(metadata)
}
```

#### clear_session_cache

```rust
/// 清理会话缓存
/// 
/// 安全清理所有本地会话数据，包括：
/// - 加密的元数据文件
/// - 临时缓存文件
#[tauri::command]
pub async fn clear_session_cache(
    cache: State<'_, SessionCache>,
) -> Result<(), SessionError> {
    cache.clear().await?;
    
    // 同时清理临时文件
    cache.clear_temp_files().await?;
    
    Ok(())
}
```

### 与前端集成

#### Tauri 命令封装

```typescript
// src/lib/tauri.ts

import { invoke } from '@tauri-apps/api/tauri';

export interface SessionMetadata {
  user_id: string;
  username: string;
  display_name?: string;
  tenant_id: string;
  tenant_name?: string;
  refresh_token: string;
  expires_at: number;
  last_active_at: number;
  created_at: number;
}

export const tauriSession = {
  /**
   * 保存会话元数据到本地缓存
   * 注意：不会保存密码和 Access Token
   */
  async saveSessionMetadata(metadata: SessionMetadata): Promise<void> {
    await invoke('save_session_metadata', { metadata });
  },
  
  /**
   * 从本地缓存获取会话元数据
   * 返回 null 表示无缓存或已过期
   */
  async getSessionMetadata(): Promise<SessionMetadata | null> {
    return await invoke<SessionMetadata | null>('get_session_metadata');
  },
  
  /**
   * 清理本地会话缓存
   * 登出或会话失效时调用
   */
  async clearSessionCache(): Promise<void> {
    await invoke('clear_session_cache');
  },
};
```

#### authStore 集成

```typescript
// src/stores/authStore.ts

import { tauriSession, SessionMetadata } from '@/lib/tauri';

interface AuthState {
  // ... 现有状态 ...
  
  // Actions
  setAuth: (data: LoginResponse) => Promise<void>;
  restoreFromCache: () => Promise<boolean>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ... 现有状态初始化 ...
      
      setAuth: async (data) => {
        // 1. 更新内存状态
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          permissions: data.permissions,
          isAuthenticated: true,
        });
        
        // 2. 保存到本地缓存（仅安全元数据）
        try {
          await tauriSession.saveSessionMetadata({
            user_id: data.user.id,
            username: data.user.username,
            display_name: data.user.real_name,
            tenant_id: data.tenant.id,
            tenant_name: data.tenant.name,
            refresh_token: data.refresh_token,
            expires_at: Date.now() / 1000 + data.expires_in,
            last_active_at: Date.now() / 1000,
            created_at: Date.now() / 1000,
          });
        } catch (e) {
          console.warn('Failed to save session to local cache:', e);
        }
      },
      
      restoreFromCache: async () => {
        try {
          const metadata = await tauriSession.getSessionMetadata();
          if (!metadata) return false;
          
          // 使用 refresh_token 尝试刷新 token
          const response = await authApi.refreshToken(metadata.refresh_token);
          
          set({
            user: {
              id: metadata.user_id,
              username: metadata.username,
              real_name: metadata.display_name,
            },
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
          });
          
          return true;
        } catch (e) {
          console.warn('Failed to restore session from cache:', e);
          await tauriSession.clearSessionCache();
          return false;
        }
      },
      
      clearAuth: async () => {
        // 1. 清理本地缓存
        try {
          await tauriSession.clearSessionCache();
        } catch (e) {
          console.warn('Failed to clear session cache:', e);
        }
        
        // 2. 清理内存状态
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          permissions: null,
          isAuthenticated: false,
        });
      },
    }),
    // ... persist 配置 ...
  )
);
```

## 存储位置设计

### Windows 平台

```
%LOCALAPPDATA%\AI-Automated-office\
├── session\
│   ├── metadata.enc          # 加密的会话元数据
│   └── key.der               # 加密密钥（可选，机器绑定）
├── cache\
│   └── temp\                 # 临时缓存（可清理）
└── logs\
    └── session.log           # 会话诊断日志
```

### 文件权限

```rust
// 设置文件权限：仅当前用户可读写
fn set_secure_permissions(path: &Path) -> Result<(), std::io::Error> {
    #[cfg(target_os = "windows")]
    {
        // Windows: 设置 DACL，仅当前用户有权限
        use std::os::windows::fs::OpenOptionsExt;
        // 使用 Windows API 设置安全描述符
    }
    
    #[cfg(target_os = "linux")]
    {
        // Linux: chmod 600
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600))?;
    }
    
    Ok(())
}
```

## 安全考虑

### 禁止事项

1. **禁止存储密码**
   - 明文密码：绝对禁止
   - 密码哈希：禁止（由云端管理）
   - 密码提示：禁止

2. **禁止存储敏感 Token**
   - Access Token：禁止（有效期短，敏感）
   - 详细权限：禁止（由云端实时计算）

3. **禁止本地鉴权**
   - 不自行判定登录成功
   - 不绕过云端会话校验
   - 不放大用户权限

### 安全措施

1. **加密存储**
   - 使用 AES-256-GCM
   - 密钥机器绑定
   - 防止数据泄露

2. **安全检查**
   - 保存前验证元数据
   - 阻止敏感字段存储
   - 记录安全日志

3. **自动清理**
   - 过期自动清理
   - 登出时清理
   - 会话失效时清理

## 性能考虑

1. **异步操作**
   - 所有 IO 操作使用 async
   - 不阻塞主线程

2. **缓存策略**
   - 内存缓存 + 文件缓存
   - 减少重复 IO

3. **错误恢复**
   - 文件损坏时自动清理
   - 解密失败时重新登录

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Frontend     │────→│  Tauri IPC    │     │  Cloud API    │
│  authStore    │     │  Session Cmds │←────│  Session API  │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     
        │                     │                     
        ▼                     ▼                     
┌───────────────┐     ┌───────────────┐             
│  LocalEncrypt │     │  SecureStorage│             
│  (AES-256)    │     │  (File)       │             
└───────────────┘     └───────────────┘             
```