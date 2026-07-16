package poller

import (
	"encoding/json"
	"fmt"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
	"github.com/panxiangyu1995/AI-Automated-office/cli/pkg/api_client"
)

type MarkReadResult struct {
	Message   string `json:"message"`
	MarkedCount int    `json:"marked_count,omitempty"`
}

func MarkAsRead(cfg *config.Config, messageID string) error {
	cfg, err := RefreshTokenIfNeeded(cfg)
	if err != nil {
		return err
	}

	client := api_client.NewAPIClient(cfg.ServerURL)
	client.SetToken(cfg.Token)
	if cfg.EnterpriseID != "" {
		client.SetEnterpriseID(cfg.EnterpriseID)
	}
	if cfg.HMACSecret != "" {
		client.SetHMACSecret(cfg.HMACSecret)
	}

	_, err = client.Post(fmt.Sprintf("/api/v1/enterprises/%s/messages/%s/read", cfg.EnterpriseID, messageID), nil)
	return err
}

func BatchMarkAsReadResult(cfg *config.Config, messageIDs []string) (*MarkReadResult, error) {
	if len(messageIDs) == 0 {
		return &MarkReadResult{MarkedCount: 0}, nil
	}

	cfg, err := RefreshTokenIfNeeded(cfg)
	if err != nil {
		return nil, err
	}

	client := api_client.NewAPIClient(cfg.ServerURL)
	client.SetToken(cfg.Token)
	if cfg.EnterpriseID != "" {
		client.SetEnterpriseID(cfg.EnterpriseID)
	}
	if cfg.HMACSecret != "" {
		client.SetHMACSecret(cfg.HMACSecret)
	}

	payload := map[string]interface{}{
		"message_ids": messageIDs,
	}

	result, err := client.Post(fmt.Sprintf("/api/v1/enterprises/%s/messages/read", cfg.EnterpriseID), payload)
	if err != nil {
		return nil, err
	}

	var res MarkReadResult
	if err := json.Unmarshal(result, &res); err != nil {
		return nil, fmt.Errorf("parse response failed: %w", err)
	}

	return &res, nil
}
