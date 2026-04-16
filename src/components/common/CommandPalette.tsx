/**
 * Command Palette Component
 * A VSCode-style command palette that replaces the QuickSearch.
 */
import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Search, FileText, Edit3, Eye, Puzzle, Wrench, Settings, ArrowUp, ArrowDown, CornerDownLeft, Command as CmdIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { CommandRegistry, type Command, type CommandCategory } from "@/lib/commandRegistry"

const CATEGORY_CONFIG = {
  file: { label: "文件", icon: FileText, color: "var(--ao-commandPalette-secondaryForeground)" },
  edit: { label: "编辑", icon: Edit3, color: "var(--ao-commandPalette-secondaryForeground)" },
  view: { label: "视图", icon: Eye, color: "var(--ao-commandPalette-secondaryForeground)" },
  plugin: { label: "插件", icon: Puzzle, color: "var(--ao-commandPalette-secondaryForeground)" },
  tool: { label: "工具", icon: Wrench, color: "var(--ao-commandPalette-secondaryForeground)" },
  settings: { label: "设置", icon: Settings, color: "var(--ao-commandPalette-secondaryForeground)" },
  navigation: { label: "导航", icon: CmdIcon, color: "var(--ao-commandPalette-secondaryForeground)" },
} as const

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  className?: string
}

function useCommandPalette(onExecute?: (command: Command) => void) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [filterCategory, setFilterCategory] = useState<CommandCategory | "all">("all")
  const [commands, setCommands] = useState<Command[]>([])

  useEffect(() => {
    const update = () => {
      setCommands(CommandRegistry.search(query))
      setSelectedIndex(0)
    }
    update()
    return CommandRegistry.subscribe(update)
  }, [query])

  const filteredCommands = useMemo(() => {
    if (filterCategory === "all") return commands
    return commands.filter(cmd => cmd.category === filterCategory)
  }, [commands, filterCategory])

  const navigateUp = useCallback(() => { setSelectedIndex(i => Math.max(0, i - 1)) }, [])
  const navigateDown = useCallback(() => { setSelectedIndex(i => Math.min(filteredCommands.length - 1, i + 1)) }, [filteredCommands.length])

  const executeSelected = useCallback(async () => {
    const cmd = filteredCommands[selectedIndex]
    if (cmd) { await CommandRegistry.execute(cmd.id); onExecute?.(cmd) }
  }, [filteredCommands, selectedIndex, onExecute])

  const execute = useCallback(async (command: Command) => {
    await CommandRegistry.execute(command.id)
    onExecute?.(command)
  }, [onExecute])

  return { query, setQuery, filteredCommands, selectedIndex, setSelectedIndex, filterCategory, setFilterCategory, navigateUp, navigateDown, executeSelected, execute }
}

export function CommandPalette({ open, onClose, className }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const onExecuteRef = useRef(onClose)
  onExecuteRef.current = onClose
  const { query, setQuery, filteredCommands, selectedIndex, setSelectedIndex, filterCategory, setFilterCategory, navigateUp, navigateDown, executeSelected, execute } = useCommandPalette(() => onExecuteRef.current())

  useEffect(() => {
    if (open) { setQuery(""); setSelectedIndex(0); setFilterCategory("all"); inputRef.current?.focus() }
  }, [open, setQuery, setSelectedIndex, setFilterCategory])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") { e.preventDefault(); navigateUp() }
    else if (e.key === "ArrowDown") { e.preventDefault(); navigateDown() }
    else if (e.key === "Enter") { e.preventDefault(); executeSelected() }
    else if (e.key === "Escape") { e.preventDefault(); onClose() }
    else if (e.key === "Tab") {
      e.preventDefault()
      const cats = ["all", "file", "edit", "view", "plugin", "tool", "settings", "navigation"] as const
      const idx = cats.indexOf(filterCategory as typeof cats[number])
      const next = e.shiftKey ? cats[(idx - 1 + cats.length) % cats.length] : cats[(idx + 1) % cats.length]
      setFilterCategory(next)
    }
  }, [navigateUp, navigateDown, executeSelected, onClose, filterCategory, setFilterCategory])

  if (!open) return null

  return (
    <div className={cn("fixed inset-0 z-50 flex items-start justify-center", className)} style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }} onClick={onClose}>
      <div className="mt-24 w-[640px] flex flex-col rounded-lg overflow-hidden" style={{ backgroundColor: "var(--ao-commandPalette-background)", border: "1px solid var(--ao-commandPalette-border)", boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex h-[52px] items-center gap-3 px-4" style={{ borderBottom: "1px solid var(--ao-commandPalette-border)" }}>
          <Search size={16} style={{ color: "var(--ao-commandPalette-secondaryForeground)" }} />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="输入命令或搜索..." className="flex-1 text-sm outline-none bg-transparent" style={{ color: "var(--ao-commandPalette-foreground)" }} />
          <div className="flex items-center px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: "var(--ao-commandPalette-badgeBackground)", color: "var(--ao-commandPalette-secondaryForeground)" }}>ESC</div>
        </div>
        <div className="flex items-center gap-1 px-3 py-2" style={{ borderBottom: "1px solid var(--ao-commandPalette-badgeBackground)" }}>
          {(["all", "file", "edit", "view", "plugin", "tool", "settings", "navigation"] as const).map((cat) => {
            const isActive = filterCategory === cat
            const config = cat === "all" ? { label: "全部", color: "var(--ao-commandPalette-secondaryForeground)" } : CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]
            return (
              <button key={cat} onClick={() => setFilterCategory(cat)} className={cn("px-2 py-1 rounded text-xs font-medium transition-colors", isActive ? "" : "opacity-70 hover:opacity-100")} style={{ color: isActive ? "var(--ao-commandPalette-activeForeground)" : "var(--ao-commandPalette-secondaryForeground)", backgroundColor: isActive ? "var(--ao-commandPalette-selectedBackground)" : "transparent" }}>
                {config.label}
              </button>
            )
          })}
        </div>
        <div className="p-2 max-h-[360px] overflow-y-auto">
          {filteredCommands.length === 0 && <div className="px-3 py-6 text-sm text-center" style={{ color: "var(--ao-commandPalette-secondaryForeground)" }}>{query ? "未找到匹配的命令" : "暂无可用命令"}</div>}
          <div className="flex flex-col gap-0.5">
            {filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex
              const config = CATEGORY_CONFIG[cmd.category] || CATEGORY_CONFIG.navigation
              const Icon = cmd.icon || config.icon
              return (
                <div key={cmd.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors" style={{ backgroundColor: isSelected ? "var(--ao-commandPalette-selectedBackground)" : "transparent" }} onClick={() => execute(cmd)} onMouseEnter={() => setSelectedIndex(index)}>
                  <span style={{ color: isSelected ? "var(--ao-commandPalette-activeForeground)" : config.color }}><Icon className="w-4 h-4" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: isSelected ? "var(--ao-commandPalette-activeForeground)" : "var(--ao-commandPalette-foreground)" }}>{cmd.label}</div>
                    {cmd.description && <div className="text-xs truncate" style={{ color: "var(--ao-commandPalette-secondaryForeground)" }}>{cmd.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: config.color }}>{config.label}</span>
                    {cmd.shortcut && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--ao-commandPalette-badgeBackground)", color: "var(--ao-commandPalette-secondaryForeground)" }}>{cmd.shortcut}</span>}
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5" style={{ color: "var(--ao-commandPalette-secondaryForeground)" }} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex h-9 items-center gap-4 px-4" style={{ backgroundColor: "var(--ao-commandPalette-footerBackground)", borderTop: "1px solid var(--ao-commandPalette-border)", color: "var(--ao-commandPalette-secondaryForeground)", fontSize: "12px" }}>
          <div className="flex items-center gap-1.5"><ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /><span>导航</span></div>
          <div className="flex items-center gap-1.5"><CornerDownLeft className="w-3 h-3" /><span>执行</span></div>
          <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--ao-commandPalette-badgeBackground)" }}>Tab</span><span>切换分类</span></div>
        </div>
      </div>
    </div>
  )
}

export { useCommandPalette }
export type { Command, CommandCategory } from "@/lib/commandRegistry"