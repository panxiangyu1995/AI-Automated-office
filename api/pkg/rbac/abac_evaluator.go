package rbac

import (
	"encoding/json"
	"fmt"
	"strconv"
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

	if ctx.Object.Attributes == nil || len(ctx.Object.Attributes) == 0 {
		return &model.Decision{Allowed: true, Reason: "ABAC: no conditions to evaluate", EvaluatorName: e.GetName()}, nil
	}

	allowed, err := EvaluateConditions(ctx.Object.Attributes, ctx)
	if err != nil {
		return &model.Decision{Allowed: false, Reason: "ABAC: condition evaluation error: " + err.Error(), EvaluatorName: e.GetName()}, nil
	}

	return &model.Decision{
		Allowed:       allowed,
		Reason:        "ABAC: conditions evaluated",
		EvaluatorName: e.GetName(),
	}, nil
}

func EvaluateConditions(conditions model.JSONB, ctx *model.PermissionContext) (bool, error) {
	if conditions == nil || len(conditions) == 0 {
		return true, nil
	}

	if condArr, ok := conditions["conditions"]; ok {
		arr, ok := condArr.([]interface{})
		if ok {
			for _, item := range arr {
				c, ok := item.(map[string]interface{})
				if !ok {
					continue
				}
				if ok, _ := evaluateSingleCondition(c, ctx); !ok {
					return false, nil
				}
			}
			return true, nil
		}
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

	return evaluateSingleCondition(conditions, ctx)
}

func evaluateSingleCondition(cond map[string]interface{}, ctx *model.PermissionContext) (bool, error) {
	field, _ := cond["field"].(string)
	operator, _ := cond["operator"].(string)
	value := cond["value"]

	actualValue := resolveFieldValue(field, ctx)

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
	case "gt":
		return compareNumbers(actualValue, value, func(a, b float64) bool { return a > b })
	case "gte":
		return compareNumbers(actualValue, value, func(a, b float64) bool { return a >= b })
	case "lt":
		return compareNumbers(actualValue, value, func(a, b float64) bool { return a < b })
	case "lte":
		return compareNumbers(actualValue, value, func(a, b float64) bool { return a <= b })
	case "self_only":
		if ctx.Object == nil {
			return false, nil
		}
		if strings.Contains(field, "created_by") {
			return ctx.Object.CreatedBy != "" && ctx.Subject.UserID == ctx.Object.CreatedBy, nil
		}
		if strings.Contains(field, "owner") {
			return ctx.Object.OwnerID != "" && ctx.Subject.UserID == ctx.Object.OwnerID, nil
		}
		return ctx.Subject.UserID == actualValue, nil
	}

	return false, nil
}

func compareNumbers(actualStr string, expected interface{}, cmp func(float64, float64) bool) (bool, error) {
	actual, err := strconv.ParseFloat(actualStr, 64)
	if err != nil {
		return false, nil
	}
	expectedFloat, err := toFloat64(expected)
	if err != nil {
		return false, nil
	}
	return cmp(actual, expectedFloat), nil
}

func toFloat64(v interface{}) (float64, error) {
	switch val := v.(type) {
	case float64:
		return val, nil
	case float32:
		return float64(val), nil
	case int:
		return float64(val), nil
	case int64:
		return float64(val), nil
	case string:
		return strconv.ParseFloat(val, 64)
	default:
		return 0, fmt.Errorf("cannot convert %T to float64", v)
	}
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
	if strings.HasPrefix(field, "${object.") {
		attr := strings.TrimPrefix(field, "${object.")
		attr = strings.TrimSuffix(attr, "}")
		if ctx.Object == nil {
			return ""
		}
		switch attr {
		case "owner_id":
			return ctx.Object.OwnerID
		case "created_by":
			return ctx.Object.CreatedBy
		case "department_id":
			return ctx.Object.DepartmentID
		case "resource":
			return ctx.Object.Resource
		case "id":
			return ctx.Object.ID
		default:
			if ctx.Object.Attributes != nil {
				if v, ok := ctx.Object.Attributes[attr]; ok {
					return fmt.Sprintf("%v", v)
				}
			}
		}
	}
	return field
}

func (e *ABACEvaluator) GetName() string { return "abac" }
func (e *ABACEvaluator) Priority() int   { return 2 }
