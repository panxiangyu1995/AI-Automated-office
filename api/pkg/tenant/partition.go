package tenant

import (
	"fmt"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

func CreateYearlyPartition(db *gorm.DB, schema, tableName string, year int) error {
	if err := validateIdentifier(schema, "schema"); err != nil {
		return err
	}
	if err := validateIdentifier(tableName, "table"); err != nil {
		return err
	}
	partitionName := fmt.Sprintf("%s_%s_y%d", schema, tableName, year)
	if err := validateIdentifier(partitionName, "partition"); err != nil {
		return err
	}
	startDate := fmt.Sprintf("%d-01-01", year)
	endDate := fmt.Sprintf("%d-01-01", year+1)

	sql := fmt.Sprintf(
		"CREATE TABLE IF NOT EXISTS %s PARTITION OF %s.%s FOR VALUES FROM ('%s') TO ('%s')",
		pq.QuoteIdentifier(partitionName), pq.QuoteIdentifier(schema), pq.QuoteIdentifier(tableName), startDate, endDate,
	)

	if err := db.Exec(sql).Error; err != nil {
		return fmt.Errorf("failed to create partition %s: %w", partitionName, err)
	}
	return nil
}

func CreatePartitionsForYear(db *gorm.DB, schema string, tables []string, year int) error {
	for _, table := range tables {
		if err := CreateYearlyPartition(db, schema, table, year); err != nil {
			return err
		}
	}
	return nil
}
