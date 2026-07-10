package rbac

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ABACEvaluator struct{}

func NewABACEvaluator() *ABACEvaluator {
	return &ABACEvaluator{}
}

func (e *ABACEvaluator) Evaluate(ctx *model.PermissionContext) (*model.Decision, error) {
	if ctx.Subject == nil || ctx.Object == nil {
		return &model.Decision{Allowed: false, Reason: "ABAC: missing subject or object"}, nil
	}

	return &model.Decision{
		Allowed:       false,
		Reason:        "ABAC: no matching conditions",
		EvaluatorName: e.GetName(),
	}, nil
}

func EvaluateConditions(conditions model.JSONB, ctx *model.PermissionContext) (bool, error) {
	if conditions == nil || len(conditions) == 0 {
		return true, nil
	}

	conditionsJSON, err := json.Marshal(conditions)
	if err != nil {
		return false, fmt.Errorf("failed to marshal conditions: %w", err)
	}

	var conds []map[string]interface{}
	if err := json.Unmarshal(conditionsJSON, &conds); err == nil {
		for _, c := range conds {
			if ok, _ := evaluateSingleCondition(c, ctx); !ok {
				return false, nil
			}
		}
		return true, nil
	}

	var singleCond map[string]interface{}
	if err := json.Unmarshal(conditionsJSON, &singleCond); err != nil {
		return false, fmt.Errorf("failed to unmarshal conditions: %w", err)
	}

	return evaluateSingleCondition(singleCond, ctx)
}

func evaluateSingleCondition(cond map[string]interface{}, ctx *model.PermissionContext) (bool, error) {
	field, _ := cond["field"].(string)
	operator, _ := cond["operator"].(string)
	value := cond["value"]

	actualValue := resolveFieldValue(field, ctx)
	if actualValue == "" {
		return false, nil
	}

	switch operator {
	case "eq":
		return fmt.Sprintf("%v", value) == actualValue, nil
	case "ne":
		return fmt.Sprintf("%v", value) != actualValue, nil
	case "in":
		if arr, ok := value.([]interface{}); ok {
			for _, v := range arr {
				if fmt.Sprintf("%v", v) == actualValue {
					return true, nil
				}
			}
		}
		return false, nil
	case "not_in":
		if arr, ok := value.([]interface{}); ok {
			for _, v := range arr {
				if fmt.Sprintf("%v", v) == actualValue {
					return false, nil
				}
			}
		}
		return true, nil
	case "self_only":
		return strings.HasPrefix(field, "created_by") || strings.HasPrefix(field, "owner"), nil
	}

	return false, nil
}

func resolveFieldValue(field string, ctx *model.PermissionContext) string {
	if strings.HasPrefix(field, "${user.") {
		attr := strings.TrimPrefix(field, "${user.")
		attr = strings.TrimSuffix(attr, "}")
		switch attr {
		case "id":
			return ctx.Subject.UserID
		case "department_id":
			return ctx.Subject.DepartmentID
		case "enterprise_id":
			return ctx.Subject.EnterpriseID
		case "role":
			return ctx.Subject.Role
		}
	}
	return field
}

func (e *ABACEvaluator) GetName() string { return "abac" }
func (e *ABACEvaluator) Priority() int   { return 2 }
