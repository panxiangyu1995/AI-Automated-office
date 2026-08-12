package rbac

import (
	"testing"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

func TestABACEvaluate_NoConditions(t *testing.T) {
	e := NewABACEvaluator()
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1", Role: "employee"},
		Object:  &model.Object{Resource: "contract"},
		Action:  "read",
	}
	dec, err := e.Evaluate(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !dec.Allowed {
		t.Error("expected allowed when no conditions")
	}
}

func TestABACEvaluate_ConditionsPass(t *testing.T) {
	e := NewABACEvaluator()
	attrs := model.JSONB{
		"conditions": []interface{}{
			map[string]interface{}{"field": "${user.role}", "operator": "eq", "value": "manager"},
		},
	}
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1", Role: "manager"},
		Object:  &model.Object{Resource: "contract", Attributes: attrs},
		Action:  "approve",
	}
	dec, err := e.Evaluate(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !dec.Allowed {
		t.Error("expected allowed when conditions pass")
	}
}

func TestABACEvaluate_ConditionsFail(t *testing.T) {
	e := NewABACEvaluator()
	attrs := model.JSONB{
		"conditions": []interface{}{
			map[string]interface{}{"field": "${user.role}", "operator": "eq", "value": "owner"},
		},
	}
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1", Role: "employee"},
		Object:  &model.Object{Resource: "contract", Attributes: attrs},
		Action:  "approve",
	}
	dec, err := e.Evaluate(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if dec.Allowed {
		t.Error("expected denied when conditions fail")
	}
}

func TestEvaluateConditions_Eq(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1", Role: "admin", DepartmentID: "d1"},
	}
	conds := model.JSONB{"field": "${user.role}", "operator": "eq", "value": "admin"}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Error("expected true for eq match")
	}
}

func TestEvaluateConditions_Ne(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1", Role: "employee"},
	}
	conds := model.JSONB{"field": "${user.role}", "operator": "ne", "value": "admin"}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Error("expected true for ne match")
	}
}

func TestEvaluateConditions_In(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1", Role: "manager"},
	}
	conds := model.JSONB{
		"field":    "${user.role}",
		"operator": "in",
		"value":    []interface{}{"admin", "manager", "owner"},
	}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Error("expected true for in match")
	}
}

func TestEvaluateConditions_NotIn(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1", Role: "employee"},
	}
	conds := model.JSONB{
		"field":    "${user.role}",
		"operator": "not_in",
		"value":    []interface{}{"admin", "owner"},
	}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Error("expected true for not_in match")
	}
}

func TestEvaluateConditions_Gt(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1", Role: "admin"},
		Object:  &model.Object{Resource: "contract", Attributes: model.JSONB{"amount": float64(15000)}},
	}
	conds := model.JSONB{
		"field":    "${object.amount}",
		"operator": "gt",
		"value":    float64(10000),
	}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Error("expected true for gt (15000 > 10000)")
	}
}

func TestEvaluateConditions_Gte(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1"},
		Object:  &model.Object{Resource: "contract", Attributes: model.JSONB{"amount": float64(10000)}},
	}
	conds := model.JSONB{
		"field":    "${object.amount}",
		"operator": "gte",
		"value":    float64(10000),
	}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Error("expected true for gte (10000 >= 10000)")
	}
}

func TestEvaluateConditions_Lt(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1"},
		Object:  &model.Object{Resource: "contract", Attributes: model.JSONB{"amount": float64(5000)}},
	}
	conds := model.JSONB{
		"field":    "${object.amount}",
		"operator": "lt",
		"value":    float64(10000),
	}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Error("expected true for lt (5000 < 10000)")
	}
}

func TestEvaluateConditions_Lte(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1"},
		Object:  &model.Object{Resource: "contract", Attributes: model.JSONB{"amount": float64(10000)}},
	}
	conds := model.JSONB{
		"field":    "${object.amount}",
		"operator": "lte",
		"value":    float64(10000),
	}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Error("expected true for lte (10000 <= 10000)")
	}
}

func TestEvaluateConditions_SelfOnly(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1"},
		Object:  &model.Object{Resource: "contract", CreatedBy: "u1"},
	}
	conds := model.JSONB{
		"field":    "created_by",
		"operator": "self_only",
	}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Error("expected true for self_only (user is creator)")
	}
}

func TestEvaluateConditions_SelfOnly_Denied(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1"},
		Object:  &model.Object{Resource: "contract", CreatedBy: "u2"},
	}
	conds := model.JSONB{
		"field":    "created_by",
		"operator": "self_only",
	}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Error("expected false for self_only (user is not creator)")
	}
}

func TestEvaluateConditions_MultipleConditions(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1", Role: "manager", DepartmentID: "d1"},
	}
	conds := model.JSONB{
		"conditions": []interface{}{
			map[string]interface{}{"field": "${user.role}", "operator": "eq", "value": "manager"},
			map[string]interface{}{"field": "${user.department_id}", "operator": "eq", "value": "d1"},
		},
	}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Error("expected true when all conditions pass")
	}
}

func TestEvaluateConditions_MultipleConditions_OneFails(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1", Role: "employee", DepartmentID: "d1"},
	}
	conds := model.JSONB{
		"conditions": []interface{}{
			map[string]interface{}{"field": "${user.role}", "operator": "eq", "value": "manager"},
			map[string]interface{}{"field": "${user.department_id}", "operator": "eq", "value": "d1"},
		},
	}
	ok, err := EvaluateConditions(conds, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Error("expected false when one condition fails")
	}
}

func TestABACEvaluate_MissingSubject(t *testing.T) {
	e := NewABACEvaluator()
	ctx := &model.PermissionContext{
		Object: &model.Object{Resource: "contract"},
	}
	dec, err := e.Evaluate(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if dec.Allowed {
		t.Error("expected denied when subject is nil")
	}
}

func TestResolveFieldValue_ObjectAttributes(t *testing.T) {
	ctx := &model.PermissionContext{
		Subject: &model.Subject{UserID: "u1"},
		Object: &model.Object{
			Resource:     "contract",
			OwnerID:      "owner-1",
			DepartmentID: "dept-1",
			Attributes:   model.JSONB{"amount": float64(5000), "status": "active"},
		},
	}
	tests := []struct {
		field    string
		expected string
	}{
		{"${object.owner_id}", "owner-1"},
		{"${object.department_id}", "dept-1"},
		{"${object.amount}", "5000"},
		{"${object.status}", "active"},
	}
	for _, tt := range tests {
		result := resolveFieldValue(tt.field, ctx)
		if result != tt.expected {
			t.Errorf("resolveFieldValue(%s) = %s, want %s", tt.field, result, tt.expected)
		}
	}
}
