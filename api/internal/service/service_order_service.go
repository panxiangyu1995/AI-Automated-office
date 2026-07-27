package service

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type ServiceOrderService struct{ repo repository.ServiceOrderRepository }

func NewServiceOrderService(repo repository.ServiceOrderRepository) *ServiceOrderService {
	return &ServiceOrderService{repo}
}

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
		CustomerID: customerID, ContractID: strPtr(contractID), OrderType: orderType,
		Status: "pending", Description: desc, Amount: amount,
	}
	so.EnterpriseID = id
	if err := s.repo.Create(so); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建工单失败: "+err.Error()) }
	return so, nil
}

func (s *ServiceOrderService) ChangeStatus(eid, soID, newStatus string) (*model.ServiceOrder, *apperrors.AppError) {
	id, err := uuid.Parse(soID)
	if err != nil { return nil, apperrors.NewValidationError("service_order_id", "无效") }
	entID, _ := uuid.Parse(eid)
	so, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询工单失败") }
	if so == nil { return nil, apperrors.ErrNotFound.WithDetail("工单不存在") }
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
	if err := s.repo.Save(so); err != nil { return nil, apperrors.ErrInternal.WithDetail("更新状态失败: "+err.Error()) }
	return so, nil
}

func (s *ServiceOrderService) Get(eid, soID string) (*model.ServiceOrder, *apperrors.AppError) {
	id, err := uuid.Parse(soID)
	if err != nil { return nil, apperrors.NewValidationError("service_order_id", "无效") }
	entID, _ := uuid.Parse(eid)
	so, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询工单失败") }
	if so == nil { return nil, apperrors.ErrNotFound.WithDetail("工单不存在") }
	return so, nil
}

func (s *ServiceOrderService) Delete(eid, soID string) *apperrors.AppError {
	id, err := uuid.Parse(soID)
	if err != nil { return apperrors.NewValidationError("service_order_id", "无效") }
	entID, _ := uuid.Parse(eid)
	so, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return apperrors.ErrInternal.WithDetail("查询工单失败") }
	if so == nil { return apperrors.ErrNotFound.WithDetail("工单不存在") }
	if so.Status != "pending" { return apperrors.ErrBadRequest.WithDetail("仅待处理工单可删除") }
	if err := s.repo.Delete(so, so.EnterpriseID); err != nil { return apperrors.ErrInternal.WithDetail("删除工单失败") }
	return nil
}

func (s *ServiceOrderService) Quote(eid, soID string, amount float64) (*model.ServiceOrder, *apperrors.AppError) {
	id, err := uuid.Parse(soID)
	if err != nil { return nil, apperrors.NewValidationError("service_order_id", "无效") }
	entID, _ := uuid.Parse(eid)
	so, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询工单失败") }
	if so == nil { return nil, apperrors.ErrNotFound.WithDetail("工单不存在") }
	so.Amount = amount
	if err := s.repo.Save(so); err != nil { return nil, apperrors.ErrInternal.WithDetail("报价失败") }
	return so, nil
}

func (s *ServiceOrderService) List(eid, orderType, status string, p, ps int) ([]model.ServiceOrder, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	sos, total, dbErr := s.repo.List(id, orderType, status, p, ps)
	if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询工单失败: "+dbErr.Error()) }
	return sos, total, nil
}

func (s *ServiceOrderService) Sign(eid, soID string) (*model.ServiceOrder, *apperrors.AppError) {
	id, err := uuid.Parse(soID)
	if err != nil {
		return nil, apperrors.NewValidationError("service_order_id", "无效")
	}
	entID, _ := uuid.Parse(eid)
	so, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询工单失败")
	}
	if so == nil {
		return nil, apperrors.ErrNotFound.WithDetail("工单不存在")
	}
	if so.Status != "completed" {
		return nil, apperrors.ErrBadRequest.WithDetail("仅已完成状态的工单可签字确认")
	}
	now := so.UpdatedAt
	so.Status = "signed"
	so.SignedAt = &now
	if err := s.repo.Save(so); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("签字确认失败")
	}
	return so, nil
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
		RefID:        strPtr(serviceOrderID),
	}
	meta.EnterpriseID = id

	if err := s.repo.CreateFileMetadata(meta); err != nil {
		os.Remove(storagePath)
		return nil, apperrors.ErrInternal.WithDetail("保存文件元数据失败")
	}

	return meta, nil
}

func (s *ServiceOrderService) ListAttachments(serviceOrderID string) ([]model.FileMetadata, *apperrors.AppError) {
	files, err := s.repo.ListFileMetadata("service_order", serviceOrderID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询附件失败")
	}
	return files, nil
}
