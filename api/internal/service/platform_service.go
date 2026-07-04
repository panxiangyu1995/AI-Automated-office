package service

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type PlatformService struct{ db *gorm.DB }
func NewPlatformService(db *gorm.DB) *PlatformService { return &PlatformService{db} }

func (s *PlatformService) CreateServiceTicket(eid, customerID, subject, desc, priority string) (*model.ServiceTicket, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	t := &model.ServiceTicket{CustomerID: customerID, Subject: subject, Description: desc, Priority: priority, Status: "open"}
	t.EnterpriseID = id
	if err := s.db.Create(t).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建工单失败") }
	return t, nil
}

func (s *PlatformService) ListServiceTickets(eid string) ([]model.ServiceTicket, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var tickets []model.ServiceTicket
	if err := s.db.Where("enterprise_id=?", id).Order("created_at DESC").Find(&tickets).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询工单失败")
	}
	return tickets, nil
}

func (s *PlatformService) CreateAnnouncement(eid, title, content string) (*model.Announcement, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	a := &model.Announcement{Title: title, Content: content}
	a.EnterpriseID = id
	if err := s.db.Create(a).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建公告失败") }
	return a, nil
}

func (s *PlatformService) ListAnnouncements(eid string) ([]model.Announcement, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var anns []model.Announcement
	if err := s.db.Where("enterprise_id=?", id).Order("created_at DESC").Find(&anns).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询公告失败")
	}
	return anns, nil
}

func (s *PlatformService) GetReport(eid, reportType string) (map[string]interface{}, *apperrors.AppError) {
	return map[string]interface{}{
		"enterprise_count": 0, "employee_count": 0,
		"total_revenue": 0, "active_users": 0,
		"report_type": reportType,
	}, nil
}
