package main

import (
	"embed"
	"log"

	"ao-setup/pkg"
)

//go:embed frontend/*
var frontend embed.FS

func main() {
	app := NewApp()
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}

type App struct {
	// Wails app integration point
}

func NewApp() *App {
	return &App{}
}

func (a *App) Run() error {
	// Placeholder: Wails app will be initialized here
	// Once wails CLI is available, run: wails generate module
	log.Println("ao-setup initialized (Wails app placeholder)")
	return nil
}

func (a *App) DetectAgents() []pkg.AgentInfo {
	return pkg.DetectAgents()
}

func (a *App) DetectOpenCodeDesktop() bool {
	return pkg.DetectOpenCodeDesktop()
}

func (a *App) GetAOCLIExePath() string {
	return pkg.GetAOCLIExePath()
}

func (a *App) GetAOCLISkillsPath() string {
	return pkg.GetAOCLISkillsDir()
}

func (a *App) GetOpenCodeConfigPath() string {
	return pkg.GetOpenCodeConfigPath()
}

func (a *App) GetOpenCodeSkillsPath() string {
	return pkg.GetOpenCodeSkillsPath()
}
