package service

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type BackupService struct {
	configRepo  repository.BackupConfigRepository
	recordRepo  repository.BackupRecordRepository
	dbHost      string
	dbPort      string
	dbUser      string
	dbPassword  string
	dbName      string
	defaultDir  string
}

func NewBackupService(
	configRepo repository.BackupConfigRepository,
	recordRepo repository.BackupRecordRepository,
	dbHost, dbPort, dbUser, dbPassword, dbName, defaultDir string,
) *BackupService {
	return &BackupService{
		configRepo: configRepo,
		recordRepo: recordRepo,
		dbHost:     dbHost,
		dbPort:     dbPort,
		dbUser:     dbUser,
		dbPassword: dbPassword,
		dbName:     dbName,
		defaultDir: defaultDir,
	}
}

func (s *BackupService) CreateConfig(enterpriseID, backupTime, backupDirectory string, retentionDays int, enabled bool) (*model.BackupConfig, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	if backupTime == "" {
		return nil, apperrors.NewValidationError("backup_time", "备份时间不能为空")
	}
	if !isValidBackupTime(backupTime) {
		return nil, apperrors.NewValidationError("backup_time", "备份时间格式应为 HH:MM (00:00-23:59)")
	}
	if retentionDays < 1 {
		retentionDays = 30
	}
	dir := backupDirectory
	if dir == "" {
		dir = s.defaultDir
	}

	config := &model.BackupConfig{
		BackupTime:      backupTime,
		BackupDirectory: dir,
		RetentionDays:   retentionDays,
		Enabled:         enabled,
	}
	config.EnterpriseID = eid

	if err := s.configRepo.Create(config); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建备份配置失败: " + err.Error())
	}
	return config, nil
}

func (s *BackupService) UpdateConfig(configID, enterpriseID, backupTime, backupDirectory string, retentionDays int, enabled bool) (*model.BackupConfig, *apperrors.AppError) {
	cid, err := uuid.Parse(configID)
	if err != nil {
		return nil, apperrors.NewValidationError("config_id", "配置ID无效")
	}

	config, err := s.configRepo.FindByID(cid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询备份配置失败")
	}
	if config == nil {
		return nil, apperrors.ErrNotFound.WithDetail("备份配置不存在")
	}

	if backupTime != "" {
			if !isValidBackupTime(backupTime) {
				return nil, apperrors.NewValidationError("backup_time", "备份时间格式应为 HH:MM (00:00-23:59)")
			}
			config.BackupTime = backupTime
		}
	if backupDirectory != "" {
		config.BackupDirectory = backupDirectory
	}
	if retentionDays > 0 {
		config.RetentionDays = retentionDays
	}
	config.Enabled = enabled

	config.EnterpriseID = uuid.MustParse(enterpriseID)

	if err := s.configRepo.Update(config); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新备份配置失败: " + err.Error())
	}
	return config, nil
}

func (s *BackupService) DeleteConfig(configID, enterpriseID string) *apperrors.AppError {
	cid, err := uuid.Parse(configID)
	if err != nil {
		return apperrors.NewValidationError("config_id", "配置ID无效")
	}

	config, err := s.configRepo.FindByID(cid)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询备份配置失败")
	}
	if config == nil {
		return apperrors.ErrNotFound.WithDetail("备份配置不存在")
	}

	if err := s.configRepo.Delete(cid); err != nil {
		return apperrors.ErrInternal.WithDetail("删除备份配置失败: " + err.Error())
	}
	return nil
}

func (s *BackupService) GetConfig(configID string) (*model.BackupConfig, *apperrors.AppError) {
	cid, err := uuid.Parse(configID)
	if err != nil {
		return nil, apperrors.NewValidationError("config_id", "配置ID无效")
	}

	config, err := s.configRepo.FindByID(cid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询备份配置失败")
	}
	if config == nil {
		return nil, apperrors.ErrNotFound.WithDetail("备份配置不存在")
	}
	return config, nil
}

func (s *BackupService) ListConfigs(enterpriseID string) ([]model.BackupConfig, *apperrors.AppError) {
	configs, err := s.configRepo.ListByEnterprise(enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询备份配置列表失败: " + err.Error())
	}
	return configs, nil
}

func (s *BackupService) ListRecords(enterpriseID string, page, pageSize int) ([]model.BackupRecord, int64, *apperrors.AppError) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	records, total, err := s.recordRepo.ListByEnterprise(enterpriseID, offset, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询备份记录失败: " + err.Error())
	}
	return records, total, nil
}

func (s *BackupService) TriggerBackup(enterpriseID string) (*model.BackupRecord, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	record := &model.BackupRecord{
		Status: "running",
	}
	record.EnterpriseID = eid

	if err := s.recordRepo.Create(record); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建备份记录失败: " + err.Error())
	}

	now := time.Now()
	record.StartedAt = &now

	schemaName := fmt.Sprintf("tenant_%s", enterpriseID)
	filename := fmt.Sprintf("backup_%s_%s.dump", enterpriseID, now.Format("20060102_150405"))
	filePath := filepath.Join(s.defaultDir, filename)

	cmd := exec.Command("pg_dump",
		"--host="+s.dbHost,
		"--port="+s.dbPort,
		"--username="+s.dbUser,
		"--dbname="+s.dbName,
		"--schema="+schemaName,
		"--format=custom",
		"--file="+filePath,
	)
	cmd.Env = append(os.Environ(), "PGPASSWORD="+s.dbPassword)

	output, err := cmd.CombinedOutput()
	completed := time.Now()
	record.CompletedAt = &completed

	if err != nil {
		record.Status = "failed"
		record.ErrorMessage = fmt.Sprintf("pg_dump failed: %v, output: %s", err, string(output))
		s.recordRepo.Update(record)
		return nil, apperrors.ErrInternal.WithDetail("备份执行失败: " + record.ErrorMessage)
	}

	fileInfo, err := os.Stat(filePath)
	if err == nil {
		record.FileSize = fileInfo.Size()
	}
	record.FilePath = filePath
	record.Status = "success"
	if err := s.recordRepo.Update(record); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新备份记录失败: " + err.Error())
	}

	return record, nil
}

func (s *BackupService) Restore(recordID string) *apperrors.AppError {
	rid, err := uuid.Parse(recordID)
	if err != nil {
		return apperrors.NewValidationError("record_id", "记录ID无效")
	}

	record, err := s.recordRepo.FindByID(rid)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询备份记录失败")
	}
	if record == nil {
		return apperrors.ErrNotFound.WithDetail("备份记录不存在")
	}
	if record.Status != "success" || record.FilePath == "" {
		return apperrors.ErrBadRequest.WithDetail("该备份记录无法恢复，状态: " + record.Status)
	}

	schemaName := fmt.Sprintf("tenant_%s", record.EnterpriseID.String())

	cmd := exec.Command("pg_restore",
		"--host="+s.dbHost,
		"--port="+s.dbPort,
		"--username="+s.dbUser,
		"--dbname="+s.dbName,
		"--schema="+schemaName,
		"--clean",
		record.FilePath,
	)
	cmd.Env = append(os.Environ(), "PGPASSWORD="+s.dbPassword)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return apperrors.ErrInternal.WithDetail(fmt.Sprintf("恢复失败: %v, output: %s", err, string(output)))
	}

	return nil
}

func (s *BackupService) CheckAndRunScheduled() {
	configs, err := s.configRepo.ListEnabled()
	if err != nil {
		return
	}

	now := time.Now()
	currentTime := fmt.Sprintf("%02d:%02d", now.Hour(), now.Minute())

	for _, config := range configs {
		if config.BackupTime == currentTime {
			enterpriseID := config.EnterpriseID.String()
			s.TriggerBackup(enterpriseID)
		}
	}
}

func isValidBackupTime(t string) bool {
	if len(t) != 5 || t[2] != ':' {
		return false
	}
	if t[0] < '0' || t[0] > '2' || t[1] < '0' || t[1] > '9' || t[3] < '0' || t[3] > '5' || t[4] < '0' || t[4] > '9' {
		return false
	}
	if t[0] == '2' && t[1] > '3' {
		return false
	}
	return true
}
