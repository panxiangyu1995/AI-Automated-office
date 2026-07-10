package main

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/cmd"
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill/definitions"
)

func main() {
	definitions.RegisterAll()
	cmd.Execute()
}
