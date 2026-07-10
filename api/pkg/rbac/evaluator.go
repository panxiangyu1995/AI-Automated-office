package rbac

import "github.com/panxiangyu1995/AI-Automated-office/api/internal/model"

type PermissionEvaluator interface {
	Evaluate(ctx *model.PermissionContext) (*model.Decision, error)
	GetName() string
	Priority() int
}

type PermissionFacade struct {
	evaluators []PermissionEvaluator
}

func NewPermissionFacade() *PermissionFacade {
	return &PermissionFacade{}
}

func (f *PermissionFacade) RegisterEvaluator(e PermissionEvaluator) {
	f.evaluators = append(f.evaluators, e)
	for i := len(f.evaluators) - 1; i > 0; i-- {
		if f.evaluators[i].Priority() < f.evaluators[i-1].Priority() {
			f.evaluators[i], f.evaluators[i-1] = f.evaluators[i-1], f.evaluators[i]
		}
	}
}

func (f *PermissionFacade) Evaluate(ctx *model.PermissionContext) (*model.Decision, error) {
	var lastAllow *model.Decision
	for _, e := range f.evaluators {
		decision, err := e.Evaluate(ctx)
		if err != nil {
			continue
		}
		if decision == nil {
			continue
		}
		if decision.Deny {
			return decision, nil
		}
		if decision.Allowed {
			lastAllow = decision
		}
	}
	if lastAllow != nil {
		return lastAllow, nil
	}
	return &model.Decision{
		Allowed: false,
		Reason:  "no evaluator granted permission",
	}, nil
}

func (f *PermissionFacade) GetEvaluators() []PermissionEvaluator {
	return f.evaluators
}
