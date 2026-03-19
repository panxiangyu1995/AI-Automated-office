package valueobject

type PermissionSummary struct {
	Roles       []string          `json:"roles"`
	Permissions []string          `json:"permissions"`
	DataScopes  map[string]string `json:"data_scopes,omitempty"`
}

func (p PermissionSummary) HasPermission(code string) bool {
	for _, item := range p.Permissions {
		if item == code {
			return true
		}
	}
	return false
}
