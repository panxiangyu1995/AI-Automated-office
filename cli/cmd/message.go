package cmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/poller"
)

func newMessageCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "message",
		Short: "消息管理",
	}

	markRead := &cobra.Command{
		Use:   "mark-read",
		Short: "将消息标记为已读（支持单条或批量）",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("not logged in, run 'ao-cli auth login' first: %w", err)
			}

			id, _ := cmd.Flags().GetString("id")
			idsRaw, _ := cmd.Flags().GetString("ids")

			var ids []string
			if id != "" {
				ids = []string{id}
			}
			if idsRaw != "" {
				ids = splitComma(idsRaw)
			}
			if len(ids) == 0 {
				return fmt.Errorf("请通过 --id <消息ID> 或 --ids <id1,id2> 指定消息")
			}

			if len(ids) == 1 {
				if err := poller.MarkAsRead(cfg, ids[0]); err != nil {
					return err
				}
				fmt.Printf("已标记消息 %s 为已读\n", ids[0])
				return nil
			}

			result, err := poller.BatchMarkAsReadResult(cfg, ids)
			if err != nil {
				return err
			}
			fmt.Printf("已批量标记 %d 条消息为已读：%s\n", result.MarkedCount, strings.Join(ids, ", "))
			return nil
		},
	}
	markRead.Flags().String("id", "", "单条消息 ID")
	markRead.Flags().String("ids", "", "批量消息 ID，逗号分隔")

	cmd.AddCommand(markRead)
	return cmd
}

func splitComma(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}