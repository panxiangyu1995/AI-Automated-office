/**
 * usePluginLifecycle Hook
 *
 * React 友好的 PluginLifecycleManager 访问接口
 */

import { useCallback, useEffect, useState } from 'react'
import { pluginLifecycleManager } from './pluginLifecycle'
import type {
  PluginLifecycleHooks,
  PluginLifecycleContext,
  PluginLifecycleState,
} from './types/pluginLifecycle'

/**
 * usePluginLifecycle 选项
 */
export interface UsePluginLifecycleOptions {
  /** 插件 ID */
  pluginId: string
  /** 插件名称 */
  name?: string
  /** 插件版本 */
  version?: string
  /** 生命周期钩子 */
  hooks: PluginLifecycleHooks
}

/**
 * usePluginLifecycle 返回类型
 */
export interface UsePluginLifecycleReturn {
  /** 插件状态 */
  state: PluginLifecycleState | undefined
  /** 插件上下文 */
  context: PluginLifecycleContext | undefined
  /** 手动触发初始化 */
  initialize: () => Promise<void>
  /** 手动触发挂载 */
  mount: () => Promise<void>
  /** 手动触发卸载 */
  unmount: () => Promise<void>
  /** 启用插件 */
  enable: () => Promise<void>
  /** 禁用插件 */
  disable: () => Promise<void>
  /** 注销插件 */
  unregister: () => Promise<void>
  /** 发送事件到插件 */
  emit: (event: string, payload: unknown) => void
}

/**
 * usePluginLifecycle Hook
 *
 * @example
 * function MyPlugin() {
 *   const lifecycle = usePluginLifecycle({
 *     pluginId: 'my-plugin',
 *     name: '我的插件',
 *     version: '1.0.0',
 *     hooks: {
 *       onInit: async () => {
 *         // Plugin initialized
 *       },
 *       onMount: async () => {
 *         // Plugin mounted
 *       },
 *       onEvent: (event, payload) => {
 *         // Handle received event
 *       },
 *     },
 *   })
 *
 *   return <div>Plugin: {lifecycle.state}</div>
 * }
 */
export function usePluginLifecycle(
  options: UsePluginLifecycleOptions
): UsePluginLifecycleReturn {
  const {
    pluginId,
    name,
    version,
    hooks,
  } = options

  const [state, setState] = useState<PluginLifecycleState | undefined>()
  const [context, setContext] = useState<PluginLifecycleContext | undefined>()

  // 注册插件
  useEffect(() => {
    pluginLifecycleManager.register(pluginId, hooks, { name, version })

    // 初始化状态
    setState(pluginLifecycleManager.getState(pluginId))
    setContext(pluginLifecycleManager.getContext(pluginId))

    // 创建状态监听
    const unsubscribe = setInterval(() => {
      const currentState = pluginLifecycleManager.getState(pluginId)
      const currentContext = pluginLifecycleManager.getContext(pluginId)
      if (currentState !== state) {
        setState(currentState)
      }
      if (currentContext !== context) {
        setContext(currentContext)
      }
    }, 100)

    // 清理
    return () => {
      clearInterval(unsubscribe)
      pluginLifecycleManager.unregister(pluginId).catch((err) => {
        console.error(`[usePluginLifecycle] Cleanup failed for "${pluginId}":`, err)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pluginId])

  /**
   * 手动触发初始化
   */
  const initialize = useCallback(async () => {
    await pluginLifecycleManager.initialize(pluginId)
    setState(pluginLifecycleManager.getState(pluginId))
    setContext(pluginLifecycleManager.getContext(pluginId))
  }, [pluginId])

  /**
   * 手动触发挂载
   */
  const mount = useCallback(async () => {
    await pluginLifecycleManager.mount(pluginId)
    setState(pluginLifecycleManager.getState(pluginId))
    setContext(pluginLifecycleManager.getContext(pluginId))
  }, [pluginId])

  /**
   * 手动触发卸载
   */
  const unmount = useCallback(async () => {
    await pluginLifecycleManager.unmount(pluginId)
    setState(pluginLifecycleManager.getState(pluginId))
    setContext(pluginLifecycleManager.getContext(pluginId))
  }, [pluginId])

  /**
   * 启用插件
   */
  const enable = useCallback(async () => {
    await pluginLifecycleManager.enable(pluginId)
    setState(pluginLifecycleManager.getState(pluginId))
    setContext(pluginLifecycleManager.getContext(pluginId))
  }, [pluginId])

  /**
   * 禁用插件
   */
  const disable = useCallback(async () => {
    await pluginLifecycleManager.disable(pluginId)
    setState(pluginLifecycleManager.getState(pluginId))
    setContext(pluginLifecycleManager.getContext(pluginId))
  }, [pluginId])

  /**
   * 注销插件
   */
  const unregister = useCallback(async () => {
    await pluginLifecycleManager.unregister(pluginId)
    setState(undefined)
    setContext(undefined)
  }, [pluginId])

  /**
   * 发送事件到插件
   */
  const emit = useCallback((event: string, payload: unknown) => {
    pluginLifecycleManager.emit(pluginId, event, payload)
  }, [pluginId])

  return {
    state,
    context,
    initialize,
    mount,
    unmount,
    enable,
    disable,
    unregister,
    emit,
  }
}

/**
 * usePluginState - 获取插件状态
 */
export function usePluginState(pluginId: string): PluginLifecycleState | undefined {
  const [state, setState] = useState<PluginLifecycleState | undefined>(
    pluginLifecycleManager.getState(pluginId)
  )

  useEffect(() => {
    const checkState = () => {
      const currentState = pluginLifecycleManager.getState(pluginId)
      if (currentState !== state) {
        setState(currentState)
      }
    }

    const interval = setInterval(checkState, 100)
    return () => clearInterval(interval)
  }, [pluginId, state])

  return state
}

/**
 * useAllPlugins - 获取所有已注册的插件
 */
export function useAllPlugins(): string[] {
  const [plugins, setPlugins] = useState<string[]>(pluginLifecycleManager.getRegisteredPlugins())

  useEffect(() => {
    const updatePlugins = () => {
      setPlugins(pluginLifecycleManager.getRegisteredPlugins())
    }

    const interval = setInterval(updatePlugins, 500)
    return () => clearInterval(interval)
  }, [])

  return plugins
}

/**
 * useEnabledPlugins - 获取所有已启用的插件
 */
export function useEnabledPlugins(): string[] {
  const [plugins, setPlugins] = useState<string[]>(pluginLifecycleManager.getEnabledPlugins())

  useEffect(() => {
    const updatePlugins = () => {
      setPlugins(pluginLifecycleManager.getEnabledPlugins())
    }

    const interval = setInterval(updatePlugins, 500)
    return () => clearInterval(interval)
  }, [])

  return plugins
}
