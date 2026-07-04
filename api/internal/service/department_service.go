package service

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type DepartmentService struct {
	deptRepo repository.DepartmentRepository
}

func NewDepartmentService(deptRepo repository.DepartmentRepository) *DepartmentService {
	return &DepartmentService{deptRepo: deptRepo}
}

func (s *DepartmentService) Create(enterpriseID, name, parentID string) (*model.Department, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	if name == "" {
		return nil, apperrors.NewValidationError("name", "部门名称不能为空")
	}

	dept := &model.Department{Name: name}
	dept.EnterpriseID = eid

	if parentID != "" {
		pid, err := uuid.Parse(parentID)
		if err != nil {
			return nil, apperrors.NewValidationError("parent_id", "父部门ID无效")
		}
		parent, err := s.deptRepo.FindByID(pid)
		if err != nil {
			return nil, apperrors.ErrInternal.WithDetail("查询父部门失败")
		}
		if parent == nil {
			return nil, apperrors.ErrNotFound.WithDetail("父部门不存在")
		}
		dept.ParentID = &pid
	}

	if err := s.deptRepo.Create(dept); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建部门失败: " + err.Error())
	}
	return dept, nil
}

func (s *DepartmentService) SetManager(departmentID, employeeID string) (*model.Department, *apperrors.AppError) {
	did, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, apperrors.NewValidationError("department_id", "部门ID无效")
	}

	dept, err := s.deptRepo.FindByID(did)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询部门失败")
	}
	if dept == nil {
		return nil, apperrors.ErrNotFound.WithDetail("部门不存在")
	}

	if employeeID == "" {
		dept.ManagerID = nil
	} else {
		eid, err := uuid.Parse(employeeID)
		if err != nil {
			return nil, apperrors.NewValidationError("employee_id", "员工ID无效")
		}
		dept.ManagerID = &eid
	}

	if err := s.deptRepo.Update(dept); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("设置部门经理失败: " + err.Error())
	}
	return dept, nil
}

func (s *DepartmentService) Update(departmentID, name string, managerID string) (*model.Department, *apperrors.AppError) {
	did, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, apperrors.NewValidationError("department_id", "部门ID无效")
	}

	dept, err := s.deptRepo.FindByID(did)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询部门失败")
	}
	if dept == nil {
		return nil, apperrors.ErrNotFound.WithDetail("部门不存在")
	}

	if name != "" {
		dept.Name = name
	}
	if managerID != "" {
		mid, err := uuid.Parse(managerID)
		if err != nil {
			return nil, apperrors.NewValidationError("manager_id", "负责人ID无效")
		}
		dept.ManagerID = &mid
	}

	if err := s.deptRepo.Update(dept); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新部门失败: " + err.Error())
	}
	return dept, nil
}

func (s *DepartmentService) Delete(departmentID string) *apperrors.AppError {
	did, err := uuid.Parse(departmentID)
	if err != nil {
		return apperrors.NewValidationError("department_id", "部门ID无效")
	}

	dept, err := s.deptRepo.FindByID(did)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询部门失败")
	}
	if dept == nil {
		return apperrors.ErrNotFound.WithDetail("部门不存在")
	}

	childCount, err := s.deptRepo.CountByParent(did)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询子部门失败")
	}
	if childCount > 0 {
		return apperrors.ErrBadRequest.WithDetail("该部门下存在子部门，无法删除")
	}

	if err := s.deptRepo.Delete(did); err != nil {
		return apperrors.ErrInternal.WithDetail("删除部门失败: " + err.Error())
	}
	return nil
}

func (s *DepartmentService) GetTree(enterpriseID string) (*model.DepartmentTreeNode, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	departments, err := s.deptRepo.ListByEnterprise(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询部门列表失败: " + err.Error())
	}

	tree := buildTree(departments)
	return tree, nil
}

func buildTree(departments []model.Department) *model.DepartmentTreeNode {
	nodeMap := make(map[uuid.UUID]*model.DepartmentTreeNode)
	for i := range departments {
		nodeMap[departments[i].ID] = &model.DepartmentTreeNode{
			Department: departments[i],
			Children:   []*model.DepartmentTreeNode{},
		}
	}

	root := &model.DepartmentTreeNode{
		Department: model.Department{},
		Children:   []*model.DepartmentTreeNode{},
	}

	for _, dept := range departments {
		node := nodeMap[dept.ID]
		if dept.ParentID != nil {
			if parent, ok := nodeMap[*dept.ParentID]; ok {
				parent.Children = append(parent.Children, node)
			} else {
				root.Children = append(root.Children, node)
			}
		} else {
			root.Children = append(root.Children, node)
		}
	}

	return root
}
