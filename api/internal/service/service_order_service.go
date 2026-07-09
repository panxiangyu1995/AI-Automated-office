package service

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type ServiceOrderService struct{ db *gorm.DB }

func NewServiceOrderService(db *gorm.DB) *ServiceOrderService { return &ServiceOrderService{db} }

func validServiceTransition(from, to string) bool {
	next, ok := model.ServiceStatusTransitions[from]
	if !ok { return false }
	for _, s := range next { if s == to { return true } }
	return false
}

func (s *ServiceOrderService) Create(eid, customerID, orderType, desc string, contractID string, amount float64) (*model.ServiceOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	so := &model.ServiceOrder{
		OrderNo: fmt.Sprintf("SO-%s", uuid.New().String()[:8]),
		CustomerID: customerID, ContractID: contractID, OrderType: orderType,
		Status: "pending", Description: desc, Amount: amount,
	}
	so.EnterpriseID = id
	if err := s.db.Create(so).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建工单失败: "+err.Error()) }
	return so, nil
}

func (s *ServiceOrderService) ChangeStatus(soID, newStatus string) (*model.ServiceOrder, *apperrors.AppError) {
	id, err := uuid.Parse(soID)
	if err != nil { return nil, apperrors.NewValidationError("service_order_id", "无效") }
	var so model.ServiceOrder
	if err := s.db.Where("id=?", id).First(&so).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("工单不存在") }
	if !validServiceTransition(so.Status, newStatus) {
		return nil, &apperrors.AppError{
			Code: "SVC_INVALID_STATUS_TRANSITION", Message: "非法状态流转", Status: 400,
			Detail: fmt.Sprintf("不能从 %s 转换到 %s", so.Status, newStatus),
		}
	}
	so.Status = newStatus
	if newStatus == "signed" {
		now := so.UpdatedAt
		so.SignedAt = &now
	}
	if err := s.db.Save(&so).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("更新状态失败: "+err.Error()) }
	return &so, nil
}

func (s *ServiceOrderService) Get(soID string) (*model.ServiceOrder, *apperrors.AppError) {
	id, err := uuid.Parse(soID)
	if err != nil { return nil, apperrors.NewValidationError("service_order_id", "无效") }
	var so model.ServiceOrder
	if err := s.db.Where("id=?", id).First(&so).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("工单不存在") }
	return &so, nil
}

func (s *ServiceOrderService) Delete(soID string) *apperrors.AppError {
	id, err := uuid.Parse(soID)
	if err != nil { return apperrors.NewValidationError("service_order_id", "无效") }
	var so model.ServiceOrder
	if err := s.db.Where("id=?", id).First(&so).Error; err != nil { return apperrors.ErrNotFound.WithDetail("工单不存在") }
	if so.Status != "pending" { return apperrors.ErrBadRequest.WithDetail("仅待处理工单可删除") }
	if err := s.db.Delete(&so).Error; err != nil { return apperrors.ErrInternal.WithDetail("删除工单失败") }
	return nil
}

func (s *ServiceOrderService) Quote(soID string, amount float64) (*model.ServiceOrder, *apperrors.AppError) {
	id, err := uuid.Parse(soID)
	if err != nil { return nil, apperrors.NewValidationError("service_order_id", "无效") }
	var so model.ServiceOrder
	if err := s.db.Where("id=?", id).First(&so).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("工单不存在") }
	so.Amount = amount
	if err := s.db.Save(&so).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("报价失败") }
	return &so, nil
}

func (s *ServiceOrderService) List(eid, orderType, status string, p, ps int) ([]model.ServiceOrder, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	var sos []model.ServiceOrder; var total int64
	q := s.db.Model(&model.ServiceOrder{}).Where("enterprise_id=?", id)
	if orderType != "" { q = q.Where("order_type=?", orderType) }
	if status != "" { q = q.Where("status=?", status) }
	if err := q.Count(&total).Error; err != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询工单失败: "+err.Error()) }
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }
	if err := q.Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&sos).Error; err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询工单失败: "+err.Error())
	}
	return sos, total, nil
}

func (s *ServiceOrderService) Sign(soID string) (*model.ServiceOrder, *apperrors.AppError) {
	id, err := uuid.Parse(soID)
	if err != nil {
		return nil, apperrors.NewValidationError("service_order_id", "无效")
	}
	var so model.ServiceOrder
	if err := s.db.Where("id=?", id).First(&so).Error; err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("工单不存在")
	}
	if so.Status != "repairing" {
		return nil, apperrors.ErrBadRequest.WithDetail("仅维修中状态的工单可签收")
	}
	now := so.UpdatedAt
	so.Status = "signed"
	so.SignedAt = &now
	if err := s.db.Save(&so).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("签字确认失败")
	}
	return &so, nil
}

func (s *ServiceOrderService) UploadAttachment(eid, serviceOrderID, originalName, mimeType string, reader io.Reader, size int64) (*model.FileMetadata, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	storageKey := fmt.Sprintf("svc-%s-%s", serviceOrderID[:8], uuid.New().String()[:8])
	ext := filepath.Ext(originalName)
	storagePath := filepath.Join("storage", eid, "service_order", serviceOrderID, storageKey+ext)

	dir := filepath.Dir(storagePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建存储目录失败")
	}

	dst, err := os.Create(storagePath)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建文件失败")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, reader); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("保存文件失败")
	}

	meta := &model.FileMetadata{
		OriginalName: originalName,
		StorageKey:   storageKey,
		StoragePath:  storagePath,
		MimeType:     mimeType,
		FileSize:     size,
		RefType:      "service_order",
		RefID:        serviceOrderID,
	}
	meta.EnterpriseID = id

	if err := s.db.Create(meta).Error; err != nil {
		os.Remove(storagePath)
		return nil, apperrors.ErrInternal.WithDetail("保存文件元数据失败")
	}

	return meta, nil
}

func (s *ServiceOrderService) ListAttachments(serviceOrderID string) ([]model.FileMetadata, *apperrors.AppError) {
	var files []model.FileMetadata
	if err := s.db.Where("ref_type=? AND ref_id=?", "service_order", serviceOrderID).
		Order("created_at DESC").Find(&files).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询附件失败")
	}
	return files, nil
}
