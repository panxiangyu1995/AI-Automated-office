package service

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type PaymentRequestService struct{ db *gorm.DB }

func NewPaymentRequestService(db *gorm.DB) *PaymentRequestService { return &PaymentRequestService{db} }

func (s *PaymentRequestService) genNo() string {
	return fmt.Sprintf("PR-%s", uuid.New().String()[:8])
}

func (s *PaymentRequestService) Create(eid, customerID string, contractID, salesOrderID *string, amount float64, notes string) (*model.PaymentRequest, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	r := &model.PaymentRequest{
		RequestNo:    s.genNo(),
		CustomerID:   customerID,
		ContractID:   contractID,
		SalesOrderID: salesOrderID,
		Amount:       amount,
		Status:       "draft",
		Notes:        notes,
	}
	r.EnterpriseID = id
	if err := s.db.Create(r).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建请款申请失败")
	}
	return r, nil
}

func (s *PaymentRequestService) Update(id string, input map[string]interface{}) (*model.PaymentRequest, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	var r model.PaymentRequest
	if err := s.db.Where("id=?", pid).First(&r).Error; err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	if r.Status != "draft" && r.Status != "rejected" {
		return nil, apperrors.NewValidationError("status", "仅草稿或已驳回状态可编辑")
	}
	if err := s.db.Model(&r).Updates(input).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新请款申请失败")
	}
	s.db.Where("id=?", pid).First(&r)
	return &r, nil
}

func (s *PaymentRequestService) Delete(id string) *apperrors.AppError {
	pid, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}
	var r model.PaymentRequest
	if err := s.db.Where("id=?", pid).First(&r).Error; err != nil {
		return apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	if r.Status != "draft" {
		return apperrors.NewValidationError("status", "仅草稿状态可删除")
	}
	if err := s.db.Delete(&r).Error; err != nil {
		return apperrors.ErrInternal.WithDetail("删除请款申请失败")
	}
	return nil
}

func (s *PaymentRequestService) Get(id string) (*model.PaymentRequest, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	var r model.PaymentRequest
	if err := s.db.Where("id=?", pid).First(&r).Error; err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	return &r, nil
}

func (s *PaymentRequestService) List(eid string, page, pageSize int, status string) ([]model.PaymentRequest, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}
	var items []model.PaymentRequest
	var total int64
	q := s.db.Model(&model.PaymentRequest{}).Where("enterprise_id=?", id)
	if status != "" {
		q = q.Where("status=?", status)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}

func (s *PaymentRequestService) SubmitForApproval(id string) *apperrors.AppError {
	pid, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}
	var r model.PaymentRequest
	if err := s.db.Where("id=?", pid).First(&r).Error; err != nil {
		return apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	if r.Status != "draft" && r.Status != "rejected" {
		return apperrors.NewValidationError("status", "仅草稿或已驳回状态可提交审批")
	}
	r.Status = "pending_approval"
	if err := s.db.Save(&r).Error; err != nil {
		return apperrors.ErrInternal.WithDetail("提交审批失败")
	}
	return nil
}

func (s *PaymentRequestService) Approve(id, approverID string) *apperrors.AppError {
	pid, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}
	var r model.PaymentRequest
	if err := s.db.Where("id=?", pid).First(&r).Error; err != nil {
		return apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	if r.Status != "pending_approval" {
		return apperrors.NewValidationError("status", "仅审批中状态可审批")
	}
	r.Status = "approved"
	r.ApprovedBy = &approverID
	if err := s.db.Save(&r).Error; err != nil {
		return apperrors.ErrInternal.WithDetail("审批失败")
	}
	return nil
}

func (s *PaymentRequestService) Reject(id, approverID, reason string) *apperrors.AppError {
	pid, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}
	var r model.PaymentRequest
	if err := s.db.Where("id=?", pid).First(&r).Error; err != nil {
		return apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	if r.Status != "pending_approval" {
		return apperrors.NewValidationError("status", "仅审批中状态可驳回")
	}
	r.Status = "rejected"
	r.ApprovedBy = &approverID
	r.RejectReason = reason
	if err := s.db.Save(&r).Error; err != nil {
		return apperrors.ErrInternal.WithDetail("驳回失败")
	}
	return nil
}
