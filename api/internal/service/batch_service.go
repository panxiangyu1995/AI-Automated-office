package service

import (
	"github.com/google/uuid"
)

type BatchTargetDeleter interface {
	DeleteByID(id, enterpriseID uuid.UUID) (int64, error)
}

type BatchStatusChanger interface {
	UpdateStatus(id, enterpriseID uuid.UUID, status string) error
}

type BatchService struct {
	workflowSvc *WorkflowService
	deleteRepos map[string]BatchTargetDeleter
	statusRepos map[string]BatchStatusChanger
}

func NewBatchService(
	workflowSvc *WorkflowService,
	deleteRepos map[string]BatchTargetDeleter,
	statusRepos map[string]BatchStatusChanger,
) *BatchService {
	return &BatchService{
		workflowSvc: workflowSvc,
		deleteRepos: deleteRepos,
		statusRepos: statusRepos,
	}
}

func (s *BatchService) BatchApprove(instanceIDs []uuid.UUID, enterpriseID uuid.UUID, approverID string) ([]uuid.UUID, []string) {
	var succeeded []uuid.UUID
	var failed []string

	if s.workflowSvc == nil {
		return nil, []string{"审批服务未初始化"}
	}

	for _, id := range instanceIDs {
		_, appErr := s.workflowSvc.Approve(id, enterpriseID, approverID, "批量审批", "")
		if appErr != nil {
			failed = append(failed, id.String()+": "+appErr.Message)
		} else {
			succeeded = append(succeeded, id)
		}
	}
	return succeeded, failed
}

func (s *BatchService) BatchDelete(resourceType string, ids []uuid.UUID, enterpriseID uuid.UUID) ([]uuid.UUID, []string) {
	var succeeded []uuid.UUID
	var failed []string

	repo, exists := s.deleteRepos[resourceType]
	if !exists {
		return nil, []string{"不支持的资源类型: " + resourceType}
	}

	for _, id := range ids {
		rowsAffected, err := repo.DeleteByID(id, enterpriseID)
		if err != nil || rowsAffected == 0 {
			failed = append(failed, id.String()+": 删除失败或资源不存在")
		} else {
			succeeded = append(succeeded, id)
		}
	}
	return succeeded, failed
}

func (s *BatchService) BatchStatusChange(resourceType string, ids []uuid.UUID, enterpriseID uuid.UUID, newStatus string) ([]uuid.UUID, []string) {
	var succeeded []uuid.UUID
	var failed []string

	repo, exists := s.statusRepos[resourceType]
	if !exists {
		return nil, []string{"不支持的资源类型: " + resourceType}
	}

	for _, id := range ids {
		err := repo.UpdateStatus(id, enterpriseID, newStatus)
		if err != nil {
			failed = append(failed, id.String()+": 状态更新失败或资源不存在")
		} else {
			succeeded = append(succeeded, id)
		}
	}
	return succeeded, failed
}
