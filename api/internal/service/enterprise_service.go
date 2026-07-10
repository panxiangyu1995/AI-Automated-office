package service

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/tenant"
)

type EnterpriseService struct {
	enterpriseRepo repository.EnterpriseRepository
	db             *gorm.DB
}

func NewEnterpriseService(enterpriseRepo repository.EnterpriseRepository, db *gorm.DB) *EnterpriseService {
	return &EnterpriseService{
		enterpriseRepo: enterpriseRepo,
		db:             db,
	}
}

func (s *EnterpriseService) Create(groupID, name, code, contactEmail, contactPhone, address string) (*model.Enterprise, *apperrors.AppError) {
	if name == "" {
		return nil, apperrors.NewValidationError("name", "企业名称不能为空")
	}
	if code == "" {
		return nil, apperrors.NewValidationError("code", "企业编码不能为空")
	}
	if groupID == "" {
		return nil, apperrors.NewValidationError("group_id", "所属集团不能为空")
	}

	existing, _ := s.enterpriseRepo.FindByCode(code)
	if existing != nil {
		return nil, apperrors.ErrDuplicateEntry.WithDetail("企业编码已存在")
	}

	enterprise := &model.Enterprise{
		GroupID:      groupID,
		Name:         name,
		Code:         code,
		ContactEmail: contactEmail,
		ContactPhone: contactPhone,
		Address:      address,
		Status:       "active",
	}

	if err := s.enterpriseRepo.Create(enterprise); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建企业失败: " + err.Error())
	}

	schemaName := tenant.SchemaName(enterprise.ID.String())
	enterprise.SchemaName = schemaName
	s.enterpriseRepo.Update(enterprise)

	if s.db != nil {
		if err := tenant.CreateSchema(s.db, enterprise.ID.String()); err != nil {
			return nil, apperrors.ErrInternal.WithDetail(fmt.Sprintf("创建企业Schema失败: %v", err))
		}
		if err := tenant.RunMigrations(s.db, enterprise.ID.String()); err != nil {
			return nil, apperrors.ErrInternal.WithDetail(fmt.Sprintf("运行数据库迁移失败: %v", err))
		}
	}

	return enterprise, nil
}

func (s *EnterpriseService) Update(enterpriseID, name, contactEmail, contactPhone, address string) (*model.Enterprise, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	enterprise, err := s.enterpriseRepo.FindByID(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询企业失败")
	}
	if enterprise == nil {
		return nil, apperrors.ErrNotFound.WithDetail("企业不存在")
	}

	if name != "" {
		enterprise.Name = name
	}
	if contactEmail != "" {
		enterprise.ContactEmail = contactEmail
	}
	if contactPhone != "" {
		enterprise.ContactPhone = contactPhone
	}
	if address != "" {
		enterprise.Address = address
	}

	if err := s.enterpriseRepo.Update(enterprise); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新企业失败: " + err.Error())
	}
	return enterprise, nil
}

func (s *EnterpriseService) Get(enterpriseID string) (*model.Enterprise, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	enterprise, err := s.enterpriseRepo.FindByID(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询企业失败")
	}
	if enterprise == nil {
		return nil, apperrors.ErrNotFound.WithDetail("企业不存在")
	}
	return enterprise, nil
}

func (s *EnterpriseService) List(page, pageSize int) ([]model.Enterprise, int64, *apperrors.AppError) {
	enterprises, total, err := s.enterpriseRepo.List(page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询企业列表失败: " + err.Error())
	}
	return enterprises, total, nil
}
