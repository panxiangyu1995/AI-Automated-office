/**
 * 统一错误处理模块
 * 
 * 提供用户友好的错误信息，提升用户体验
 */

/**
 * 错误分类
 */
export type ErrorCategory = 
  | 'NETWORK'
  | 'AUTH'
  | 'VALIDATION'
  | 'SERVER'
  | 'UNKNOWN';

/**
 * 友好错误接口
 */
export interface FriendlyError {
  /** 错误代码 */
  code: string;
  /** 错误标题 */
  title: string;
  /** 错误消息 */
  message: string;
  /** 可选的操作按钮 */
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * 获取友好的错误信息
 * @param error 原始错误对象
 * @returns FriendlyError
 */
export function getFriendlyError(error: unknown): FriendlyError {
  if (!error) {
    return {
      code: 'UNKNOWN',
      title: '未知错误',
      message: '发生了未知错误，请稍后重试',
    };
  }

  // 处理字符串错误
  if (typeof error === 'string') {
    return parseStringError(error);
  }

  // 处理对象错误
  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    
    // 处理Tauri错误
    if (err.message && typeof err.message === 'string') {
      return parseTauriError(err);
    }
    
    // 处理自定义错误对象
    if (err.code && err.message) {
      return {
        code: String(err.code),
        title: getTitleForCode(String(err.code)),
        message: String(err.message),
      };
    }
  }

  return {
    code: 'UNKNOWN',
    title: '系统错误',
    message: '发生了一个错误，请稍后重试',
  };
}

/**
 * 解析字符串错误
 */
function parseStringError(error: string): FriendlyError {
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('fetch')) {
    return {
      code: 'NETWORK',
      title: '网络错误',
      message: '无法连接服务器，请检查您的网络设置',
    };
  }
  
  if (lowerError.includes('auth') || lowerError.includes('unauthorized') || lowerError.includes('401') || lowerError.includes('login')) {
    return {
      code: 'AUTH',
      title: '认证错误',
      message: '登录已过期，请重新登录',
    };
  }
  
  if (lowerError.includes('validation') || lowerError.includes('invalid') || lowerError.includes('格式')) {
    return {
      code: 'VALIDATION',
      title: '输入错误',
      message: '请检查输入内容是否正确',
    };
  }
  
  if (lowerError.includes('500') || lowerError.includes('server') || lowerError.includes('internal')) {
    return {
      code: 'SERVER',
      title: '服务器错误',
      message: '服务器繁忙，请稍后重试',
    };
  }
  
  return {
    code: 'UNKNOWN',
    title: '操作失败',
    message: error || '发生了一个错误，请稍后重试',
  };
}

/**
 * 解析Tauri错误
 */
function parseTauriError(error: Record<string, unknown>): FriendlyError {
  const message = String(error.message || '');
  const lowerMessage = message.toLowerCase();
  
  // 网络相关错误
  if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('fetch') || lowerMessage.includes('超时')) {
    return {
      code: 'NETWORK',
      title: '网络错误',
      message: '无法连接服务器，请检查您的网络设置',
    };
  }
  
  // 认证相关错误
  if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized') || lowerMessage.includes('401') || lowerMessage.includes('403') || lowerMessage.includes('登录')) {
    return {
      code: 'AUTH',
      title: '认证错误',
      message: '登录已过期，请重新登录',
    };
  }
  
  // 验证相关错误
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') || lowerMessage.includes('格式') || lowerMessage.includes('必填')) {
    return {
      code: 'VALIDATION',
      title: '输入错误',
      message: '请检查输入内容是否正确',
    };
  }
  
  // 服务器错误
  if (lowerMessage.includes('500') || lowerMessage.includes('server') || lowerMessage.includes('internal') || lowerMessage.includes('服务器')) {
    return {
      code: 'SERVER',
      title: '服务器错误',
      message: '服务器繁忙，请稍后重试',
    };
  }
  
  return {
    code: 'UNKNOWN',
    title: '操作失败',
    message: message || '发生了一个错误，请稍后重试',
  };
}

/**
 * 根据错误代码获取标题
 */
function getTitleForCode(code: string): string {
  const codeLower = code.toLowerCase();
  
  if (codeLower.includes('network')) return '网络错误';
  if (codeLower.includes('auth')) return '认证错误';
  if (codeLower.includes('validation')) return '输入错误';
  if (codeLower.includes('server')) return '服务器错误';
  if (codeLower.includes('not_found')) return '未找到';
  if (codeLower.includes('timeout')) return '请求超时';
  
  return '操作失败';
}

/**
 * 检查是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  const friendly = getFriendlyError(error);
  return friendly.code === 'NETWORK';
}

/**
 * 检查是否为认证错误
 */
export function isAuthError(error: unknown): boolean {
  const friendly = getFriendlyError(error);
  return friendly.code === 'AUTH';
}

/**
 * 检查是否为验证错误
 */
export function isValidationError(error: unknown): boolean {
  const friendly = getFriendlyError(error);
  return friendly.code === 'VALIDATION';
}

/**
 * 检查是否为服务器错误
 */
export function isServerError(error: unknown): boolean {
  const friendly = getFriendlyError(error);
  return friendly.code === 'SERVER';
}

/**
 * 创建带重试操作的错误
 */
export function createRetryableError(error: unknown, retryHandler: () => void): FriendlyError {
  const friendly = getFriendlyError(error);
  return {
    ...friendly,
    action: {
      label: '重试',
      handler: retryHandler,
    },
  };
}
