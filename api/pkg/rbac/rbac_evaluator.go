package rbac

import (
	"github.com/ai-office/api/internal/model"
)

type RBACEvaluator struct{}

func NewRBACEvaluator() *RBACEvaluator {
	return &RBACEvaluator{}
}

func (e *RBACEvaluator) Evaluate(ctx *model.PermissionContext) (*model.Decision, error) {
	if ctx.Subject == nil {
		return &model.Decision{Allowed: false, Reason: "missing subject"}, nil
	}

	role := Role(ctx.Subject.Role)
	resource := ""
	if ctx.Object != nil {
		resource = ctx.Object.Resource
	}
	perm := Permission(resource + ":" + ctx.Action)

	if HasPermission(role, perm) {
		return &model.Decision{
			Allowed:       true,
			Reason:        "RBAC role permission granted",
			MatchedRule:   string(role) + " has " + string(perm),
			EvaluatorName: e.GetName(),
		}, nil
	}

	if HasPermission(role, PermAll) {
		return &model.Decision{
			Allowed:       true,
			Reason:        "RBAC wildcard permission granted",
			MatchedRule:   string(role) + " has *",
			EvaluatorName: e.GetName(),
		}, nil
	}

	return &model.Decision{
		Allowed:       false,
		Reason:        "RBAC: role " + string(role) + " lacks permission " + string(perm),
		EvaluatorName: e.GetName(),
	}, nil
}

func (e *RBACEvaluator) GetName() string { return "rbac" }
func (e *RBACEvaluator) Priority() int   { return 1 }
