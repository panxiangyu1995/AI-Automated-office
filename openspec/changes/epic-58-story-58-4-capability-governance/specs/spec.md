# Specs: 能力治理与Principal Membership

## 功能规格

### 1. Fitness Board (governance_fitness_board)

**输入：** void
**输出：** FitnessBoard

### 2. 建议列表 (governance_suggestions_list)

**输入：** status?
**输出：** `ImprovementSuggestion[]`

### 3. Principal列表 (principal_list)

**输入：** principalType?
**输出：** `Principal[]`

### 4. DAK Graph (dak_graph_build)

**输入：** rootId, rootType
**输出：** DakGraph

## 接口规格

| 命令 | 参数 | 返回值 |
|------|------|--------|
| governance_fitness_board | - | FitnessBoard |
| governance_suggestions_list | status? | ImprovementSuggestion[] |
| principal_list | principalType? | Principal[] |
| dak_graph_build | rootId, rootType | DakGraph |

## 错误码

| 错误码 | 说明 |
|--------|------|
| CONTRACT_NOT_FOUND | 能力契约不存在 |
| PRINCIPAL_NOT_FOUND | 主体不存在 |
| GRAPH_FAILED | 图构建失败 |
