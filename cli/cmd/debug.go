//go:build debug

package cmd

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/debug"
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/olog"
	"github.com/panxiangyu1995/AI-Automated-office/cli/pkg/api_client"
)

func newDebugCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "debug",
		Short: "调试工具（查询日志、Mock API、注入测试数据）",
	}

	cmd.AddCommand(newDebugLogsCmd())
	cmd.AddCommand(newDebugStubCmd())
	cmd.AddCommand(newDebugSeedCmd())
	cmd.AddCommand(newDebugServeCmd())

	return cmd
}

func newDebugLogsCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "logs",
		Short: "查询运行日志",
		RunE: func(cmd *cobra.Command, args []string) error {
			remote, _ := cmd.Flags().GetBool("remote")
			local, _ := cmd.Flags().GetBool("local")
			if remote || (!local && !remote) {
				return queryRemoteLogs(cmd)
			}
			return queryLocalLogs(cmd)
		},
	}
	cmd.Flags().Bool("remote", false, "查询 API 服务端日志")
	cmd.Flags().Bool("local", false, "查询 CLI 本地操作日志")
	cmd.Flags().String("level", "", "日志级别 (debug/info/warn/error)")
	cmd.Flags().String("path", "", "请求路径前缀")
	cmd.Flags().Int("status", 0, "HTTP 状态码")
	cmd.Flags().String("request-id", "", "请求ID")
	cmd.Flags().String("method", "", "HTTP 方法")
	cmd.Flags().String("q", "", "关键词搜索")
	cmd.Flags().String("start", "", "起始时间 (RFC3339)")
	cmd.Flags().String("end", "", "结束时间 (RFC3339)")
	cmd.Flags().Int("page", 1, "页码")
	cmd.Flags().Int("page-size", 50, "每页条数")
	cmd.Flags().String("sort", "desc", "排序 (desc/asc)")
	return cmd
}

func newDebugStubCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "stub",
		Short: "管理 API Mock 桩",
	}

	addCmd := &cobra.Command{
		Use:   "add <method> <path>",
		Short: "注册 Stub",
		Args:  cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			status, _ := cmd.Flags().GetInt("status")
			body, _ := cmd.Flags().GetString("body")
			return addStub(args[0], args[1], status, body)
		},
	}
	addCmd.Flags().Int("status", 200, "响应状态码")
	addCmd.Flags().String("body", "", "响应体 JSON")

	cmd.AddCommand(addCmd)
	cmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "列出活跃 Stub",
		RunE: func(cmd *cobra.Command, args []string) error {
			return listStubs()
		},
	})
	cmd.AddCommand(&cobra.Command{
		Use:   "remove <id>",
		Short: "删除 Stub",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return removeStub(args[0])
		},
	})
	cmd.AddCommand(&cobra.Command{
		Use:   "clear",
		Short: "清除所有 Stub",
		RunE: func(cmd *cobra.Command, args []string) error {
			return clearStubs()
		},
	})

	return cmd
}

func newDebugSeedCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "seed",
		Short: "注入测试日志数据",
		RunE: func(cmd *cobra.Command, args []string) error {
			level, _ := cmd.Flags().GetString("level")
			count, _ := cmd.Flags().GetInt("count")
			path, _ := cmd.Flags().GetString("path")
			return seedLogs(level, count, path)
		},
	}
	cmd.Flags().String("level", "info", "日志级别")
	cmd.Flags().Int("count", 10, "注入条数")
	cmd.Flags().String("path", "/api/v1/test", "请求路径")
	return cmd
}

func newDebugServeCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "serve",
		Short: "启动本地 HTTP 服务暴露 olog 日志",
		RunE: func(cmd *cobra.Command, args []string) error {
			port, _ := cmd.Flags().GetInt("port")
			return debug.StartServe(port)
		},
	}
	cmd.Flags().Int("port", 18080, "监听端口")
	return cmd
}

func debugAPIClient(cmd *cobra.Command) (*api_client.APIClient, error) {
	serverURL := ""
	if cmd != nil {
		serverURL = getFlagString(cmd, "server")
	}
	if serverURL == "" {
		cfg, err := config.Load()
		if err != nil {
			return nil, fmt.Errorf("not logged in: %w", err)
		}
		serverURL = cfg.ServerURL
	}

	client := api_client.NewAPIClient(serverURL)
	cfg, err := config.Load()
	if err == nil {
		client.SetToken(cfg.Token)
		if cfg.EnterpriseID != "" {
			client.SetEnterpriseID(cfg.EnterpriseID)
		}
		if cfg.HMACSecret != "" {
			client.SetHMACSecret(cfg.HMACSecret)
		}
	}
	return client, nil
}

func queryRemoteLogs(cmd *cobra.Command) error {
	client, err := debugAPIClient(cmd)
	if err != nil {
		return err
	}

	params := buildLogQueryParams(cmd)
	result, err := client.Get("/api/v1/debug/logs?" + params)
	if err != nil {
		return fmt.Errorf("query failed: %w", err)
	}
	fmt.Println(string(result))
	return nil
}

func queryLocalLogs(cmd *cobra.Command) error {
	date := time.Now().Format("2006-01-02")
	entries, err := olog.ReadByDate(date)
	if err != nil {
		return err
	}

	level, _ := cmd.Flags().GetString("level")
	q, _ := cmd.Flags().GetString("q")
	last, _ := cmd.Flags().GetInt("last")

	var filtered []olog.Entry
	for _, e := range entries {
		if level != "" && !strings.EqualFold(e.Status, level) {
			continue
		}
		if q != "" && !strings.Contains(strings.ToLower(e.Skill), strings.ToLower(q)) && !strings.Contains(strings.ToLower(e.Action), strings.ToLower(q)) {
			continue
		}
		filtered = append(filtered, e)
	}

	if last > 0 && last < len(filtered) {
		filtered = filtered[len(filtered)-last:]
	}

	for _, e := range filtered {
		line, _ := json.Marshal(e)
		fmt.Println(string(line))
	}
	return nil
}

func buildLogQueryParams(cmd *cobra.Command) string {
	var parts []string
	addIf := func(key, val string) {
		if val != "" {
			parts = append(parts, key+"="+val)
		}
	}
	addIfInt := func(key string, val int) {
		if val > 0 {
			parts = append(parts, key+"="+strconv.Itoa(val))
		}
	}

	addIf("level", cmd.Flag("level").Value.String())
	addIf("path", cmd.Flag("path").Value.String())
	addIf("request_id", cmd.Flag("request-id").Value.String())
	addIf("method", cmd.Flag("method").Value.String())
	addIf("q", cmd.Flag("q").Value.String())
	addIf("start_time", cmd.Flag("start").Value.String())
	addIf("end_time", cmd.Flag("end").Value.String())
	addIf("sort", cmd.Flag("sort").Value.String())
	status, _ := cmd.Flags().GetInt("status")
	addIfInt("status", status)
	page, _ := cmd.Flags().GetInt("page")
	addIfInt("page", page)
	pageSize, _ := cmd.Flags().GetInt("page-size")
	addIfInt("page_size", pageSize)

	return strings.Join(parts, "&")
}

func addStub(method, path string, status int, body string) error {
	client, err := debugAPIClient(nil)
	if err != nil {
		return err
	}

	reqBody := map[string]interface{}{
		"method": method,
		"path":   path,
		"status": status,
	}
	if body != "" {
		var parsed interface{}
		if err := json.Unmarshal([]byte(body), &parsed); err == nil {
			reqBody["body"] = parsed
		} else {
			reqBody["body"] = body
		}
	}

	result, err := client.Post("/api/v1/debug/stubs", reqBody)
	if err != nil {
		return fmt.Errorf("add stub failed: %w", err)
	}
	fmt.Println(string(result))
	return nil
}

func listStubs() error {
	client, err := debugAPIClient(nil)
	if err != nil {
		return err
	}

	result, err := client.Get("/api/v1/debug/stubs")
	if err != nil {
		return fmt.Errorf("list stubs failed: %w", err)
	}
	fmt.Println(string(result))
	return nil
}

func removeStub(id string) error {
	client, err := debugAPIClient(nil)
	if err != nil {
		return err
	}

	result, err := client.Delete("/api/v1/debug/stubs/" + id)
	if err != nil {
		return fmt.Errorf("remove stub failed: %w", err)
	}
	fmt.Println(string(result))
	return nil
}

func clearStubs() error {
	client, err := debugAPIClient(nil)
	if err != nil {
		return err
	}

	result, err := client.Delete("/api/v1/debug/stubs")
	if err != nil {
		return fmt.Errorf("clear stubs failed: %w", err)
	}
	fmt.Println(string(result))
	return nil
}

func seedLogs(level string, count int, path string) error {
	client, err := debugAPIClient(nil)
	if err != nil {
		return err
	}

	entries := make([]map[string]interface{}, count)
	for i := 0; i < count; i++ {
		entries[i] = map[string]interface{}{
			"level":  level,
			"msg":    fmt.Sprintf("seeded log entry %d", i+1),
			"method": "GET",
			"path":   path,
			"status": 200,
			"source": "seed",
		}
	}

	result, err := client.Post("/api/v1/debug/logs/seed", entries)
	if err != nil {
		return fmt.Errorf("seed failed: %w", err)
	}
	fmt.Println(string(result))
	return nil
}


