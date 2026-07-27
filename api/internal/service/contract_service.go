package service

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type ContractService struct {
	repo repository.ContractRepository
}

func NewContractService(repo repository.ContractRepository) *ContractService { return &ContractService{repo} }

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
	if err := s.repo.Create(c); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建合同失败: "+err.Error()) }
	return c, nil
}

func (s *ContractService) PatchFields(eid, cID string, fields map[string]interface{}) (*model.Contract, *apperrors.AppError) {
	id, err := uuid.Parse(cID)
	if err != nil { return nil, apperrors.NewValidationError("contract_id", "无效") }
	entID, _ := uuid.Parse(eid)
	c, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询合同失败") }
	if c == nil { return nil, apperrors.ErrNotFound.WithDetail("合同不存在") }
	if c.Status != "draft" && c.Status != "pending_approval" {
		return nil, apperrors.ErrBadRequest.WithDetail("仅草稿和审批中的合同可修改")
	}

	updates := map[string]interface{}{}
	if v, ok := fields["name"]; ok { updates["name"] = v }
	if v, ok := fields["amount"]; ok { updates["amount"] = v }
	if v, ok := fields["content"]; ok { updates["content"] = v }
	if v, ok := fields["notes"]; ok { updates["notes"] = v }
	if len(updates) == 0 { return nil, apperrors.NewValidationError("fields", "没有可更新的字段") }

	result, dbErr := s.repo.PatchFields(id, c.EnterpriseID, updates)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("更新合同字段失败: "+dbErr.Error()) }
	return result, nil
}

func (s *ContractService) Update(eid, cID, name, content, notes string, amount float64) (*model.Contract, *apperrors.AppError) {
	id, err := uuid.Parse(cID)
	if err != nil { return nil, apperrors.NewValidationError("contract_id", "无效") }
	entID, _ := uuid.Parse(eid)
	c, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询合同失败") }
	if c == nil { return nil, apperrors.ErrNotFound.WithDetail("合同不存在") }
	if c.Status != "draft" { return nil, apperrors.ErrBadRequest.WithDetail("仅草稿状态可编辑") }
	if name != "" { c.Name = name }; if content != "" { c.Content = content }
	if notes != "" { c.Notes = notes }; if amount > 0 { c.Amount = amount }
	if err := s.repo.Update(c); err != nil { return nil, apperrors.ErrInternal.WithDetail("更新合同失败: "+err.Error()) }
	return c, nil
}

func (s *ContractService) Delete(eid, cID string) *apperrors.AppError {
	id, err := uuid.Parse(cID)
	if err != nil { return apperrors.NewValidationError("contract_id", "无效") }
	entID, _ := uuid.Parse(eid)
	c, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return apperrors.ErrInternal.WithDetail("查询合同失败") }
	if c == nil { return apperrors.ErrNotFound.WithDetail("合同不存在") }
	if c.Status != "draft" { return apperrors.ErrBadRequest.WithDetail("仅草稿状态可删除") }
	if err := s.repo.Delete(c, c.EnterpriseID); err != nil { return apperrors.ErrInternal.WithDetail("删除合同失败: "+err.Error()) }
	return nil
}

func (s *ContractService) ChangeStatus(eid, cID, newStatus string) (*model.Contract, *apperrors.AppError) {
	id, err := uuid.Parse(cID)
	if err != nil { return nil, apperrors.NewValidationError("contract_id", "无效") }
	entID, _ := uuid.Parse(eid)
	c, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询合同失败") }
	if c == nil { return nil, apperrors.ErrNotFound.WithDetail("合同不存在") }
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
	if err := s.repo.Update(c); err != nil { return nil, apperrors.ErrInternal.WithDetail("更新状态失败: "+err.Error()) }
	return c, nil
}

func (s *ContractService) SubmitApproval(eid, cID string) (*model.Contract, *apperrors.AppError) {
	return s.ChangeStatus(eid, cID, "pending_approval")
}

func (s *ContractService) Approve(eid, cID string) (*model.Contract, *apperrors.AppError) {
	return s.ChangeStatus(eid, cID, "active")
}

func (s *ContractService) SaveAttachment(eid, cID, fileName, contentType string, fileSize int64, data io.Reader) (*model.ContractAttachment, *apperrors.AppError) {
	id, err := uuid.Parse(cID)
	if err != nil { return nil, apperrors.NewValidationError("contract_id", "无效") }
	entID, _ := uuid.Parse(eid)
	c, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询合同失败") }
	if c == nil { return nil, apperrors.ErrNotFound.WithDetail("合同不存在") }

	uploadDir := filepath.Join("storage", eid, "contracts", cID, "attachments")
	os.MkdirAll(uploadDir, 0755)
	filePath := filepath.Join(uploadDir, fileName)
	out, err := os.Create(filePath)
	if err != nil { return nil, apperrors.ErrInternal.WithDetail("保存文件失败") }
	defer out.Close()
	io.Copy(out, data)

	att := &model.ContractAttachment{
		ContractID: cID, FileName: fileName,
		FileType: contentType, FileSize: fileSize, FileURL: filePath,
	}
	if err := s.repo.CreateAttachment(att); err != nil { return nil, apperrors.ErrInternal.WithDetail("保存附件记录失败") }
	return att, nil
}

func (s *ContractService) LinkDocument(eid, cID, refType, refID, refNo string) (*model.ContractReference, *apperrors.AppError) {
	id, err := uuid.Parse(cID)
	if err != nil { return nil, apperrors.NewValidationError("contract_id", "无效") }
	entID, _ := uuid.Parse(eid)
	c, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询合同失败") }
	if c == nil { return nil, apperrors.ErrNotFound.WithDetail("合同不存在") }
	if refType == "" { return nil, apperrors.NewValidationError("ref_type", "关联类型不能为空") }
	if refID == "" { return nil, apperrors.NewValidationError("ref_id", "关联ID不能为空") }

	cr := &model.ContractReference{ContractID: cID, RefType: refType, RefID: refID, RefNo: refNo}
	if err := s.repo.CreateReference(cr); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("关联单据失败: "+err.Error())
	}
	return cr, nil
}

func (s *ContractService) ListDocuments(cID string) ([]model.ContractReference, *apperrors.AppError) {
	id, err := uuid.Parse(cID)
	if err != nil { return nil, apperrors.NewValidationError("contract_id", "无效") }
	refs, dbErr := s.repo.ListReferences(id)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询关联单据失败: "+dbErr.Error()) }
	return refs, nil
}

func (s *ContractService) Get(eid, cID string) (*model.Contract, *apperrors.AppError) {
	id, err := uuid.Parse(cID)
	if err != nil { return nil, apperrors.NewValidationError("contract_id", "无效") }
	entID, _ := uuid.Parse(eid)
	c, dbErr := s.repo.FindByID(id, entID)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询合同失败") }
	if c == nil { return nil, apperrors.ErrNotFound.WithDetail("合同不存在") }
	return c, nil
}

func (s *ContractService) List(eid string, p, ps int, status string) ([]model.Contract, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	cs, total, dbErr := s.repo.List(id, status, p, ps)
	if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询合同列表失败: "+dbErr.Error()) }
	return cs, total, nil
}
