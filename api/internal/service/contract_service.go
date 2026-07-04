package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type ContractService struct {
	db *gorm.DB
}

func NewContractService(db *gorm.DB) *ContractService { return &ContractService{db} }

var contractTransitions = map[string][]string{
	"draft": {"pending_approval"}, "pending_approval": {"active", "draft"},
	"active": {"fulfilled", "terminated"}, "fulfilled": {}, "terminated": {},
}

func validContractTransition(from, to string) bool {
	next, ok := contractTransitions[from]
	if !ok { return false }
	for _, s := range next { if s == to { return true } }
	return false
}

func (s *ContractService) Create(eid, customerID, name, content, notes string, amount float64) (*model.Contract, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	if name == "" { return nil, apperrors.NewValidationError("name", "合同名称不能为空") }
	c := &model.Contract{
		ContractNo: fmt.Sprintf("CT-%s", uuid.New().String()[:8]),
		CustomerID: customerID, Name: name, Amount: amount, Status: "draft", Content: content, Notes: notes,
	}
	c.EnterpriseID = id
	if err := s.db.Create(c).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建合同失败: "+err.Error()) }
	return c, nil
}

func (s *ContractService) Update(cID, name, content, notes string, amount float64) (*model.Contract, *apperrors.AppError) {
	id, err := uuid.Parse(cID)
	if err != nil { return nil, apperrors.NewValidationError("contract_id", "无效") }
	var c model.Contract
	if err := s.db.Where("id=?", id).First(&c).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("合同不存在") }
	if c.Status != "draft" { return nil, apperrors.ErrBadRequest.WithDetail("仅草稿状态可编辑") }
	if name != "" { c.Name = name }; if content != "" { c.Content = content }
	if notes != "" { c.Notes = notes }; if amount > 0 { c.Amount = amount }
	if err := s.db.Save(&c).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("更新合同失败: "+err.Error()) }
	return &c, nil
}

func (s *ContractService) Delete(cID string) *apperrors.AppError {
	id, err := uuid.Parse(cID)
	if err != nil { return apperrors.NewValidationError("contract_id", "无效") }
	var c model.Contract
	if err := s.db.Where("id=?", id).First(&c).Error; err != nil { return apperrors.ErrNotFound.WithDetail("合同不存在") }
	if c.Status != "draft" { return apperrors.ErrBadRequest.WithDetail("仅草稿状态可删除") }
	if err := s.db.Delete(&c).Error; err != nil { return apperrors.ErrInternal.WithDetail("删除合同失败: "+err.Error()) }
	return nil
}

func (s *ContractService) ChangeStatus(cID, newStatus string) (*model.Contract, *apperrors.AppError) {
	id, err := uuid.Parse(cID)
	if err != nil { return nil, apperrors.NewValidationError("contract_id", "无效") }
	var c model.Contract
	if err := s.db.Where("id=?", id).First(&c).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("合同不存在") }
	if !validContractTransition(c.Status, newStatus) {
		return nil, &apperrors.AppError{
			Code: "CON_INVALID_STATUS_TRANSITION", Message: "非法状态流转",
			Detail: fmt.Sprintf("不能从 %s 转换到 %s", model.ContractStatusLabels[c.Status], model.ContractStatusLabels[newStatus]),
			Status: 400,
		}
	}
	c.Status = newStatus
	if newStatus == "active" { now := time.Now(); c.EffectiveAt = &now }
	if newStatus == "fulfilled" || newStatus == "terminated" { now := time.Now(); c.ExpireAt = &now }
	if err := s.db.Save(&c).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("更新状态失败: "+err.Error()) }
	return &c, nil
}

func (s *ContractService) Get(cID string) (*model.Contract, *apperrors.AppError) {
	id, err := uuid.Parse(cID)
	if err != nil { return nil, apperrors.NewValidationError("contract_id", "无效") }
	var c model.Contract
	if err := s.db.Where("id=?", id).First(&c).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("合同不存在") }
	return &c, nil
}

func (s *ContractService) List(eid string, p, ps int, status string) ([]model.Contract, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	var cs []model.Contract; var total int64
	q := s.db.Model(&model.Contract{}).Where("enterprise_id=?", id)
	if status != "" { q = q.Where("status=?", status) }
	if err := q.Count(&total).Error; err != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询合同列表失败: "+err.Error()) }
	if p < 1 { p = 1 }
	if ps < 1 || ps > 100 { ps = 20 }
	if err := q.Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&cs).Error; err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询合同列表失败: "+err.Error())
	}
	return cs, total, nil
}
