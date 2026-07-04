package cmd

import (
	"fmt"
	"time"

	"github.com/spf13/cobra"
)

func newPollCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "poll",
		Short: "消息轮询（启动轮询服务）",
		Long: `启动消息轮询服务，每 60 秒轮询一次未读消息。
使用 ao-cli poll start 启动轮询。
使用 Ctrl+C 停止轮询。`,
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "start",
		Short: "启动消息轮询",
		RunE: func(cmd *cobra.Command, args []string) error {
			interval := 60
			fmt.Printf("🔁 消息轮询已启动 (每 %d 秒轮询一次)\n", interval)
			fmt.Println("按 Ctrl+C 停止")

			ticker := time.NewTicker(time.Duration(interval) * time.Second)
			defer ticker.Stop()

			for range ticker.C {
				if err := pollMessages(); err != nil {
					fmt.Printf("⚠️ 轮询失败: %v\n", err)
				}
			}
			return nil
		},
	})

	return cmd
}

func pollMessages() error {
	// TODO: 实现消息轮询逻辑
	// 1. 从 config 获取 token
	// 2. 调用 API /api/v1/messages?unread=true
	// 3. 处理新消息
	return nil
}
