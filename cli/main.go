package main

import (
	"github.com/ai-office/cli/cmd"
	"github.com/ai-office/cli/internal/skill/definitions"
)

func main() {
	definitions.RegisterAll()
	cmd.Execute()
}
