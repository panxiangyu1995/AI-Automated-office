import { useEffect, useCallback } from 'react'
import { useWorkbenchStore } from '../stores/workbenchStore'

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  return (
    ['input', 'textarea', 'select'].includes(tagName) ||
    target.isContentEditable
  )
}

export function useTabShortcuts() {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab, closeOtherTabs } =
    useWorkbenchStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return

      const target = e.target as HTMLElement
      if (isInputElement(target)) return

      const currentIndex = tabs.findIndex((t) => t.id === activeTabId)

      switch (e.key) {
        case 'Tab': {
          e.preventDefault()
          if (tabs.length <= 1) return

          if (e.shiftKey) {
            const prevIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1
            setActiveTab(tabs[prevIndex].id)
          } else {
            const nextIndex = currentIndex >= tabs.length - 1 ? 0 : currentIndex + 1
            setActiveTab(tabs[nextIndex].id)
          }
          break
        }

        case 'w':
        case 'W': {
          e.preventDefault()
          if (!activeTabId) return

          const tab = tabs.find((t) => t.id === activeTabId)
          if (tab?.dirty) {
            const confirmed = window.confirm(
              `"${tab.title}" 有未保存的更改，确定要关闭吗？`
            )
            if (!confirmed) return
          }
          removeTab(activeTabId)
          break
        }

        case 't':
        case 'T': {
          if (e.shiftKey) return
          e.preventDefault()
          addTab({
            title: '新建标签页',
            type: 'custom',
            closable: true,
            dirty: false,
          })
          break
        }

        case 'o':
        case 'O': {
          if (!e.shiftKey) return
          e.preventDefault()
          if (!activeTabId) return
          closeOtherTabs(activeTabId)
          break
        }

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          e.preventDefault()
          const targetIndex = parseInt(e.key, 10) - 1
          if (targetIndex >= 0 && targetIndex < tabs.length) {
            setActiveTab(tabs[targetIndex].id)
          }
          break
        }
      }
    },
    [tabs, activeTabId, setActiveTab, removeTab, addTab, closeOtherTabs]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
