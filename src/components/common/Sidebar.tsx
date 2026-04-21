import { PluginSidebarRegistry } from '@/lib/pluginSidebarRegistry';
import { useUIStore } from '@/stores/uiStore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Sidebar() {
  const activeModule = useUIStore((s) => s.activeModule);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const allItems = PluginSidebarRegistry.getAll();
  const moduleItems = allItems.filter((item) => item.pluginId === activeModule);

  const toggleSection = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const moduleLabel = moduleItems[0]?.pluginName ?? (activeModule === 'settings' ? '设置' : '');

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-semibold">
        {moduleLabel}
      </div>
      <nav className="flex-1 overflow-y-auto p-1">
        {moduleItems.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {activeModule === 'settings' ? '设置面板' : '暂无菜单项'}
          </div>
        ) : (
          moduleItems.map((item) => {
            const isExpanded = expanded[item.pluginId] !== false;
            const hasChildren = item.entries && item.entries.length > 0;

            return (
              <div key={item.pluginId}>
                <button
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => hasChildren && toggleSection(item.pluginId)}
                >
                  {hasChildren &&
                    (isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    ))}
                  {!hasChildren && <span className="w-3" />}
                  <span>{item.pluginName}</span>
                </button>
                {hasChildren && isExpanded && (
                  <div className="ml-4">
                    {item.entries.map((entry) => (
                      <button
                        key={entry.id}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                        onClick={() => {
                          navigate(entry.path);
                          setActiveModule(item.pluginId);
                        }}
                      >
                        <span>{entry.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
}