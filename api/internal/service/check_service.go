package service

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type InventoryCheckService struct {
	db      *gorm.DB
	whRepo  repository.WarehouseRepository
	invRepo repository.InventoryRepository
}

func NewInventoryCheckService(db *gorm.DB, whRepo repository.WarehouseRepository, invRepo repository.InventoryRepository) *InventoryCheckService {
	return &InventoryCheckService{db, whRepo, invRepo}
}

func (s *InventoryCheckService) Create(eid, whID, notes string) (*model.InventoryCheck, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	wid, err := uuid.Parse(whID)
	if err != nil { return nil, apperrors.NewValidationError("warehouse_id", "无效") }
	wh, _ := s.whRepo.FindByID(wid)
	if wh == nil { return nil, apperrors.ErrNotFound.WithDetail("仓库不存在") }

	check := &model.InventoryCheck{WarehouseID: whID, CheckNo: "CK-" + uuid.New().String()[:8], Status: "draft", Notes: notes}
	check.EnterpriseID = id
	if err := s.db.Create(check).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建盘点单失败: "+err.Error())
	}
	return check, nil
}

func (s *InventoryCheckService) Complete(checkID string) (*model.InventoryCheck, *apperrors.AppError) {
	cid, err := uuid.Parse(checkID)
	if err != nil { return nil, apperrors.NewValidationError("check_id", "无效") }
	var check model.InventoryCheck
	if err := s.db.Where("id=?", cid).First(&check).Error; err != nil {
		if err == gorm.ErrRecordNotFound { return nil, apperrors.ErrNotFound.WithDetail("盘点单不存在") }
		return nil, apperrors.ErrInternal.WithDetail("查询盘点单失败")
	}
	check.Status = "completed"
	if err := s.db.Save(&check).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("完成盘点失败: "+err.Error())
	}
	return &check, nil
}

func (s *InventoryCheckService) List(eid string, p, ps int) ([]model.InventoryCheck, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	var checks []model.InventoryCheck; var total int64
	q := s.db.Model(&model.InventoryCheck{}).Where("enterprise_id=?", id)
	if err := q.Count(&total).Error; err != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询盘点列表失败: "+err.Error()) }
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }
	if err := q.Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&checks).Error; err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询盘点列表失败: "+err.Error())
	}
	return checks, total, nil
}
