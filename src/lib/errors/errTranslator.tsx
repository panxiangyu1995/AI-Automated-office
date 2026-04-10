/**
 * 错误翻译层 - 将技术错误转换为用户友好的消息
 * 
 * 用于Agent模块的错误信息友好化
 * 
 * 铁律合规：
 * - UX-04: 用户友好的错误提示
 */

import { toast } from '@/components/ui/use-toast';

/**
 * 用户友好的错误结构
 */
export interface UserFriendlyError {
  /** 错误标题 */
  title: string;
  /** 错误消息 */
  message: string;
  /** 可选的操作按钮文本 */
  action?: string;
  /** 原始错误对象 */
  originalError?: Error | null;
}

/**
 * 错误码到友好消息的映射
 */
const ERROR_MESSAGES: Record<string, { title: string; message: string; action?: string }> = {
  // 网络错误
  'ERR_NETWORK_TIMEOUT': {
    title: '网络连接超时',
    message: '无法连接到服务器，请检查网络后重试',
    action: '重试'
  },
  'ERR_NETWORK_UNAVAILABLE': {
    title: '网络不可用',
    message: '请检查您的网络连接',
    action: '重试'
  },
  'ERR_NETWORK_ERROR': {
    title: '网络错误',
    message: '网络请求失败，请稍后重试',
    action: '重试'
  },

  // 认证错误
  'ERR_AUTH_TOKEN_EXPIRED': {
    title: '登录已过期',
    message: '您的登录已过期，请重新登录',
    action: '重新登录'
  },
  'ERR_AUTH_TOKEN_INVALID': {
    title: '登录无效',
    message: '登录信息无效，请重新登录',
    action: '重新登录'
  },
  'ERR_AUTH_PERMISSION_DENIED': {
    title: '权限不足',
    message: '您没有执行此操作的权限',
  },

  // 存储错误
  'ERR_STORAGE_QUOTA_EXCEEDED': {
    title: '存储空间不足',
    message: '本地存储空间已满，请清理后重试',
    action: '查看详情'
  },
  'ERR_STORAGE_WRITE_FAILED': {
    title: '保存失败',
    message: '无法保存数据，请稍后重试',
    action: '重试'
  },
  'ERR_STORAGE_READ_FAILED': {
    title: '读取失败',
    message: '无法读取数据，请稍后重试',
    action: '重试'
  },

  // 工具错误
  'ERR_TOOL_NOT_FOUND': {
    title: '工具不可用',
    message: '请求的工具暂时不可用，请稍后重试',
    action: '重试'
  },
  'ERR_TOOL_EXECUTION_FAILED': {
    title: '工具执行失败',
    message: '工具执行过程中出现错误，请稍后重试',
    action: '重试'
  },
  'ERR_TOOL_PERMISSION_DENIED': {
    title: '工具权限不足',
    message: '您没有使用此工具的权限',
  },

  // Agent错误
  'ERR_AGENT_LOOP_DETECTED': {
    title: '对话循环',
    message: '检测到对话陷入循环，已自动停止',
    action: '开始新对话'
  },
  'ERR_AGENT_TIMEOUT': {
    title: '响应超时',
    message: 'AI响应时间过长，请稍后重试',
    action: '重试'
  },
  'ERR_AGENT_CONTEXT_EXCEEDED': {
    title: '上下文超限',
    message: '对话上下文过长，已自动压缩',
  },
  'ERR_AGENT_RUNTIME_ERROR': {
    title: '运行错误',
    message: 'AI运行时出现错误，请稍后重试',
    action: '重试'
  },

  // 消息错误
  'ERR_MESSAGE_NOT_FOUND': {
    title: '消息不存在',
    message: '无法找到该消息',
  },
  'ERR_MESSAGE_SEND_FAILED': {
    title: '发送失败',
    message: '消息发送失败，请稍后重试',
    action: '重试'
  },

  // SubAgent错误
  'ERR_SUBAGENT_NOT_FOUND': {
    title: '助手不存在',
    message: '找不到指定的AI助手',
  },
  'ERR_SUBAGENT_CREATE_FAILED': {
    title: '创建失败',
    message: '创建AI助手失败，请稍后重试',
    action: '重试'
  },
  'ERR_SUBAGENT_UPDATE_FAILED': {
    title: '更新失败',
    message: '更新AI助手失败，请稍后重试',
    action: '重试'
  },

  // 通用错误
  'ERR_UNKNOWN': {
    title: '出错了',
    message: '操作失败，请稍后重试',
    action: '重试'
  },
  'ERR_VALIDATION': {
    title: '输入无效',
    message: '请检查输入内容后重试',
  },
  'ERR_RATE_LIMIT': {
    title: '请求过于频繁',
    message: '操作过于频繁，请稍后再试',
  },
};

/**
 * 常见技术错误模式匹配
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  errorCode: string;
}> = [
  // 网络错误
  { pattern: /network|fetch|axios|request/i, errorCode: 'ERR_NETWORK_ERROR' },
  { pattern: /timeout|timed? out/i, errorCode: 'ERR_NETWORK_TIMEOUT' },
  // 认证错误
  { pattern: /401|unauthorized|auth.*fail|token.*invalid/i, errorCode: 'ERR_AUTH_TOKEN_INVALID' },
  { pattern: /403|forbidden|permission.*denied|access.*denied/i, errorCode: 'ERR_AUTH_PERMISSION_DENIED' },
  // 存储错误
  { pattern: /quota.*exceeded|storage.*full|disk.*full/i, errorCode: 'ERR_STORAGE_QUOTA_EXCEEDED' },
  { pattern: /localStorage|sessionStorage/i, errorCode: 'ERR_STORAGE_READ_FAILED' },
  // 工具错误
  { pattern: /tool.*not.*found|tool.*missing/i, errorCode: 'ERR_TOOL_NOT_FOUND' },
  // Agent错误
  { pattern: /loop.*detected|infinite.*loop/i, errorCode: 'ERR_AGENT_LOOP_DETECTED' },
  // 消息错误
  { pattern: /message.*not.*found/i, errorCode: 'ERR_MESSAGE_NOT_FOUND' },
  // SubAgent错误
  { pattern: /subagent.*not.*found|agent.*not.*found/i, errorCode: 'ERR_SUBAGENT_NOT_FOUND' },
];

/**
 * 将错误码转换为用户友好的错误
 * 
 * @param errorCode - 错误码字符串
 * @returns 用户友好的错误对象
 */
export function translateError(errorCode: string): UserFriendlyError {
  const template = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['ERR_UNKNOWN'];
  
  return {
    ...template,
    originalError: null
  };
}

/**
 * 从任意错误对象获取用户友好的错误
 * 
 * @param error - Error对象或错误消息字符串
 * @returns 用户友好的错误对象
 */
export function getFriendlyError(error: Error | string | null | undefined): UserFriendlyError {
  if (!error) {
    return ERROR_MESSAGES['ERR_UNKNOWN'];
  }

  const errorMessage = typeof error === 'string' ? error : error.message || String(error);
  const errorCode = typeof error === 'string' ? error : (error as Error).code || errorMessage;

  // 首先尝试直接匹配错误码
  if (ERROR_MESSAGES[errorCode]) {
    return {
      ...ERROR_MESSAGES[errorCode],
      originalError: error instanceof Error ? error : null
    };
  }

  // 尝试模式匹配
  for (const { pattern, errorCode: matchedCode } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage) || pattern.test(String(errorCode))) {
      return {
        ...ERROR_MESSAGES[matchedCode],
        originalError: error instanceof Error ? error : null
      };
    }
  }

  // 默认返回通用错误
  return {
    ...ERROR_MESSAGES['ERR_UNKNOWN'],
    originalError: error instanceof Error ? error : null
  };
}

/**
 * 显示错误Toast
 * 
 * @param error - Error对象或错误消息字符串
 */
export function showErrorToast(error: Error | string | null | undefined): void {
  const friendly = getFriendlyError(error);
  
  toast({
    title: friendly.title,
    description: friendly.message,
    variant: 'destructive',
    action: friendly.action ? (
      <button className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
        {friendly.action}
      </button>
    ) : undefined,
  });
}

/**
 * 获取错误操作处理函数
 * 
 * @param error - Error对象或错误消息字符串
 * @param action - 操作类型
 * @returns 处理函数
 */
export function getErrorActionHandler(
  error: Error | string | null | undefined,
  action: 'retry' | 'reload' | 'login' | 'newChat'
): () => void {
  return () => {
    switch (action) {
      case 'retry':
        // 触发重试逻辑
        window.dispatchEvent(new CustomEvent('error:retry', { detail: error }));
        break;
      case 'reload':
        window.location.reload();
        break;
      case 'login':
        window.dispatchEvent(new CustomEvent('auth:login'));
        break;
      case 'newChat':
        window.dispatchEvent(new CustomEvent('chat:new'));
        break;
    }
  };
}
