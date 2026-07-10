package rbac

import (
	"fmt"
	"time"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type AttributeEvaluator struct{}

func NewAttributeEvaluator() *AttributeEvaluator {
	return &AttributeEvaluator{}
}

func (e *AttributeEvaluator) Evaluate(ctx *model.PermissionContext) (*model.Decision, error) {
	if ctx.Env == nil {
		return &model.Decision{Allowed: true, Reason: "no env restrictions", EvaluatorName: e.GetName()}, nil
	}

	if ctx.Env.Time != "" {
		now := time.Now()
		if t, err := time.Parse("15:04", ctx.Env.Time); err == nil {
			if now.Hour() < t.Hour() || (now.Hour() == t.Hour() && now.Minute() < t.Minute()) {
				return &model.Decision{
					Allowed:       false,
					Reason:        fmt.Sprintf("attribute: time restriction, current %02d:%02d before %s", now.Hour(), now.Minute(), ctx.Env.Time),
					EvaluatorName: e.GetName(),
				}, nil
			}
		}
	}

	return &model.Decision{Allowed: true, Reason: "attribute: all conditions passed", EvaluatorName: e.GetName()}, nil
}

func (e *AttributeEvaluator) GetName() string { return "attribute" }
func (e *AttributeEvaluator) Priority() int   { return 3 }
