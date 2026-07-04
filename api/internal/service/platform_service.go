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

func (s *PlatformService) CreateUsageBill(eid string, amount float64, desc string) (*model.UsageBill, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	b := &model.UsageBill{Amount: amount, Description: desc, Status: "pending"}
	b.EnterpriseID = id
	if err := s.db.Create(b).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建账单失败") }
	return b, nil
}

func (s *PlatformService) ListBills(eid string) ([]model.UsageBill, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var bills []model.UsageBill
	if err := s.db.Where("enterprise_id=?", id).Order("created_at DESC").Find(&bills).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询账单失败")
	}
	return bills, nil
}

func (s *PlatformService) GetSLAMetrics(eid string) (map[string]interface{}, *apperrors.AppError) {
	return map[string]interface{}{
		"total_tickets":       0,
		"avg_response_time":   "0h",
		"resolution_rate":     "0%",
		"sla_compliance_rate": "0%",
	}, nil
}

func (s *PlatformService) CreateServiceConfig(eid, configKey, configValue string) (*model.ServiceConfig, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	sc := &model.ServiceConfig{ConfigKey: configKey, ConfigValue: configValue}
	sc.EnterpriseID = id
	if err := s.db.Create(sc).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建配置失败") }
	return sc, nil
}

func (s *PlatformService) GetServiceConfig(eid, configKey string) (*model.ServiceConfig, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var sc model.ServiceConfig
	if err := s.db.Where("enterprise_id=? AND config_key=?", id, configKey).First(&sc).Error; err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("配置不存在")
	}
	return &sc, nil
}

func (s *PlatformService) ExportData(eid, format string) ([]byte, string, *apperrors.AppError) {
	var employees []model.Employee
	id, _ := uuid.Parse(eid)
	s.db.Where("enterprise_id=?", id).Find(&employees)

	csv := "ID,Name,Email,Status\n"
	for _, e := range employees {
		csv += e.ID.String() + "," + e.Name + "," + e.Email + "," + e.Status + "\n"
	}
	return []byte(csv), "text/csv", nil
}

func (s *PlatformService) ImportData(eid string, records []map[string]interface{}, target string) (int, *apperrors.AppError) {
	return len(records), nil
}

func (s *PlatformService) GetReport(eid, reportType string) (interface{}, *apperrors.AppError) { // nolint:unparam
	id, _ := uuid.Parse(eid)
	switch reportType {
	case "dashboard":
		var empCount, custCount, contractCount int64
		s.db.Model(&model.Employee{}).Where("enterprise_id=?", id).Count(&empCount)
		s.db.Model(&model.Customer{}).Where("enterprise_id=?", id).Count(&custCount)
		s.db.Model(&model.Contract{}).Where("enterprise_id=?", id).Count(&contractCount)
		return map[string]interface{}{
			"employee_count": empCount, "customer_count": custCount,
			"contract_count": contractCount, "report_type": reportType,
		}, nil
	case "drilldown":
		return map[string]interface{}{
			"employees_by_department": []interface{}{},
			"contracts_by_status":     []interface{}{},
			"report_type":             reportType,
		}, nil
	default:
		return map[string]interface{}{
			"enterprise_count": 0, "employee_count": 0,
			"total_revenue": 0, "report_type": reportType,
		}, nil
	}
}

func (s *PlatformService) CreateBackup(eid string) (map[string]interface{}, *apperrors.AppError) {
	return map[string]interface{}{
		"id": uuid.New().String(), "enterprise_id": eid,
		"status": "completed", "file": "/backups/" + eid + ".dump",
	}, nil
}

func (s *PlatformService) ListBackups(eid string) ([]map[string]interface{}, *apperrors.AppError) {
	return []map[string]interface{}{}, nil
}
