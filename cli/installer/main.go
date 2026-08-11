package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	headerStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("205")).Bold(true)
	dimStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
	greenStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("46")).Bold(true)
	redStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("196"))
	infoStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("12"))
	borderStyle  = lipgloss.NewStyle().Border(lipgloss.RoundedBorder()).Padding(1, 2)
	selectedStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("46")).Bold(true)
)

type model struct {
	step          int
	steps         []string
	installPath   string
	serverURL     string
	addToPath     bool
	installSkills bool
	progress      float64
	status        string
	detectedAgent string
	quitting      bool
}

func initialModel() model {
	home, _ := os.UserHomeDir()
	if home == "" {
		home = os.Getenv("HOME")
	}
	defaultPath := filepath.Join(home, ".ao-cli")
	return model{
		step:    0,
		steps:   []string{"许可协议", "安装目录", "服务器", "选项", "安装", "完成"},
		installPath:   defaultPath,
		serverURL:     "http://localhost:8080",
		addToPath:     true,
		installSkills: true,
	}
}

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			m.quitting = true
			return m, tea.Quit
		case "enter":
			if m.step < 4 {
				m.step++
				if m.step == 4 {
					return m, m.runInstall()
				}
			}
		case " ":
			if m.step == 0 {
				m.step++
			}
		}
	}

	switch m.step {
	case 1:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			if msg.String() == "backspace" && len(m.installPath) > 0 {
				m.installPath = m.installPath[:len(m.installPath)-1]
			} else if msg.String() == "enter" {
				m.step++
			} else if len(msg.String()) == 1 {
				m.installPath += msg.String()
			}
		}
	case 2:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			if msg.String() == "backspace" && len(m.serverURL) > 0 {
				m.serverURL = m.serverURL[:len(m.serverURL)-1]
			} else if msg.String() == "enter" {
				m.step++
			} else if len(msg.String()) == 1 {
				m.serverURL += msg.String()
			}
		}
	case 3:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.String() {
			case "up", "down":
				if msg.String() == "up" {
					if m.addToPath {
						m.addToPath = false
					} else {
						m.addToPath = true
					}
				}
			case "left", "right":
				if msg.String() == "left" {
					if m.addToPath {
						m.addToPath = false
					} else {
						m.addToPath = true
					}
				} else {
					if m.installSkills {
						m.installSkills = false
					} else {
						m.installSkills = true
					}
				}
			case "enter":
				m.step++
			}
		}
	}
	return m, nil
}

func (m model) runInstall() tea.Cmd {
	return func() tea.Msg {
		steps := []struct {
			name  string
			delay int
			fn    func() error
		}{
			{"准备安装环境...", 200, func() error { return nil }},
			{"创建目录结构...", 300, m.createDirs},
			{"安装 ao-cli...", 400, m.installCLI},
			{"配置 ao-cli...", 300, m.configureCLI},
			{"安装技能包...", 500, m.installSkillsPkg},
			{"验证安装...", 300, m.verifyInstall},
			{"安装完成!", 200, func() error { return nil }},
		}

		total := len(steps)
		for i, s := range steps {
			m.status = s.name
			m.progress = float64(i) / float64(total)
			time.Sleep(time.Duration(s.delay) * time.Millisecond)
			if err := s.fn(); err != nil {
				m.status = "安装失败: " + err.Error()
				return nil
			}
		}
		m.progress = 1.0
		m.step = 5
		return nil
	}
}

func (m *model) createDirs() error {
	paths := []string{
		filepath.Join(m.installPath, "bin"),
		filepath.Join(m.installPath, "config"),
		filepath.Join(m.installPath, "skills"),
	}
	for _, p := range paths {
		if err := os.MkdirAll(p, 0755); err != nil {
			return err
		}
	}
	return nil
}

func (m *model) installCLI() error {
	execPath, err := os.Executable()
	if err != nil {
		execPath = os.Args[0]
	}

	src, err := os.Open(execPath)
	if err != nil {
		return fmt.Errorf("cannot open self: %w", err)
	}
	defer src.Close()

	exeName := "ao-cli"
	if runtime.GOOS == "windows" {
		exeName = "ao-cli.exe"
	}

	dst, err := os.Create(filepath.Join(m.installPath, "bin", exeName))
	if err != nil {
		return fmt.Errorf("cannot create destination: %w", err)
	}
	defer dst.Close()

	buf := make([]byte, 32*1024)
	for {
		n, err := src.Read(buf)
		if n > 0 {
			if _, werr := dst.Write(buf[:n]); werr != nil {
				return werr
			}
		}
		if err != nil {
			if err.Error() == "EOF" {
				break
			}
			return err
		}
	}

	return os.Chmod(filepath.Join(m.installPath, "bin", exeName), 0755)
}

func (m *model) configureCLI() error {
	cfg := fmt.Sprintf("server: %s\ninstall_path: %s\n", m.serverURL, m.installPath)
	cfgPath := filepath.Join(m.installPath, "config", "config.yaml")
	return os.WriteFile(cfgPath, []byte(cfg), 0644)
}

func (m *model) installSkillsPkg() error {
	if !m.installSkills {
		return nil
	}
	skillsSrc := filepath.Join(filepath.Dir(os.Args[0]), "..", "skills", "ai-office-api.skill")
	skillsDst := filepath.Join(m.installPath, "skills", "ai-office-api.skill")

	if _, err := os.Stat(skillsSrc); err != nil {
		m.status = "技能包未找到 (跳过)"
		return nil
	}

	src, err := os.Open(skillsSrc)
	if err != nil {
		return err
	}
	defer src.Close()

	dst, err := os.Create(skillsDst)
	if err != nil {
		return err
	}
	defer dst.Close()

	buf := make([]byte, 32*1024)
	for {
		n, err := src.Read(buf)
		if n > 0 {
			if _, werr := dst.Write(buf[:n]); werr != nil {
				return werr
			}
		}
		if err != nil {
			if err.Error() == "EOF" {
				break
			}
			return err
		}
	}
	return nil
}

func (m *model) verifyInstall() error {
	exeName := "ao-cli"
	if runtime.GOOS == "windows" {
		exeName = "ao-cli.exe"
	}
	cliPath := filepath.Join(m.installPath, "bin", exeName)
	if _, err := os.Stat(cliPath); err != nil {
		return fmt.Errorf("cli not found at %s", cliPath)
	}
	return nil
}

func (m model) View() string {
	var s strings.Builder

	s.WriteString("\n")
	s.WriteString(headerStyle.Render("  AI-Automated-office 安装向导  "))
	s.WriteString("\n\n")

	for i, step := range m.steps {
		if i == m.step {
			s.WriteString(fmt.Sprintf("  [%s] %s\n", greenStyle.Render("●"), step))
		} else if i < m.step {
			s.WriteString(fmt.Sprintf("  [✓] %s\n", dimStyle.Render(step)))
		} else {
			s.WriteString(fmt.Sprintf("  [ ] %s\n", dimStyle.Render(step)))
		}
	}

	s.WriteString("\n")
	s.WriteString(strings.Repeat("─", 50))
	s.WriteString("\n\n")

	switch m.step {
	case 0:
		s.WriteString(borderStyle.Render("AGPL-3.0 许可证协议\n\n" +
			"版权所有 (C) 2026 AI-Automated-office\n\n" +
			"本程序是自由软件，您可以按照自由软件基金会发布的 GNU Affero 通用公共许可证第3版\n" +
			"（或根据您的选择，以后版本）的条款重新分发和/或修改它。\n\n" +
			"本程序是为了促进使用而分发的，但不提供任何明示或暗示的保证。\n" +
			"有关更多详细信息，请参阅 GNU Affero GPL 许可证。"))
		s.WriteString("\n\n")
		s.WriteString(dimStyle.Render("按空格键继续..."))

	case 1:
		s.WriteString("安装目录\n\n")
		s.WriteString(fmt.Sprintf("  %s\n\n", m.installPath))
		s.WriteString(dimStyle.Render("（输入新的路径或按 Enter 使用默认路径）"))

	case 2:
		s.WriteString("API 服务器配置\n\n")
		s.WriteString(fmt.Sprintf("  服务器地址: %s\n\n", m.serverURL))
		s.WriteString(dimStyle.Render("（输入服务器 URL，按 Enter 继续）"))

	case 3:
		s.WriteString("安装选项\n\n")
		if m.addToPath {
			s.WriteString(fmt.Sprintf("  [%s] 添加到 PATH\n", greenStyle.Render("●")))
		} else {
			s.WriteString(fmt.Sprintf("  [ ] 添加到 PATH\n"))
		}
		s.WriteString("  （在主目录 ~/.ao-cli 安装，无需管理员权限）\n\n")
		s.WriteString(dimStyle.Render("按 Enter 继续..."))

	case 4:
		s.WriteString(borderStyle.Render(fmt.Sprintf("正在安装... %d%%", int(m.progress*100))))
		s.WriteString("\n\n")
		s.WriteString(m.status)

	case 5:
		s.WriteString(greenStyle.Render("  ✓ 安装成功!\n\n"))
		s.WriteString(fmt.Sprintf("  ao-cli 已安装到: %s\n", m.installPath))
		s.WriteString(fmt.Sprintf("  服务器: %s\n\n", m.serverURL))
		s.WriteString(dimStyle.Render("运行 'ao-cli auth login' 开始使用。"))

	default:
		s.WriteString("未知状态")
	}

	if m.step < 4 {
		s.WriteString("\n\n")
		s.WriteString(dimStyle.Render("Ctrl+C 退出"))
	}

	return s.String()
}

func RunInstaller(ctx context.Context) error {
	p := tea.NewProgram(initialModel(), tea.WithContext(ctx))
	if _, err := p.Run(); err != nil {
		return fmt.Errorf("installer failed: %w", err)
	}
	return nil
}

func main() {
	ctx := context.Background()
	if err := RunInstaller(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
