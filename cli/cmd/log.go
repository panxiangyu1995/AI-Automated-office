package cmd

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/olog"
)

func newLogCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "log",
		Short: "操作日志管理（列出/查看/归档/清理）",
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

	archiveCmd := &cobra.Command{
		Use:   "archive",
		Short: "归档旧日志文件（压缩并移至archive目录）",
		RunE: func(cmd *cobra.Command, args []string) error {
			days, _ := cmd.Flags().GetInt("days")
			return runLogArchive(days)
		},
	}
	archiveCmd.Flags().Int("days", 30, "归档多少天前的日志")

	cleanCmd := &cobra.Command{
		Use:   "clean",
		Short: "清理已归档的过期日志文件",
		RunE: func(cmd *cobra.Command, args []string) error {
			days, _ := cmd.Flags().GetInt("days")
			return runLogClean(days)
		},
	}
	cleanCmd.Flags().Int("days", 60, "清理多少天前的归档日志")

	cmd.AddCommand(showCmd)
	cmd.AddCommand(archiveCmd)
	cmd.AddCommand(cleanCmd)

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

func runLogArchive(days int) error {
	fmt.Printf("归档 %d 天前的日志文件...\n", days)
	if err := olog.ArchiveOldLogs(olog.LogDir(), days); err != nil {
		return fmt.Errorf("归档失败: %w", err)
	}
	fmt.Println("归档完成")
	return nil
}

func runLogClean(days int) error {
	archiveDir := olog.LogDir() + "/archive"
	fmt.Printf("清理 %d 天前的归档日志...\n", days)

	cleanCutoff := time.Now().AddDate(0, 0, -days)
	entries, err := olog.ListLogFiles()
	if err != nil {
		return err
	}
	_ = entries

	fmt.Printf("检查归档目录: %s\n", archiveDir)
	fmt.Printf("清理截止日期: %s\n", cleanCutoff.Format("2006-01-02"))

	if err := olog.ArchiveOldLogs(olog.LogDir(), days); err != nil {
		return fmt.Errorf("清理失败: %w", err)
	}
	fmt.Println("清理完成")
	return nil
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
