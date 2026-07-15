package repository

import (
	"fmt"

	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/tenant"
)

func (m *schemaManager) CreateSchema(enterpriseID string) error {
	if err := tenant.CreateSchema(m.db, enterpriseID); err != nil {
		return fmt.Errorf("创建企业Schema失败: %w", err)
	}
	return nil
}

func (m *schemaManager) RunMigrations(enterpriseID string) error {
	if err := tenant.RunMigrations(m.db, enterpriseID); err != nil {
		return fmt.Errorf("运行数据库迁移失败: %w", err)
	}
	return nil
}
