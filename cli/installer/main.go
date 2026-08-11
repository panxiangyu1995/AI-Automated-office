package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"ao-setup/pkg"
)

var (
	headerStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("205")).Bold(true)
	dimStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
	greenStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("46")).Bold(true)
	redStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("196")).Bold(true)
	borderStyle = lipgloss.NewStyle().Border(lipgloss.RoundedBorder()).Padding(1, 2)
)

type optionState struct {
	label string
	on    bool
}

type model struct {
	step        int
	steps       []string
	installPath string
	serverURL   string
	cursor      int
	options     []optionState
	progress    float64
	status      string
	installCh   chan installMsg
	quitting    bool
}

type installMsg struct {
	status   string
	progress float64
	done     bool
	failed   bool
}

type installStart struct {
	ch chan installMsg
}

func initialModel() model {
	return model{
		step:        0,
		steps:       []string{"许可协议", "安装目录", "服务器", "选项", "安装", "完成"},
		installPath: pkg.DefaultInstallPath(),
		serverURL:   "http://localhost:8080",
		options: []optionState{
			{label: "添加到 PATH（推荐）", on: true},
			{label: "安装技能包（推荐）", on: true},
		},
	}
}

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			m.quitting = true
			return m, tea.Quit
		case "q":
			if m.step == 5 {
				m.quitting = true
				return m, tea.Quit
			}
		case "enter":
			switch m.step {
			case 0, 1, 2:
				m.step++
			case 3:
				m.step++
				return m, m.runInstall()
			case 4:
				if m.failed() {
					m.step = 3
					m.status = ""
					m.progress = 0
				}
			case 5:
				m.quitting = true
				return m, tea.Quit
			}
		case " ":
			switch m.step {
			case 0:
				m.step++
			case 3:
				m.options[m.cursor].on = !m.options[m.cursor].on
			}
		case "up", "down":
			if m.step == 3 {
				m.cursor = (m.cursor + 1) % len(m.options)
			}
		case "backspace":
			switch m.step {
			case 1:
				if len(m.installPath) > 0 {
					m.installPath = m.installPath[:len(m.installPath)-1]
				}
			case 2:
				if len(m.serverURL) > 0 {
					m.serverURL = m.serverURL[:len(m.serverURL)-1]
				}
			}
		default:
			if len(msg.String()) == 1 {
				switch m.step {
				case 1:
					m.installPath += msg.String()
				case 2:
					m.serverURL += msg.String()
				}
			}
		}
	case installStart:
		m.installCh = msg.ch
		return m, waitForInstall(msg.ch)
	case installMsg:
		m.status = msg.status
		if msg.progress > 0 {
			m.progress = msg.progress
		}
		if msg.failed {
			m.status = msg.status
			m.progress = 0
			return m, nil
		}
		if msg.done {
			m.step = 5
			m.progress = 1.0
			return m, nil
		}
		return m, waitForInstall(m.installCh)
	}
	return m, nil
}

func (m model) failed() bool {
	return strings.HasPrefix(m.status, "安装失败")
}

func (m model) runInstall() tea.Cmd {
	opts := pkg.InstallOptions{
		InstallPath:   m.installPath,
		ServerURL:     m.serverURL,
		InstallSkills: m.options[1].on,
		AddToPath:     m.options[0].on,
	}
	return func() tea.Msg {
		ch := make(chan installMsg, 8)
		go func() {
			defer close(ch)
			err := pkg.Install(opts, func(stage string, progress float64) {
				ch <- installMsg{status: stage, progress: progress}
			})
			if err != nil {
				ch <- installMsg{status: "安装失败: " + err.Error(), failed: true}
				return
			}
			ch <- installMsg{status: "安装完成", progress: 1.0, done: true}
		}()
		return installStart{ch: ch}
	}
}

func waitForInstall(ch chan installMsg) tea.Cmd {
	return func() tea.Msg {
		msg, ok := <-ch
		if !ok {
			return nil
		}
		return msg
	}
}

func (m model) View() string {
	var s strings.Builder

	s.WriteString("\n")
	s.WriteString(headerStyle.Render("  AI-Automated-office 安装向导  "))
	s.WriteString("\n\n")

	for i, step := range m.steps {
		switch {
		case i == m.step:
			s.WriteString(fmt.Sprintf("  [%s] %s\n", greenStyle.Render("●"), step))
		case i < m.step:
			s.WriteString(fmt.Sprintf("  [✓] %s\n", dimStyle.Render(step)))
		default:
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
		s.WriteString(dimStyle.Render("按空格键接受并继续..."))

	case 1:
		s.WriteString("安装目录\n\n")
		s.WriteString(fmt.Sprintf("  当前: %s\n\n", m.installPath))
		s.WriteString(dimStyle.Render("（输入新的路径或按 Enter 使用当前路径）"))

	case 2:
		s.WriteString("API 服务器配置\n\n")
		s.WriteString(fmt.Sprintf("  服务器地址: %s\n\n", m.serverURL))
		s.WriteString(dimStyle.Render("（输入服务器 URL，按 Enter 继续）"))

	case 3:
		s.WriteString("安装选项\n\n")
		for i, opt := range m.options {
			marker := " "
			if m.cursor == i {
				marker = greenStyle.Render("▸")
			}
			check := " "
			if opt.on {
				check = greenStyle.Render("●")
			}
			s.WriteString(fmt.Sprintf("  %s [%s] %s\n", marker, check, opt.label))
		}
		s.WriteString("\n")
		s.WriteString(dimStyle.Render("（↑/↓ 移动，空格切换，Enter 开始安装）"))

	case 4:
		s.WriteString(borderStyle.Render(fmt.Sprintf("正在安装... %d%%", int(m.progress*100))))
		s.WriteString("\n\n")
		if m.failed() {
			s.WriteString(redStyle.Render(m.status))
			s.WriteString("\n\n")
			s.WriteString(dimStyle.Render("（按 Enter 返回选项重新配置，Ctrl+C 退出）"))
		} else {
			s.WriteString(m.status)
		}

	case 5:
		s.WriteString(greenStyle.Render("  ✓ 安装成功!\n\n"))
		s.WriteString(fmt.Sprintf("  ao-cli 已安装到: %s\n", m.installPath))
		s.WriteString(fmt.Sprintf("  服务器: %s\n\n", m.serverURL))
		s.WriteString(dimStyle.Render("运行 'ao-cli auth login' 开始使用。"))
		s.WriteString("\n\n")
		s.WriteString(dimStyle.Render("按 Enter 或 q 退出"))

	default:
		s.WriteString("未知状态")
	}

	if m.step < 4 {
		s.WriteString("\n\n")
		s.WriteString(dimStyle.Render("Ctrl+C 退出"))
	}

	return s.String()
}

// RunInstaller 启动 TUI 安装向导。opts 可注入输入流/日志等（测试用）。
func RunInstaller(ctx context.Context, opts ...tea.ProgramOption) error {
	p := tea.NewProgram(initialModel(), opts...)
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
