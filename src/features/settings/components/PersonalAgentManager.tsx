import { useState, useEffect, useCallback } from 'react'
import {
  Bot,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Upload,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { invoke } from '@tauri-apps/api/core'

// Types
export interface PersonalSubagent {
  name: string
  display_name: string
  description: string
  agent_type: 'personal'
  mode: string
  prompt: string
  trigger: {
    mode: 'manual' | 'auto' | 'hybrid'
    keywords: string[]
    conditions: string[]
    priority: number
  }
  tools: {
    allowed: string[]
    denied: string[]
    constraints: Record<string, unknown>
  }
  limits: {
    max_steps: number
    max_concurrent: number
    timeout_seconds: number
  }
  model: {
    provider: string
    model_id: string
    temperature: number
    max_tokens: number
  }
  creator_id?: string
  plugin_id?: string
  enabled: boolean
  version: number
}

export interface CreateSubagentForm {
  name: string
  display_name: string
  description: string
  model_provider: string
  model_id: string
  temperature: number
  max_tokens: number
  prompt: string
  trigger_mode: 'manual' | 'auto' | 'hybrid'
  trigger_keywords: string
  allowed_tools: string
}

export interface PersonalAgentManagerProps {
  className?: string
}

// Default form state
const defaultForm: CreateSubagentForm = {
  name: '',
  display_name: '',
  description: '',
  model_provider: 'openai',
  model_id: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 4096,
  prompt: '',
  trigger_mode: 'manual',
  trigger_keywords: '',
  allowed_tools: '',
}

// Personal Agent Manager Component
export function PersonalAgentManager({ className }: PersonalAgentManagerProps) {
  const [subagents, setSubagents] = useState<PersonalSubagent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSubagent, setSelectedSubagent] = useState<PersonalSubagent | null>(null)
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateSubagentForm>(defaultForm)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Load subagents
  const loadSubagents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await invoke<PersonalSubagent[]>('list_personal_subagents')
      setSubagents(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      console.error('Failed to load subagents:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSubagents()
  }, [loadSubagents])

  // Filter subagents by search
  const filteredSubagents = subagents.filter((subagent) => {
    const query = searchQuery.toLowerCase()
    return (
      subagent.name.toLowerCase().includes(query) ||
      subagent.display_name.toLowerCase().includes(query) ||
      subagent.description.toLowerCase().includes(query)
    )
  })

  // Create subagent
  const handleCreate = async () => {
    try {
      setFormLoading(true)
      setFormError(null)
      
      const keywords = createForm.trigger_keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0)
      
      const tools = createForm.allowed_tools
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      await invoke<PersonalSubagent>('create_personal_subagent', {
        name: createForm.name,
        displayName: createForm.display_name,
        description: createForm.description || null,
        modelProvider: createForm.model_provider,
        modelId: createForm.model_id,
        temperature: createForm.temperature,
        maxTokens: createForm.max_tokens,
        prompt: createForm.prompt,
        triggerMode: createForm.trigger_mode,
        triggerKeywords: keywords,
        allowedTools: tools,
      })

      setCreateDialogOpen(false)
      setCreateForm(defaultForm)
      loadSubagents()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err))
    } finally {
      setFormLoading(false)
    }
  }

  // Update subagent
  const handleUpdate = async () => {
    if (!selectedSubagent) return
    
    try {
      setFormLoading(true)
      setFormError(null)
      
      await invoke<PersonalSubagent>('update_personal_subagent', {
        name: selectedSubagent.name,
        displayName: createForm.display_name || null,
        description: createForm.description || null,
        prompt: createForm.prompt || null,
        enabled: selectedSubagent.enabled,
      })

      setEditDialogOpen(false)
      setSelectedSubagent(null)
      loadSubagents()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err))
    } finally {
      setFormLoading(false)
    }
  }

  // Delete subagent
  const handleDelete = async () => {
    if (!selectedSubagent) return
    
    try {
      setFormLoading(true)
      setFormError(null)
      
      await invoke('delete_personal_subagent', {
        name: selectedSubagent.name,
      })

      setDeleteDialogOpen(false)
      setSelectedSubagent(null)
      loadSubagents()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err))
    } finally {
      setFormLoading(false)
    }
  }

  // Toggle enabled
  const handleToggle = async (subagent: PersonalSubagent) => {
    try {
      await invoke<PersonalSubagent>('update_personal_subagent', {
        name: subagent.name,
        displayName: null,
        description: null,
        prompt: null,
        enabled: !subagent.enabled,
      })
      loadSubagents()
    } catch (err) {
      console.error('Failed to toggle subagent:', err)
    }
  }

  // Export subagent
  const handleExport = (subagent: PersonalSubagent) => {
    const exportData = {
      name: subagent.name,
      display_name: subagent.display_name,
      description: subagent.description,
      prompt: subagent.prompt,
      trigger: subagent.trigger,
      tools: subagent.tools,
      model: subagent.model,
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${subagent.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import subagent
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Create with new name
      const newName = `${data.name}-imported-${Date.now()}`
      
      await invoke<PersonalSubagent>('create_personal_subagent', {
        name: newName,
        displayName: data.display_name || data.name,
        description: data.description || null,
        modelProvider: data.model?.provider || 'openai',
        modelId: data.model?.model_id || 'gpt-4o',
        temperature: data.model?.temperature || 0.7,
        maxTokens: data.model?.max_tokens || 4096,
        prompt: data.prompt || '',
        triggerMode: data.trigger?.mode || 'manual',
        triggerKeywords: data.trigger?.keywords || [],
        allowedTools: data.tools?.allowed || [],
      })

      loadSubagents()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }

    event.target.value = ''
  }

  // Open edit dialog
  const openEditDialog = (subagent: PersonalSubagent) => {
    setSelectedSubagent(subagent)
    setCreateForm({
      name: subagent.name,
      display_name: subagent.display_name,
      description: subagent.description,
      model_provider: subagent.model.provider,
      model_id: subagent.model.model_id,
      temperature: subagent.model.temperature,
      max_tokens: subagent.model.max_tokens,
      prompt: subagent.prompt,
      trigger_mode: subagent.trigger.mode,
      trigger_keywords: subagent.trigger.keywords.join(', '),
      allowed_tools: subagent.tools.allowed.join(', '),
    })
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (subagent: PersonalSubagent) => {
    setSelectedSubagent(subagent)
    setDeleteDialogOpen(true)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-[#1E3A5F]" />
          <h2 className="text-lg font-semibold">Personal Subagent</h2>
          <Badge variant="secondary">{filteredSubagents.length}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[200px] pl-8"
            />
          </div>
          
          <label>
            <Input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="mr-1 h-4 w-4" />
                Import
              </span>
            </Button>
          </label>
          
          <Button
            size="sm"
            onClick={() => {
              setCreateForm(defaultForm)
              setCreateDialogOpen(true)
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Subagent List */}
      {!loading && (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredSubagents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bot className="mb-2 h-8 w-8" />
                <p>No personal subagents yet</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create your first subagent
                </Button>
              </div>
            ) : (
              filteredSubagents.map((subagent) => (
                <Card key={subagent.name} className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        subagent.enabled ? 'bg-[#1E3A5F]/10' : 'bg-muted'
                      )}>
                        <Bot className={cn(
                          'h-5 w-5',
                          subagent.enabled ? 'text-[#1E3A5F]' : 'text-muted-foreground'
                        )} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{subagent.display_name}</h3>
                          <Badge variant="outline" className="text-xs">
                            v{subagent.version}
                          </Badge>
                          {subagent.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          @{subagent.name}
                          {subagent.description && ` - ${subagent.description}`}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {subagent.trigger.mode}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {subagent.model.provider}
                          </Badge>
                          {subagent.tools.allowed.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {subagent.tools.allowed.length} tools
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(subagent)}
                      >
                        {subagent.enabled ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(subagent)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(subagent)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(subagent)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Personal Subagent</DialogTitle>
            <DialogDescription>
              Create a new personal subagent with custom configuration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (ID)</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="my-assistant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={createForm.display_name}
                  onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                  placeholder="My Assistant"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="A brief description of this subagent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model_provider">Model Provider</Label>
                <Input
                  id="model_provider"
                  value={createForm.model_provider}
                  onChange={(e) => setCreateForm({ ...createForm, model_provider: e.target.value })}
                  placeholder="openai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model_id">Model ID</Label>
                <Input
                  id="model_id"
                  value={createForm.model_id}
                  onChange={(e) => setCreateForm({ ...createForm, model_id: e.target.value })}
                  placeholder="gpt-4o"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={createForm.temperature}
                  onChange={(e) => setCreateForm({ ...createForm, temperature: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={createForm.max_tokens}
                  onChange={(e) => setCreateForm({ ...createForm, max_tokens: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea
                id="prompt"
                value={createForm.prompt}
                onChange={(e) => setCreateForm({ ...createForm, prompt: e.target.value })}
                placeholder="You are a helpful assistant..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trigger_keywords">Trigger Keywords (comma-separated)</Label>
              <Input
                id="trigger_keywords"
                value={createForm.trigger_keywords}
                onChange={(e) => setCreateForm({ ...createForm, trigger_keywords: e.target.value })}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trigger_mode">Trigger Mode</Label>
              <div className="flex gap-2">
                {(['manual', 'auto', 'hybrid'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={createForm.trigger_mode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCreateForm({ ...createForm, trigger_mode: mode })}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allowed_tools">Allowed Tools (comma-separated)</Label>
              <Input
                id="allowed_tools"
                value={createForm.allowed_tools}
                onChange={(e) => setCreateForm({ ...createForm, allowed_tools: e.target.value })}
                placeholder="tool1, tool2, tool3"
              />
            </div>
          </div>
          
          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{formError}</span>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Personal Subagent</DialogTitle>
            <DialogDescription>
              Update configuration for {selectedSubagent?.display_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_display_name">Display Name</Label>
              <Input
                id="edit_display_name"
                value={createForm.display_name}
                onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Input
                id="edit_description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_prompt">System Prompt</Label>
              <Textarea
                id="edit_prompt"
                value={createForm.prompt}
                onChange={(e) => setCreateForm({ ...createForm, prompt: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          
          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{formError}</span>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Personal Subagent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedSubagent?.display_name}"? 
              This action cannot be undone and all associated data will be lost.
            </DialogDescription>
          </DialogHeader>
          
          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{formError}</span>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PersonalAgentManager
