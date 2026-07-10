package rbac

import (
	"fmt"
	"strings"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type CustomRuleEvaluator struct {
	rules []CustomRuleEntry
}

type CustomRuleEntry struct {
	Sub    string
	Object string
	Action string
	Effect string
}

func NewCustomRuleEvaluator() *CustomRuleEvaluator {
	return &CustomRuleEvaluator{}
}

func (e *CustomRuleEvaluator) LoadRules(rules []CustomRuleEntry) {
	e.rules = rules
}

func (e *CustomRuleEvaluator) Evaluate(ctx *model.PermissionContext) (*model.Decision, error) {
	if len(e.rules) == 0 {
		return &model.Decision{Allowed: false, Reason: "custom: no rules loaded", EvaluatorName: e.GetName()}, nil
	}

	for _, rule := range e.rules {
		if matchRule(rule, ctx) {
			allowed := rule.Effect == "allow"
			return &model.Decision{
				Allowed:       allowed,
				Deny:          rule.Effect == "deny",
				Reason:        fmt.Sprintf("custom rule: %s %s %s = %s", rule.Sub, rule.Object, rule.Action, rule.Effect),
				MatchedRule:   rule.Sub + "," + rule.Object + "," + rule.Action,
				EvaluatorName: e.GetName(),
			}, nil
		}
	}

	return &model.Decision{Allowed: false, Reason: "custom: no matching rule", EvaluatorName: e.GetName()}, nil
}

func matchRule(rule CustomRuleEntry, ctx *model.PermissionContext) bool {
	if ctx.Subject == nil || ctx.Object == nil {
		return false
	}

	subMatch := rule.Sub == "*" || rule.Sub == ctx.Subject.Role
	objMatch := rule.Object == "*" || rule.Object == ctx.Object.Resource
	actMatch := rule.Action == "*" || rule.Action == ctx.Action

	return subMatch && objMatch && actMatch
}

func ParseCasbinRule(line string) (CustomRuleEntry, bool) {
	parts := strings.Split(strings.TrimSpace(line), ",")
	if len(parts) < 4 {
		return CustomRuleEntry{}, false
	}

	policyType := strings.TrimSpace(parts[0])
	if policyType != "p" {
		return CustomRuleEntry{}, false
	}

	return CustomRuleEntry{
		Sub:    strings.TrimSpace(parts[1]),
		Object: strings.TrimSpace(parts[2]),
		Action: strings.TrimSpace(parts[3]),
		Effect: "allow",
	}, true
}

func (e *CustomRuleEvaluator) GetName() string { return "custom_rule" }
func (e *CustomRuleEvaluator) Priority() int   { return 4 }
