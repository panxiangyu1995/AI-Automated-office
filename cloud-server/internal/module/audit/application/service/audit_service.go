package service

import (
	"context"

	"cloud-server/internal/model"

	"go.uber.org/zap"
	"gorm.io/datatypes"
)

// AuditService 审计服务（业务层集成）
type AuditService struct {
	logger *AuditLogger
	zap    *zap.Logger
}

// NewAuditService 创建审计服务
func NewAuditService(logger *AuditLogger, zapLogger *zap.Logger) *AuditService {
	return &AuditService{
		logger: logger,
		zap:    zapLogger,
	}
}

// LogLogin 记录登录事件
func (s *AuditService) LogLogin(ctx context.Context, tenantID, operatorID, operatorName, ip, userAgent string, success bool) {
	log := BuildLoginLog(tenantID, operatorID, operatorName, ip, userAgent, success)
	s.logger.Log(log)
}

// LogLogout 记录登出事件
func (s *AuditService) LogLogout(ctx context.Context, tenantID, operatorID, operatorName string) {
	log := BuildLogoutLog(tenantID, operatorID, operatorName)
	s.logger.Log(log)
}

// LogSessionRevoke 记录会话撤销事件
func (s *AuditService) LogSessionRevoke(ctx context.Context, tenantID, operatorID, operatorName, targetSessionID, reason string) {
	log := BuildSessionRevokeLog(tenantID, operatorID, operatorName, targetSessionID, reason)
	s.logger.Log(log)
}

// LogUserCreate 记录用户创建事件
func (s *AuditService) LogUserCreate(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, newValues datatypes.JSON) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetUserID,
		TargetType:   "user",
		EventType:    EventTypeUser,
		Resource:     "user",
		Action:       ActionCreate,
		Result:       "success",
		NewValues:    newValues,
	}
	s.logger.Log(log)
}

// LogUserUpdate 记录用户更新事件
func (s *AuditService) LogUserUpdate(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, oldValues, newValues datatypes.JSON) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetUserID,
		TargetType:   "user",
		EventType:    EventTypeUser,
		Resource:     "user",
		Action:       ActionUpdate,
		Result:       "success",
		OldValues:    oldValues,
		NewValues:    newValues,
	}
	s.logger.Log(log)
}

// LogUserDelete 记录用户删除事件
func (s *AuditService) LogUserDelete(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, oldValues datatypes.JSON) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetUserID,
		TargetType:   "user",
		EventType:    EventTypeUser,
		Resource:     "user",
		Action:       ActionDelete,
		Result:       "success",
		OldValues:    oldValues,
	}
	s.logger.Log(log)
}

// LogRoleCreate 记录角色创建事件
func (s *AuditService) LogRoleCreate(ctx context.Context, tenantID, operatorID, operatorName, targetRoleID string, newValues datatypes.JSON) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetRoleID,
		TargetType:   "role",
		EventType:    EventTypeRole,
		Resource:     "role",
		Action:       ActionCreate,
		Result:       "success",
		NewValues:    newValues,
	}
	s.logger.Log(log)
}

// LogRoleUpdate 记录角色更新事件
func (s *AuditService) LogRoleUpdate(ctx context.Context, tenantID, operatorID, operatorName, targetRoleID string, oldValues, newValues datatypes.JSON) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetRoleID,
		TargetType:   "role",
		EventType:    EventTypeRole,
		Resource:     "role",
		Action:       ActionUpdate,
		Result:       "success",
		OldValues:    oldValues,
		NewValues:    newValues,
	}
	s.logger.Log(log)
}

// LogRoleDelete 记录角色删除事件
func (s *AuditService) LogRoleDelete(ctx context.Context, tenantID, operatorID, operatorName, targetRoleID string, oldValues datatypes.JSON) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetRoleID,
		TargetType:   "role",
		EventType:    EventTypeRole,
		Resource:     "role",
		Action:       ActionDelete,
		Result:       "success",
		OldValues:    oldValues,
	}
	s.logger.Log(log)
}

// LogPermissionGrant 记录权限授予事件
func (s *AuditService) LogPermissionGrant(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, permissions datatypes.JSON) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetUserID,
		TargetType:   "user",
		EventType:    EventTypePerm,
		Resource:     "permission",
		Action:       ActionGrant,
		Result:       "success",
		NewValues:    permissions,
	}
	s.logger.Log(log)
}

// LogPermissionRevoke 记录权限撤销事件
func (s *AuditService) LogPermissionRevoke(ctx context.Context, tenantID, operatorID, operatorName, targetUserID string, permissions datatypes.JSON) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     targetUserID,
		TargetType:   "user",
		EventType:    EventTypePerm,
		Resource:     "permission",
		Action:       ActionRevoke,
		Result:       "success",
		OldValues:    permissions,
	}
	s.logger.Log(log)
}

// LogImport 记录导入事件
func (s *AuditService) LogImport(ctx context.Context, tenantID, operatorID, operatorName, resource, batchID string, totalRows, successRows, failedRows int) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     batchID,
		TargetType:   "import_batch",
		EventType:    EventTypeData,
		Resource:     resource,
		Action:       ActionImport,
		Result:       "success",
		NewValues:    datatypes.JSON([]byte(`{"total":` + string(rune(totalRows)) + `,"success":` + string(rune(successRows)) + `,"failed":` + string(rune(failedRows)) + `}`)),
	}
	s.logger.Log(log)
}

// LogExport 记录导出事件
func (s *AuditService) LogExport(ctx context.Context, tenantID, operatorID, operatorName, resource string, recordCount int) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		EventType:    EventTypeData,
		Resource:     resource,
		Action:       ActionExport,
		Result:       "success",
		NewValues:    datatypes.JSON([]byte(`{"count":` + string(rune(recordCount)) + `}`)),
	}
	s.logger.Log(log)
}

// LogCustom 记录自定义事件
func (s *AuditService) LogCustom(ctx context.Context, log *model.AuditLog) {
	s.logger.Log(log)
}

// LogSync 同步记录事件
func (s *AuditService) LogSync(ctx context.Context, log *model.AuditLog) error {
	return s.logger.LogSync(ctx, log)
}

// ==================== 增强：更多业务操作审计 ====================

// LogDepartmentCreate 记录部门创建事件
func (s *AuditService) LogDepartmentCreate(ctx context.Context, tenantID, operatorID, operatorName, deptID, deptName string) {
	log := BuildDepartmentLog(tenantID, operatorID, operatorName, deptID, deptName, ActionCreate)
	s.logger.Log(log)
}

// LogDepartmentUpdate 记录部门更新事件
func (s *AuditService) LogDepartmentUpdate(ctx context.Context, tenantID, operatorID, operatorName, deptID, deptName string, oldValues, newValues datatypes.JSON) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     deptID,
		TargetType:   "department",
		EventType:    EventTypeTenant,
		Resource:     "department",
		Action:       ActionUpdate,
		Result:       "success",
		OldValues:    oldValues,
		NewValues:    newValues,
	}
	s.logger.Log(log)
}

// LogDepartmentDelete 记录部门删除事件
func (s *AuditService) LogDepartmentDelete(ctx context.Context, tenantID, operatorID, operatorName, deptID string, oldValues datatypes.JSON) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     deptID,
		TargetType:   "department",
		EventType:    EventTypeTenant,
		Resource:     "department",
		Action:       ActionDelete,
		Result:       "success",
		OldValues:    oldValues,
	}
	s.logger.Log(log)
}

// LogApproval 记录审批事件
func (s *AuditService) LogApproval(ctx context.Context, tenantID, operatorID, operatorName, approvalID, approvalTitle, action string) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     approvalID,
		TargetType:   "approval",
		EventType:    EventTypeData,
		Resource:     "approval",
		Action:       action,
		Result:       "success",
		NewValues:    datatypes.JSON([]byte(`{"title":"` + approvalTitle + `"}`)),
	}
	s.logger.Log(log)
}

// LogDocumentAccess 记录文档访问事件
func (s *AuditService) LogDocumentAccess(ctx context.Context, tenantID, operatorID, operatorName, docID, docName string) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     docID,
		TargetType:   "document",
		EventType:    EventTypeData,
		Resource:     "document",
		Action:       ActionRead,
		Result:       "success",
		NewValues:    datatypes.JSON([]byte(`{"name":"` + docName + `"}`)),
	}
	s.logger.Log(log)
}

// LogAPIKeyOperation 记录API密钥操作
func (s *AuditService) LogAPIKeyOperation(ctx context.Context, tenantID, operatorID, operatorName, keyID, operation string) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     keyID,
		TargetType:   "api_key",
		EventType:    EventTypeSecurity,
		Resource:     "api_key",
		Action:       operation,
		Result:       "success",
	}
	s.logger.Log(log)
}

// LogSyncOperation 记录同步操作
func (s *AuditService) LogSyncOperation(ctx context.Context, tenantID, operatorID, operatorName, deviceID string, changesCount int, success bool) {
	result := "success"
	if !success {
		result = "failure"
	}
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		TargetID:     deviceID,
		TargetType:   "device",
		EventType:    EventTypeData,
		Resource:     "sync",
		Action:       "sync",
		Result:       result,
		NewValues:    datatypes.JSON([]byte(`{"changes":` + intToString(changesCount) + `}`)),
	}
	s.logger.Log(log)
}

// LogSecurityEvent 记录安全事件
func (s *AuditService) LogSecurityEvent(ctx context.Context, tenantID, operatorID string, eventName, description string) {
	log := &model.AuditLog{
		TenantID:     tenantID,
		OperatorID:   operatorID,
		EventType:    EventTypeSecurity,
		Resource:     "security",
		Action:       eventName,
		Result:       "alert",
		NewValues:    datatypes.JSON([]byte(`{"description":"` + description + `"}`)),
	}
	s.logger.Log(log)
}

// ==================== 便捷构建方法 ====================

// BuildDepartmentLog 构建部门日志
func BuildDepartmentLog(tenantID, operatorID, operatorName, deptID, deptName, action string) *model.AuditLog {
	return NewAuditLogBuilder().
		Tenant(tenantID).
		Operator(operatorID, operatorName).
		Target(deptID, "department").
		EventType(EventTypeTenant).
		Resource("department").
		Action(action).
		NewValuesString(`{"name":"` + deptName + `"}`).
		ResultSuccess().
		Build()
}

// intToString 辅助函数
func intToString(n int) string {
	if n == 0 {
		return "0"
	}
	result := ""
	for n > 0 {
		result = string(rune('0'+n%10)) + result
		n /= 10
	}
	return result
}
