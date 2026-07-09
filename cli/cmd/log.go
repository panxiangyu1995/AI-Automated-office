package cmd

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/spf13/cobra"

	"github.com/ai-office/cli/internal/olog"
)

func newLogCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "log",
		Short: "操作日志管理（列出/查看）",
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "列出所有日志文件",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runLogList()
		},
	})

	showCmd := &cobra.Command{
		Use:   "show",
		Short: "查看操作日志",
		RunE: func(cmd *cobra.Command, args []string) error {
			date, _ := cmd.Flags().GetString("date")
			last, _ := cmd.Flags().GetInt("last")
			return runLogShow(date, last)
		},
	}
	showCmd.Flags().String("date", "", "指定日期 (YYYY-MM-DD)")
	showCmd.Flags().Int("last", 0, "显示最近 N 条操作")

	cmd.AddCommand(showCmd)

	return cmd
}

func runLogList() error {
	files, err := olog.ListLogFiles()
	if err != nil {
		return err
	}
	if len(files) == 0 {
		fmt.Println("无操作日志")
		return nil
	}
	fmt.Println("操作日志文件:")
	for _, f := range files {
		fmt.Printf("  %s\n", f)
	}
	fmt.Printf("\n日志目录: %s\n", olog.LogDir())
	return nil
}

func runLogShow(date string, last int) error {
	if date == "" || date == "today" {
		date = time.Now().Format("2006-01-02")
	}

	entries, err := olog.ReadByDate(date)
	if err != nil {
		return err
	}
	return printEntries(entries, last)
}

func printEntries(entries []olog.Entry, last int) error {
	if len(entries) == 0 {
		fmt.Println("无操作记录")
		return nil
	}

	if last > 0 && last < len(entries) {
		entries = entries[len(entries)-last:]
	}

	for _, e := range entries {
		line, err := json.Marshal(e)
		if err != nil {
			continue
		}
		fmt.Println(string(line))
	}
	return nil
}
