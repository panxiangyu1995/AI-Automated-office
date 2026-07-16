package poller

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

type NotifyConfig struct {
	Enable      bool   `mapstructure:"enable"`
	OpenclawURL string `mapstructure:"openclaw_url"`
	MarkFile    string `mapstructure:"mark_file"`
}

func SendNotification(title, content string, cfg NotifyConfig) error {
	if !cfg.Enable {
		return nil
	}

	if err := sendOSNotification(title, content); err != nil {
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

func sendOSNotification(title, content string) error {
	switch runtime.GOOS {
	case "darwin":
		script := fmt.Sprintf(`display notification "%s" with title "%s"`, content, title)
		cmd := exec.Command("osascript", "-e", script)
		return cmd.Run()
	case "linux":
		cmd := exec.Command("notify-send", title, content)
		return cmd.Run()
	case "windows":
		return sendWindowsToast(title, content)
	default:
		fmt.Printf("[Notification] %s: %s\n", title, content)
		return nil
	}
}

func sendWindowsToast(title, content string) error {
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
	`, title, content)
	cmd := exec.Command("powershell", "-Command", script)
	return cmd.Run()
}

func writeMarkFile(markFile, title, content string) error {
	data := fmt.Sprintf("[%s]\n%s\n---\n", title, content)
	return os.WriteFile(markFile, []byte(data), 0644)
}

func triggerOpenclawHook(url, title, content string) error {
	payload := fmt.Sprintf(`{"title":"%s","body":"%s"}`, title, content)
	cmd := exec.Command("curl", "-s", "-X", "POST", "-H", "Content-Type: application/json", "-d", payload, url)
	return cmd.Run()
}
