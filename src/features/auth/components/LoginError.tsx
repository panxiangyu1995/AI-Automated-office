/**
 * 登录错误提示组件
 * 
 * @module LoginError
 * @description 根据错误码显示友好的错误提示信息
 */

import { AlertCircle, Lock, UserX, WifiOff, ServerOff } from 'lucide-react'
import type { AuthError } from '../types/auth.types'

interface LoginErrorProps {
  /** 错误对象或错误消息 */
  error: AuthError | string
}

/**
 * 错误配置
 */
interface ErrorConfig {
  icon: typeof AlertCircle
  message: string
}

/**
 * 获取错误配置
 * @param code 错误码
 * @param fallbackMessage 默认消息
 */
const getErrorConfig = (code: string, fallbackMessage: string): ErrorConfig => {
  switch (code) {
    case 'AUTH_001':
      return {
        icon: UserX,
        message: '用户名或密码错误，请重新输入',
      }
    case 'AUTH_002':
      return {
        icon: Lock,
        message: '账户已被锁定，请稍后重试',
      }
    case 'AUTH_003':
      return {
        icon: UserX,
        message: '账户已禁用，请联系管理员',
      }
    case 'AUTH_004':
      return {
        icon: Lock,
        message: '登录失败次数过多，账户已临时锁定',
      }
    case 'NETWORK_ERROR':
    case 'AUTH_API_TIMEOUT':
      return {
        icon: WifiOff,
        message: '网络连接超时，请检查网络后重试',
      }
    case 'SERVER_ERROR':
      return {
        icon: ServerOff,
        message: '服务器错误，请稍后重试',
      }
    default:
      return {
        icon: AlertCircle,
        message: fallbackMessage || '登录失败，请稍后重试',
      }
  }
}

/**
 * 登录错误提示组件
 * 
 * 根据错误码显示对应的图标和错误信息
 */
export function LoginError({ error }: LoginErrorProps) {
  const errorCode = typeof error === 'string' ? 'UNKNOWN' : error.code
  const errorMessage = typeof error === 'string' ? error : error.message
  const config = getErrorConfig(errorCode, errorMessage)
  const Icon = config.icon

  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <Icon className="h-5 w-5 flex-shrink-0 text-red-500" />
      <p className="font-sans text-sm font-medium text-red-600">{config.message}</p>
    </div>
  )
}
