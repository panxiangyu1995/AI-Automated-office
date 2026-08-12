package model

type Subject struct {
	UserID       string `json:"user_id"`
	Role         string `json:"role"`
	DepartmentID string `json:"department_id,omitempty"`
	EnterpriseID string `json:"enterprise_id,omitempty"`
}

type Object struct {
	Resource     string `json:"resource"`
	ID           string `json:"id,omitempty"`
	OwnerID      string `json:"owner_id,omitempty"`
	CreatedBy    string `json:"created_by,omitempty"`
	DepartmentID string `json:"department_id,omitempty"`
	Attributes   JSONB  `json:"attributes,omitempty"`
}

type Env struct {
	Time string `json:"time,omitempty"`
	IP   string `json:"ip,omitempty"`
}

type PermissionContext struct {
	Subject *Subject `json:"subject"`
	Object  *Object  `json:"object"`
	Action  string   `json:"action"`
	Env     *Env     `json:"env,omitempty"`
}

type Decision struct {
	Allowed       bool   `json:"allowed"`
	Deny          bool   `json:"deny,omitempty"`
	Reason        string `json:"reason,omitempty"`
	MatchedRule   string `json:"matched_rule,omitempty"`
	EvaluatorName string `json:"evaluator_name,omitempty"`
}
