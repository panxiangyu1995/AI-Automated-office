package skill

import "fmt"

type ParamDef struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Required    bool   `json:"required"`
	Default     string `json:"default,omitempty"`
	Description string `json:"description,omitempty"`
}

type ActionDef struct {
	Endpoint string     `json:"endpoint"`
	Method   string     `json:"method"`
	Params   []ParamDef `json:"params,omitempty"`
}

type SkillDefinition struct {
	Name        string               `json:"name"`
	Description string               `json:"description"`
	Category    string               `json:"category"`
	APIEndpoint string               `json:"api_endpoint,omitempty"`
	Method      string               `json:"method,omitempty"`
	Parameters  []ParamDef            `json:"parameters,omitempty"`
	Actions     map[string]ActionDef `json:"actions,omitempty"`
}

var registry []SkillDefinition

func Register(s SkillDefinition) {
	registry = append(registry, s)
}

func List() []SkillDefinition {
	return registry
}

func Get(name string) (*SkillDefinition, error) {
	for _, s := range registry {
		if s.Name == name {
			return &s, nil
		}
	}
	return nil, fmt.Errorf("skill %q not found", name)
}

func Clear() {
	registry = nil
}
