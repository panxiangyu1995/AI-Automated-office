package service

import (
	"context"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type DebugLogService struct {
	repo *repository.DebugLogRepo
}

func NewDebugLogService(repo *repository.DebugLogRepo) *DebugLogService {
	return &DebugLogService{repo: repo}
}

func (s *DebugLogService) QueryLogs(ctx context.Context, filter repository.LogFilter) ([]repository.LogEntry, int64, *apperrors.AppError) {
	entries, total, err := s.repo.Query(ctx, filter)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail(err.Error())
	}
	return entries, total, nil
}

func (s *DebugLogService) SeedLogs(ctx context.Context, entries []repository.LogEntry) *apperrors.AppError {
	if err := s.repo.Seed(ctx, entries); err != nil {
		return apperrors.ErrInternal.WithDetail(err.Error())
	}
	return nil
}
