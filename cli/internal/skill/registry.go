package skill

import "fmt"

type SkillDefinition struct {
	Name        string
	Description string
	Category    string
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
