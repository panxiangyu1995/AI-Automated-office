package repository

import (
	"context"

	"cloud-server/internal/module/admin/application/dto"
	"cloud-server/internal/module/admin/domain/entity"

	"github.com/google/uuid"
)

// ImportBatchRepository 导入批次仓储接口
type ImportBatchRepository interface {
	// Create 创建导入批次
	Create(ctx context.Context, batch *entity.ImportBatch) error

	// FindByBatchID 根据批次 ID 查找
	FindByBatchID(ctx context.Context, tenantID uuid.UUID, batchID string) (*entity.ImportBatch, error)

	// FindByID 根据 ID 查找
	FindByID(ctx context.Context, id uuid.UUID) (*entity.ImportBatch, error)

	// Update 更新批次
	Update(ctx context.Context, batch *entity.ImportBatch) error

	// List 列出批次
	List(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*entity.ImportBatch, int64, error)

	// Delete 删除批次
	Delete(ctx context.Context, id uuid.UUID) error

	// GetBatchRows 获取批次的所有行数据
	GetBatchRows(ctx context.Context, batchID uuid.UUID) ([]*entity.ImportRowData, error)

	// SaveReceipt 保存导入回执
	SaveReceipt(ctx context.Context, batchID uuid.UUID, receipt *dto.ImportReceipt) error

	// GetReceipt 获取导入回执
	GetReceipt(ctx context.Context, batchID uuid.UUID) (*dto.ImportReceipt, error)
}

// ImportRowRepository 导入行仓储接口
type ImportRowRepository interface {
	// BatchCreate 批量创建导入行
	BatchCreate(ctx context.Context, rows []*entity.ImportRow) error

	// FindByBatchID 根据批次 ID 查找所有行
	FindByBatchID(ctx context.Context, batchID uuid.UUID) ([]*entity.ImportRow, error)

	// UpdateStatus 更新行状态
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.ImportRowStatus, conflictResult *entity.ConflictResult) error

	// DeleteByBatchID 删除批次的所有行
	DeleteByBatchID(ctx context.Context, batchID uuid.UUID) error
}
