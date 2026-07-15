package repository

import (
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WorkflowRepository interface {
	CreateDefinition(def *model.WfDefinition) error
	FindDefinitionByID(id, enterpriseID uuid.UUID) (*model.WfDefinition, error)
	ListDefinitions(enterpriseID uuid.UUID, page, pageSize int) ([]model.WfDefinition, int64, error)
	UpdateDefinition(def *model.WfDefinition) error
	DeleteDefinition(id, enterpriseID uuid.UUID) error

	CreateInstance(inst *model.WfInstance) error
	FindInstanceByID(id, enterpriseID uuid.UUID) (*model.WfInstance, error)
	ListPendingInstances(enterpriseID uuid.UUID, approverID string, page, pageSize int) ([]model.WfInstance, int64, error)
	UpdateInstance(inst *model.WfInstance) error
	PluckActiveBusinessTypes(enterpriseID uuid.UUID, userID string) ([]string, error)

	CreateApproval(approval *model.WfApproval) error
	ListApprovalsByInstance(instanceID uuid.UUID) ([]model.WfApproval, error)
}

type workflowRepo struct {
	db *gorm.DB
}

func NewWorkflowRepository(db *gorm.DB) WorkflowRepository {
	return &workflowRepo{db: db}
}

func (r *workflowRepo) CreateDefinition(def *model.WfDefinition) error {
	return r.db.Create(def).Error
}

func (r *workflowRepo) FindDefinitionByID(id, enterpriseID uuid.UUID) (*model.WfDefinition, error) {
	var def model.WfDefinition
	err := r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&def).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &def, nil
}

func (r *workflowRepo) ListDefinitions(enterpriseID uuid.UUID, page, pageSize int) ([]model.WfDefinition, int64, error) {
	var defs []model.WfDefinition
	var total int64
	q := r.db.Where("enterprise_id = ?", enterpriseID)
	q.Model(&model.WfDefinition{}).Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&defs).Error
	return defs, total, err
}

func (r *workflowRepo) UpdateDefinition(def *model.WfDefinition) error {
	return r.db.Model(&model.WfDefinition{}).Where("id = ? AND enterprise_id = ?", def.ID, def.EnterpriseID).Updates(map[string]interface{}{
		"name":         def.Name,
		"description":  def.Description,
		"flow_config":  def.FlowConfig,
		"version":      def.Version,
		"is_active":    def.IsActive,
		"category":     def.Category,
		"updated_at":   gorm.Expr("NOW()"),
	}).Error
}

func (r *workflowRepo) DeleteDefinition(id, enterpriseID uuid.UUID) error {
	return r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.WfDefinition{}).Error
}

func (r *workflowRepo) CreateInstance(inst *model.WfInstance) error {
	return r.db.Create(inst).Error
}

func (r *workflowRepo) FindInstanceByID(id, enterpriseID uuid.UUID) (*model.WfInstance, error) {
	var inst model.WfInstance
	err := r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&inst).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &inst, nil
}

func (r *workflowRepo) ListPendingInstances(enterpriseID uuid.UUID, approverID string, page, pageSize int) ([]model.WfInstance, int64, error) {
	var insts []model.WfInstance
	var total int64
	q := r.db.Where("enterprise_id = ? AND status = ?", enterpriseID, "pending")
	q.Model(&model.WfInstance{}).Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&insts).Error
	return insts, total, err
}

func (r *workflowRepo) UpdateInstance(inst *model.WfInstance) error {
	return r.db.Model(&model.WfInstance{}).Where("id = ? AND enterprise_id = ?", inst.ID, inst.EnterpriseID).Updates(map[string]interface{}{
		"current_step":    inst.CurrentStep,
		"status":          inst.Status,
		"completed_at":    inst.CompletedAt,
		"return_reason":   inst.ReturnReason,
		"returned_by":     inst.ReturnedBy,
		"parallel_status": inst.ParallelStatus,
		"updated_at":      gorm.Expr("NOW()"),
	}).Error
}

func (r *workflowRepo) PluckActiveBusinessTypes(enterpriseID uuid.UUID, userID string) ([]string, error) {
	var types []string
	err := r.db.Model(&model.WfInstance{}).
		Where("enterprise_id = ? AND initiator_id = ? AND status = ?", enterpriseID, userID, "pending").
		Pluck("business_type", &types).Error
	return types, err
}

func (r *workflowRepo) CreateApproval(approval *model.WfApproval) error {
	return r.db.Create(approval).Error
}

func (r *workflowRepo) ListApprovalsByInstance(instanceID uuid.UUID) ([]model.WfApproval, error) {
	var approvals []model.WfApproval
	err := r.db.Where("instance_id = ?", instanceID).Order("step_index ASC").Find(&approvals).Error
	return approvals, err
}
