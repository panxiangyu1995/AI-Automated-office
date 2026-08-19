package cmd

import (
	"fmt"
	"os"
	"os/signal"
	"os/user"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/poller"
)

func newPollCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "poll",
		Short: "消息轮询（启动/停止轮询服务）",
		Long: `管理消息轮询服务。
使用 ao-cli poll start 启动轮询（间隔与自适应范围可配置）。
使用 ao-cli poll stop 或 Ctrl+C 停止轮询。`,
	}

	start := &cobra.Command{
		Use:   "start",
		Short: "启动消息轮询（自适应间隔，默认 30s）",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("not logged in, run 'ao-cli auth login' first: %w", err)
			}

			minInterval := 10 * time.Second
			maxInterval := 300 * time.Second

			interval, _ := cmd.Flags().GetInt("interval")
			if interval <= 0 {
				interval = cfg.Poll.Interval
			}
			if interval <= 0 {
				interval = 30
			}
			initial := time.Duration(interval) * time.Second
			if initial < minInterval {
				initial = minInterval
			}
			if initial > maxInterval {
				initial = maxInterval
			}

			if err := writePidFile(); err != nil {
				fmt.Fprintf(os.Stderr, "warning: write pid file failed: %v\n", err)
			}

			fmt.Printf("消息轮询已启动 (间隔 %s, 自适应 %s~%s)\n", initial, minInterval, maxInterval)
			fmt.Println("按 Ctrl+C 或运行 ao-cli poll stop 停止")

			cursorPath := poller.CursorPath(cfg)

			p := poller.NewAdaptive(minInterval, maxInterval, initial, func() (int, error) {
				return poller.CheckAndNotify(cfg, cursorPath)
			})

			sigCh := make(chan os.Signal, 1)
			signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

			done := make(chan struct{})
			go p.Start()
			go func() {
				<-sigCh
				p.Stop()
				close(done)
			}()
			<-done

			_ = os.Remove(pidPath())
			fmt.Println("消息轮询已停止")
			return nil
		},
	}
	start.Flags().Int("interval", 0, "轮询间隔秒数（覆盖配置，默认 30）")

	stop := &cobra.Command{
		Use:   "stop",
		Short: "停止消息轮询",
		RunE: func(cmd *cobra.Command, args []string) error {
			data, err := os.ReadFile(pidPath())
			if err != nil {
				return fmt.Errorf("未找到运行中的轮询服务: %w", err)
			}
			pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
			if err != nil {
				return fmt.Errorf("无效的 pid 文件内容: %w", err)
			}
			proc, err := os.FindProcess(pid)
			if err != nil {
				return fmt.Errorf("查找进程失败: %w", err)
			}
			if err := proc.Signal(syscall.SIGINT); err != nil {
				return fmt.Errorf("发送停止信号失败: %w", err)
			}
			_ = os.Remove(pidPath())
			fmt.Println("已向轮询进程发送停止信号")
			return nil
		},
	}

	cmd.AddCommand(start)
	cmd.AddCommand(stop)

	return cmd
}

func pidPath() string {
	home := homeDir()
	return filepath.Join(home, ".ai-office-cli", "poll.pid")
}

func writePidFile() error {
	home := homeDir()
	dir := filepath.Join(home, ".ai-office-cli")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, "poll.pid"), []byte(strconv.Itoa(os.Getpid())), 0600)
}

func homeDir() string {
	if h, err := os.UserHomeDir(); err == nil && h != "" {
		return h
	}
	if u, err := user.Current(); err == nil && u.HomeDir != "" {
		return u.HomeDir
	}
	return "."
}