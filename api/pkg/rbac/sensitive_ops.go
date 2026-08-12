package rbac

type SensitiveOpPolicy struct {
	RequireReapproval bool
	RequireDualVerify bool
	MaxAmountNoVerify float64
}

var sensitiveOpPolicies = map[string]SensitiveOpPolicy{
	"contract_amount_change": {RequireReapproval: true, MaxAmountNoVerify: 0},
	"payment_approval":       {RequireDualVerify: true, MaxAmountNoVerify: 10000},
	"contract_terminate":     {RequireDualVerify: true, MaxAmountNoVerify: 0},
	"employee_role_change":   {RequireReapproval: true, MaxAmountNoVerify: 0},
}

func GetSensitiveOpPolicy(op string) (SensitiveOpPolicy, bool) {
	p, ok := sensitiveOpPolicies[op]
	return p, ok
}

func RequiresReapproval(op string) bool {
	p, ok := sensitiveOpPolicies[op]
	if !ok {
		return false
	}
	return p.RequireReapproval
}

func RequiresDualVerify(op string) bool {
	p, ok := sensitiveOpPolicies[op]
	if !ok {
		return false
	}
	return p.RequireDualVerify
}
