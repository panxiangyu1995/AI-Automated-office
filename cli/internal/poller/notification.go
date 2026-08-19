package poller

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

type NotifyConfig struct {
	Enable      bool   `mapstructure:"enable"`
	OpenclawURL string `mapstructure:"openclaw_url"`
	MarkFile    string `mapstructure:"mark_file"`
}

// osNotifyFunc 是 OS 通知发送函数的注入点，单元测试可替换为 stub。
var osNotifyFunc = sendOSNotification

func SendNotification(title, content string, cfg NotifyConfig) error {
	if !cfg.Enable {
		return nil
	}

	if err := osNotifyFunc(title, content); err != nil {
		return fmt.Errorf("send notification failed: %w", err)
	}

	if cfg.MarkFile != "" {
		if err := writeMarkFile(cfg.MarkFile, title, content); err != nil {
			fmt.Fprintf(os.Stderr, "warning: write mark file failed: %v\n", err)
		}
	}

	if cfg.OpenclawURL != "" {
		go func() {
			if err := triggerOpenclawHook(cfg.OpenclawURL, title, content); err != nil {
				fmt.Fprintf(os.Stderr, "warning: trigger hook failed: %v\n", err)
			}
		}()
	}

	return nil
}

func escapeAppleScript(s string) string {
	r := strings.NewReplacer(`\`, `\\`, `"`, `\"`, `'`, `\'`)
	return r.Replace(s)
}

// osNotifyCommand 返回指定平台发送 OS 通知的主命令（纯函数，供表驱动测试）。
func osNotifyCommand(goos, title, content string) (cmdName string, args []string, err error) {
	switch goos {
	case "darwin":
		safeTitle := escapeAppleScript(title)
		safeContent := escapeAppleScript(content)
		script := fmt.Sprintf(`display notification "%s" with title "%s"`, safeContent, safeTitle)
		return "osascript", []string{"-e", script}, nil
	case "linux":
		return "notify-send", []string{title, content}, nil
	case "windows":
		safeTitle := escapeXML(title)
		safeContent := escapeXML(content)
		script := fmt.Sprintf(`
		[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
		[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
		$template = @"
		<toast>
			<visual>
				<binding template="ToastText02">
					<text id="1">%s</text>
					<text id="2">%s</text>
				</binding>
			</visual>
		</toast>
"@
		$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
		$xml.LoadXml($template)
		$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
		[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("ao-cli").Show($toast)
	`, safeTitle, safeContent)
		return "powershell", []string{"-Command", script}, nil
	default:
		return "", nil, fmt.Errorf("unsupported OS: %s", goos)
	}
}

// linuxNotifyFallbacks 返回 Linux 平台的通知候选命令列表（B4：多路降级）。
func linuxNotifyFallbacks(title, content string) [][]string {
	return [][]string{
		{"notify-send", title, content},
		{"kdialog", "--title", title, "--passivepopup", content, "5"},
	}
}

func sendOSNotification(title, content string) error {
	cmdName, args, err := osNotifyCommand(runtime.GOOS, title, content)
	if err != nil {
		fmt.Printf("[Notification] %s: %s\n", title, content)
		return nil
	}

	if cmdName == "notify-send" {
		var errs []error
		for _, candidate := range linuxNotifyFallbacks(title, content) {
			if err := runNotifyCommand(candidate[0], candidate[1:]); err != nil {
				errs = append(errs, err)
				continue
			}
			return nil
		}
		return errors.Join(errs...)
	}

	return runNotifyCommand(cmdName, args)
}

// runNotifyCommand 执行通知命令；失败时返回携带命令名与退出码的错误（B5）。
func runNotifyCommand(cmdName string, args []string) error {
	cmd := exec.Command(cmdName, args...)
	if err := cmd.Run(); err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			return fmt.Errorf("%s failed (exit %d): %w", cmdName, exitErr.ExitCode(), err)
		}
		return fmt.Errorf("%s failed: %w", cmdName, err)
	}
	return nil
}

func escapeXML(s string) string {
	r := strings.NewReplacer(`<`, `&lt;`, `>`, `&gt;`, `&`, `&amp;`, `"`, `&quot;`, `'`, `&apos;`)
	return r.Replace(s)
}

func writeMarkFile(markFile, title, content string) error {
	data := fmt.Sprintf("[%s]\n%s\n---\n", title, content)
	return os.WriteFile(markFile, []byte(data), 0644)
}

func triggerOpenclawHook(url, title, content string) error {
	payload, err := json.Marshal(map[string]string{"title": title, "body": content})
	if err != nil {
		return fmt.Errorf("marshal hook payload: %w", err)
	}
	cmd := exec.Command("curl", "-s", "-X", "POST", "-H", "Content-Type: application/json", "-d", string(payload), url)
	return cmd.Run()
}