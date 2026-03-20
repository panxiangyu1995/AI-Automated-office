package service

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"cloud-server/internal/model"

	"go.uber.org/zap"
)

// DataScopeService 数据范围服务
type DataScopeService struct {
	db     *sql.DB
	logger *zap.Logger
}

// NewDataScopeService 创建数据范围服务
func NewDataScopeService(db *sql.DB, logger *zap.Logger) *DataScopeService {
	return &DataScopeService{
		db:     db,
		logger: logger,
	}
}

// DataScopeFilterResult 数据范围过滤结果
type DataScopeFilterResult struct {
	WhereClause string        // WHERE 子句
	Args        []interface{} // 参数
	JoinClause  string        // JOIN 子句（如需要）
}

// ApplyDataScope 应用数据范围过滤
// 返回 WHERE 条件和参数
func (s *DataScopeService) ApplyDataScope(ctx context.Context, userID string, scope *model.DataScope, tableName string) (*DataScopeFilterResult, error) {
	result := &DataScopeFilterResult{
		Args: make([]interface{}, 0),
	}

	switch scope.Type {
	case model.DataScopeAll:
		// 无过滤条件
		return result, nil

	case model.DataScopeDepartment:
		return s.applyDepartmentFilter(ctx, userID, tableName)

	case model.DataScopeDepartmentTree:
		return s.applyDepartmentTreeFilter(ctx, userID, tableName)

	case model.DataScopeSelf:
		return s.applySelfFilter(userID, tableName)

	case model.DataScopeCustom:
		if scope.Rule == nil {
			return result, nil
		}
		return s.applyCustomRule(scope.Rule, tableName)

	default:
		return result, nil
	}
}

// applyDepartmentFilter 应用部门数据范围过滤
func (s *DataScopeService) applyDepartmentFilter(ctx context.Context, userID, tableName string) (*DataScopeFilterResult, error) {
	// 获取用户所属部门
	userDeptID, err := s.getUserDepartmentID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user department: %w", err)
	}

	tablePrefix := ""
	if tableName != "" {
		tablePrefix = tableName + "."
	}

	return &DataScopeFilterResult{
		WhereClause: fmt.Sprintf("%sdepartment_id = $1", tablePrefix),
		Args:        []interface{}{userDeptID},
	}, nil
}

// applyDepartmentTreeFilter 应用部门树数据范围过滤
func (s *DataScopeService) applyDepartmentTreeFilter(ctx context.Context, userID, tableName string) (*DataScopeFilterResult, error) {
	// 获取用户部门及下级部门ID列表
	deptIDs, err := s.getDepartmentTreeIDs(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get department tree: %w", err)
	}

	tablePrefix := ""
	if tableName != "" {
		tablePrefix = tableName + "."
	}

	// 构建 IN 条件的占位符
	placeholders := make([]string, len(deptIDs))
	args := make([]interface{}, len(deptIDs))
	for i, id := range deptIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	return &DataScopeFilterResult{
		WhereClause: fmt.Sprintf("%sdepartment_id IN (%s)", tablePrefix, strings.Join(placeholders, ", ")),
		Args:        args,
	}, nil
}

// applySelfFilter 应用本人数据范围过滤
func (s *DataScopeService) applySelfFilter(userID, tableName string) (*DataScopeFilterResult, error) {
	tablePrefix := ""
	if tableName != "" {
		tablePrefix = tableName + "."
	}

	return &DataScopeFilterResult{
		WhereClause: fmt.Sprintf("%screated_by = $1", tablePrefix),
		Args:        []interface{}{userID},
	}, nil
}

// applyCustomRule 应用自定义规则过滤
func (s *DataScopeService) applyCustomRule(rule *model.DataScopeRule, tableName string) (*DataScopeFilterResult, error) {
	if len(rule.Conditions) == 0 {
		return &DataScopeFilterResult{}, nil
	}

	tablePrefix := ""
	if tableName != "" {
		tablePrefix = tableName + "."
	}

	var conditions []string
	args := make([]interface{}, 0)
	argIndex := 1

	for _, cond := range rule.Conditions {
		condition, arg, newIndex := s.buildCondition(cond, tablePrefix, argIndex)
		conditions = append(conditions, condition)
		args = append(args, arg...)
		argIndex = newIndex
	}

	logic := " AND "
	if rule.Logic == "or" {
		logic = " OR "
	}

	return &DataScopeFilterResult{
		WhereClause: "(" + strings.Join(conditions, logic) + ")",
		Args:        args,
	}, nil
}

// buildCondition 构建单个条件
func (s *DataScopeService) buildCondition(cond model.DataScopeCondition, tablePrefix string, startArgIndex int) (string, []interface{}, int) {
	field := tablePrefix + cond.Field
	args := make([]interface{}, 0)
	argIndex := startArgIndex

	switch cond.Operator {
	case "eq":
		return fmt.Sprintf("%s = $%d", field, argIndex), []interface{}{cond.Value}, argIndex + 1
	case "ne":
		return fmt.Sprintf("%s != $%d", field, argIndex), []interface{}{cond.Value}, argIndex + 1
	case "in":
		values, ok := cond.Value.([]interface{})
		if !ok {
			return "1=1", nil, argIndex
		}
		placeholders := make([]string, len(values))
		for i, v := range values {
			placeholders[i] = fmt.Sprintf("$%d", argIndex+i)
			args = append(args, v)
		}
		return fmt.Sprintf("%s IN (%s)", field, strings.Join(placeholders, ", ")), args, argIndex + len(values)
	case "not_in":
		values, ok := cond.Value.([]interface{})
		if !ok {
			return "1=1", nil, argIndex
		}
		placeholders := make([]string, len(values))
		for i, v := range values {
			placeholders[i] = fmt.Sprintf("$%d", argIndex+i)
			args = append(args, v)
		}
		return fmt.Sprintf("%s NOT IN (%s)", field, strings.Join(placeholders, ", ")), args, argIndex + len(values)
	case "gt":
		return fmt.Sprintf("%s > $%d", field, argIndex), []interface{}{cond.Value}, argIndex + 1
	case "lt":
		return fmt.Sprintf("%s < $%d", field, argIndex), []interface{}{cond.Value}, argIndex + 1
	case "gte":
		return fmt.Sprintf("%s >= $%d", field, argIndex), []interface{}{cond.Value}, argIndex + 1
	case "lte":
		return fmt.Sprintf("%s <= $%d", field, argIndex), []interface{}{cond.Value}, argIndex + 1
	case "like":
		return fmt.Sprintf("%s LIKE $%d", field, argIndex), []interface{}{cond.Value}, argIndex + 1
	default:
		return "1=1", nil, argIndex
	}
}

// getUserDepartmentID 获取用户所属部门ID
func (s *DataScopeService) getUserDepartmentID(ctx context.Context, userID string) (string, error) {
	query := `
		SELECT d.id
		FROM users u
		JOIN user_departments ud ON ud.user_id = u.id
		JOIN departments d ON d.id = ud.department_id
		WHERE u.id = $1
		LIMIT 1
	`

	var deptID string
	err := s.db.QueryRowContext(ctx, query, userID).Scan(&deptID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("user has no department")
		}
		return "", err
	}

	return deptID, nil
}

// getDepartmentTreeIDs 获取用户部门及下级部门ID列表
func (s *DataScopeService) getDepartmentTreeIDs(ctx context.Context, userID string) ([]string, error) {
	// 使用闭包表查询部门树
	query := `
		WITH user_dept AS (
			SELECT d.id
			FROM users u
			JOIN user_departments ud ON ud.user_id = u.id
			JOIN departments d ON d.id = ud.department_id
			WHERE u.id = $1
			LIMIT 1
		)
		SELECT dc.descendant_id
		FROM department_closure dc
		JOIN user_dept ud ON ud.id = dc.ancestor_id
		UNION
		SELECT id FROM user_dept
	`

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deptIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		deptIDs = append(deptIDs, id)
	}

	return deptIDs, nil
}

// GetUserDepartmentInfo 获取用户部门信息（用于前端展示）
func (s *DataScopeService) GetUserDepartmentInfo(ctx context.Context, userID string) (map[string]interface{}, error) {
	query := `
		SELECT d.id, d.name, d.code, d.path
		FROM users u
		JOIN user_departments ud ON ud.user_id = u.id
		JOIN departments d ON d.id = ud.department_id
		WHERE u.id = $1
		LIMIT 1
	`

	var id, name, code, path string
	err := s.db.QueryRowContext(ctx, query, userID).Scan(&id, &name, &code, &path)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return map[string]interface{}{
		"id":   id,
		"name": name,
		"code": code,
		"path": path,
	}, nil
}
