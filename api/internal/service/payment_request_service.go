package service

import (
	"fmt"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type PaymentRequestService struct {
	repo repository.PaymentRequestRepository
}

func NewPaymentRequestService(repo repository.PaymentRequestRepository) *PaymentRequestService {
	return &PaymentRequestService{repo}
}

func (s *PaymentRequestService) genNo() string {
	return fmt.Sprintf("PR-%s", uuid.New().String()[:8])
}

func (s *PaymentRequestService) Create(eid, category string, amount float64, applicantID *string, description string) (*model.PaymentRequest, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	r := &model.PaymentRequest{
		RequestNo:   s.genNo(),
		Category:    category,
		Amount:      amount,
		Status:      "draft",
		ApplicantID: applicantID,
		Description: description,
	}
	r.EnterpriseID = id
	if err := s.repo.Create(r); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建请款申请失败")
	}
	return r, nil
}

func (s *PaymentRequestService) Update(id, enterpriseID string, input map[string]interface{}) (*model.PaymentRequest, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	r, dbErr := s.repo.FindByID(pid, eid)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询请款申请失败")
	}
	if r == nil {
		return nil, apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	if r.Status != "draft" && r.Status != "rejected" {
		return nil, apperrors.NewValidationError("status", "仅草稿或已驳回状态可编辑")
	}
	result, dbErr := s.repo.UpdateFields(pid, eid, input)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新请款申请失败")
	}
	return result, nil
}

func (s *PaymentRequestService) Delete(id, enterpriseID string) *apperrors.AppError {
	pid, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "无效")
	}
	r, dbErr := s.repo.FindByID(pid, eid)
	if dbErr != nil {
		return apperrors.ErrInternal.WithDetail("查询请款申请失败")
	}
	if r == nil {
		return apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	if r.Status != "draft" {
		return apperrors.NewValidationError("status", "仅草稿状态可删除")
	}
	if err := s.repo.Delete(r, r.EnterpriseID); err != nil {
		return apperrors.ErrInternal.WithDetail("删除请款申请失败")
	}
	return nil
}

func (s *PaymentRequestService) Get(id, enterpriseID string) (*model.PaymentRequest, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	r, dbErr := s.repo.FindByID(pid, eid)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询请款申请失败")
	}
	if r == nil {
		return nil, apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	return r, nil
}

func (s *PaymentRequestService) List(eid string, page, pageSize int, status string) ([]model.PaymentRequest, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}
	items, total, dbErr := s.repo.List(id, status, page, pageSize)
	if dbErr != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}

func (s *PaymentRequestService) SubmitForApproval(id, enterpriseID string) *apperrors.AppError {
	pid, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "无效")
	}
	r, dbErr := s.repo.FindByID(pid, eid)
	if dbErr != nil {
		return apperrors.ErrInternal.WithDetail("查询请款申请失败")
	}
	if r == nil {
		return apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	if r.Status != "draft" && r.Status != "rejected" {
		return apperrors.NewValidationError("status", "仅草稿或已驳回状态可提交审批")
	}
	r.Status = "pending_approval"
	if err := s.repo.Save(r); err != nil {
		return apperrors.ErrInternal.WithDetail("提交审批失败")
	}
	return nil
}

func (s *PaymentRequestService) Approve(id, enterpriseID, approverID string) *apperrors.AppError {
	pid, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "无效")
	}
	r, dbErr := s.repo.FindByID(pid, eid)
	if dbErr != nil {
		return apperrors.ErrInternal.WithDetail("查询请款申请失败")
	}
	if r == nil {
		return apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	if r.Status != "pending_approval" {
		return apperrors.NewValidationError("status", "仅审批中状态可审批")
	}
	r.Status = "approved"
	r.ApprovedBy = &approverID
	if err := s.repo.Save(r); err != nil {
		return apperrors.ErrInternal.WithDetail("审批失败")
	}
	return nil
}

func (s *PaymentRequestService) Reject(id, enterpriseID, approverID, reason string) *apperrors.AppError {
	pid, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "无效")
	}
	r, dbErr := s.repo.FindByID(pid, eid)
	if dbErr != nil {
		return apperrors.ErrInternal.WithDetail("查询请款申请失败")
	}
	if r == nil {
		return apperrors.ErrNotFound.WithDetail("请款申请不存在")
	}
	if r.Status != "pending_approval" {
		return apperrors.NewValidationError("status", "仅审批中状态可驳回")
	}
	r.Status = "rejected"
	r.ApprovedBy = &approverID
	r.RejectReason = reason
	if err := s.repo.Save(r); err != nil {
		return apperrors.ErrInternal.WithDetail("驳回失败")
	}
	return nil
}
