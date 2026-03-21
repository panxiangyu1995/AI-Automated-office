package service

import (
	"context"

	"cloud-server/internal/module/admin/application/dto"
	"cloud-server/internal/module/admin/domain/entity"
	"cloud-server/internal/module/admin/domain/repository"

	"github.com/google/uuid"
)

// ConflictResolver 冲突解决器
type ConflictResolver struct {
	userRepo       repository.UserRepository
	departmentRepo repository.DepartmentRepository
	positionRepo   repository.PositionRepository
}

// NewConflictResolver 创建冲突解决器
func NewConflictResolver(
	userRepo repository.UserRepository,
	departmentRepo repository.DepartmentRepository,
	positionRepo repository.PositionRepository,
) *ConflictResolver {
	return &ConflictResolver{
		userRepo:       userRepo,
		departmentRepo: departmentRepo,
		positionRepo:   positionRepo,
	}
}

// ResolveRow 解决单行冲突
// policy: skip - 跳过, update - 更新已有记录, create - 创建新记录（带后缀）
// 返回: resolvedData 为 nil 表示跳过该行
func (r *ConflictResolver) ResolveRow(
	ctx context.Context,
	tenantID uuid.UUID,
	row *entity.ImportRowData,
	conflict *ConflictResult,
	policy dto.ConflictPolicy,
) (*entity.ImportRowData, *dto.ImportReceiptItem) {
	receiptItem := &dto.ImportReceiptItem{
		RowNumber:    0, // 调用者设置
		Username:     row.Username,
		Name:         row.Name,
		EmployeeCode: row.EmployeeCode,
	}

	if conflict == nil || !conflict.HasConflict {
		// 无冲突，直接返回原数据
		return row, nil
	}

	switch policy {
	case dto.ConflictPolicySkip:
		// 跳过该行
		receiptItem.Status = "skipped"
		receiptItem.Message = conflict.ConflictDesc
		return nil, receiptItem

	case dto.ConflictPolicyUpdate:
		// 更新已有记录 - 需要找到现有用户ID
		resolvedData := r.prepareUpdateData(ctx, tenantID, row, conflict)
		if resolvedData != nil {
			receiptItem.Status = "update"
			receiptItem.Message = "将更新已有用户"
		} else {
			receiptItem.Status = "failed"
			receiptItem.Message = "无法找到要更新的用户"
		}
		return resolvedData, receiptItem

	case dto.ConflictPolicyCreate:
		// 创建新记录，添加后缀避免冲突
		resolvedData := r.prepareCreateData(ctx, tenantID, row, conflict)
		receiptItem.Status = "create"
		receiptItem.Message = "创建新用户（已添加后缀避免冲突）"
		receiptItem.Username = resolvedData.Username
		return resolvedData, receiptItem

	default:
		// 默认跳过
		receiptItem.Status = "skipped"
		receiptItem.Message = conflict.ConflictDesc
		return nil, receiptItem
	}
}

// prepareUpdateData 准备更新数据
func (r *ConflictResolver) prepareUpdateData(
	ctx context.Context,
	tenantID uuid.UUID,
	row *entity.ImportRowData,
	conflict *ConflictResult,
) *entity.ImportRowData {
	// 根据冲突类型查找现有用户
	var existingUserID string

	switch conflict.ConflictType {
	case entity.ConflictDuplicateUsername:
		// 通过用户名找到用户
		user, err := r.userRepo.FindByUsername(ctx, tenantID.String(), row.Username)
		if err != nil || user == nil {
			return nil
		}
		existingUserID = user.ID

	case entity.ConflictDuplicateEmployeeCode:
		// 通过工号找到用户
		user, err := r.userRepo.FindByEmployeeCode(ctx, tenantID.String(), row.EmployeeCode)
		if err != nil || user == nil {
			return nil
		}
		existingUserID = user.ID

	default:
		// 其他冲突类型不支持更新
		return nil
	}

	// 返回带有现有用户ID的数据（用于更新）
	resolvedData := *row
	resolvedData.Username = existingUserID // 临时存储用户ID
	return &resolvedData
}

// prepareCreateData 准备创建数据（添加后缀避免冲突）
func (r *ConflictResolver) prepareCreateData(
	ctx context.Context,
	tenantID uuid.UUID,
	row *entity.ImportRowData,
	conflict *ConflictResult,
) *entity.ImportRowData {
	resolvedData := *row

	switch conflict.ConflictType {
	case entity.ConflictDuplicateUsername:
		// 为用户名添加后缀
		suffix := "_1"
		for i := 2; i <= 100; i++ {
			exists, _ := r.userRepo.ExistsByUsername(ctx, tenantID.String(), resolvedData.Username+suffix)
			if !exists {
				break
			}
			suffix = "_" + string(rune('0'+i))
		}
		resolvedData.Username = row.Username + suffix

	case entity.ConflictDuplicateEmployeeCode:
		// 为工号添加后缀
		suffix := "_1"
		for i := 2; i <= 100; i++ {
			exists, _ := r.userRepo.ExistsByEmployeeCode(ctx, tenantID.String(), resolvedData.EmployeeCode+suffix)
			if !exists {
				break
			}
			suffix = "_" + string(rune('0'+i))
		}
		resolvedData.EmployeeCode = row.EmployeeCode + suffix
	}

	return &resolvedData
}

// BatchResolve 批量解决冲突
func (r *ConflictResolver) BatchResolve(
	ctx context.Context,
	tenantID uuid.UUID,
	rows []*entity.ImportRowData,
	conflicts map[int]*ConflictResult,
	defaultPolicy dto.ConflictPolicy,
	rowPolicies map[int]dto.ConflictPolicy,
) ([]*entity.ImportRowData, []*dto.ImportReceiptItem) {
	resolvedRows := make([]*entity.ImportRowData, 0, len(rows))
	receiptItems := make([]*dto.ImportReceiptItem, 0, len(rows))

	for i, row := range rows {
		conflict := conflicts[i]
		policy := defaultPolicy
		if p, ok := rowPolicies[i+1]; ok { // rowPolicies key 是 1-indexed 行号
			policy = p
		}

		resolvedData, receiptItem := r.ResolveRow(ctx, tenantID, row, conflict, policy)
		if receiptItem != nil {
			receiptItem.RowNumber = i + 1
			receiptItems = append(receiptItems, receiptItem)
		}
		if resolvedData != nil {
			resolvedRows = append(resolvedRows, resolvedData)
		}
	}

	return resolvedRows, receiptItems
}
