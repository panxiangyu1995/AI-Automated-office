# Design: Agent模块UX增强

## 涉及文件

- `src/features/agent/components/AgentIntercom.tsx` (修改)
- `src/features/agent/components/EmployeeDirectory.tsx` (修改)

## 技术设计

将UX基础组件包裹到agent模块的核心交互中，不影响现有mock数据逻辑。

### AgentIntercom改造

```tsx
// 在组件顶层加入loading state
const [isInitializing, setIsInitializing] = useState(true)
useEffect(() => {
  const timer = setTimeout(() => setIsInitializing(false), 800)
  return () => clearTimeout(timer)
}, [])

if (isInitializing) return <ChatSkeleton messages={4} />
```

### EmployeeDirectory改造

```tsx
// 搜索无结果
if (searchQuery && filteredEmployees.length === 0) {
  return <EmptyState variant="search" title="未找到匹配的员工" ...
}
// 列表为空
if (employees.length === 0 && !searchQuery) {
  return <EmptyState variant="data" title="暂无员工数据" ...
}
```
