package service

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type FileService struct {
	repo      repository.FileMetadataRepository
	storageDir string
}

func NewFileService(repo repository.FileMetadataRepository, storageDir string) *FileService {
	if storageDir == "" {
		storageDir = "/storage"
	}
	return &FileService{repo: repo, storageDir: storageDir}
}

func (s *FileService) Upload(enterpriseID, originalName, mimeType, uploadedBy, refType, refID string, fileSize int64, data io.Reader) (*model.FileMetadata, *apperrors.AppError) {
	entID, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	ext := filepath.Ext(originalName)
	safeName := sanitizeFileName(filepath.Base(originalName))
	storageKey := fmt.Sprintf("%s/%s/%s%s", enterpriseID, uuid.New().String()[:8], safeName, ext)

	uploadDir := filepath.Join(s.storageDir, enterpriseID)
	os.MkdirAll(uploadDir, 0755)
	storagePath := filepath.Join(s.storageDir, storageKey)

	out, err := os.Create(storagePath)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建存储文件失败")
	}
	defer out.Close()

	hasher := sha256.New()
	mw := io.MultiWriter(out, hasher)
	if _, err := io.Copy(mw, data); err != nil {
		os.Remove(storagePath)
		return nil, apperrors.ErrInternal.WithDetail("写入文件失败")
	}

	checksum := fmt.Sprintf("%x", hasher.Sum(nil))

	fm := &model.FileMetadata{
		OriginalName: originalName,
		StorageKey:   storageKey,
		FileSize:     fileSize,
		MimeType:     mimeType,
		StorageType:  "local",
		StoragePath:  storagePath,
		Checksum:     checksum,
		UploadedBy:   uploadedBy,
		RefType:      refType,
		RefID:        refID,
	}
	fm.EnterpriseID = entID

	if err := s.repo.Create(fm); err != nil {
		os.Remove(storagePath)
		return nil, apperrors.ErrInternal.WithDetail("保存文件元数据失败")
	}

	return fm, nil
}

func (s *FileService) GetByStorageKey(key string) (*model.FileMetadata, *apperrors.AppError) {
	fm, err := s.repo.FindByStorageKey(key)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询文件失败")
	}
	if fm == nil {
		return nil, apperrors.ErrNotFound.WithDetail("文件不存在")
	}
	return fm, nil
}

func (s *FileService) PreviewURL(key string) (string, *apperrors.AppError) {
	fm, appErr := s.GetByStorageKey(key)
	if appErr != nil {
		return "", appErr
	}
	return fmt.Sprintf("/api/v1/files/%s/preview", fm.StorageKey), nil
}

func (s *FileService) DownloadURL(key string) (string, *apperrors.AppError) {
	fm, appErr := s.GetByStorageKey(key)
	if appErr != nil {
		return "", appErr
	}
	return fmt.Sprintf("/api/v1/files/%s/download", fm.StorageKey), nil
}

func (s *FileService) ViewURL(key string) (string, *apperrors.AppError) {
	fm, appErr := s.GetByStorageKey(key)
	if appErr != nil {
		return "", appErr
	}
	return fmt.Sprintf("/api/v1/files/%s/view", fm.StorageKey), nil
}

func sanitizeFileName(name string) string {
	name = strings.ReplaceAll(name, "..", "")
	name = strings.ReplaceAll(name, "/", "")
	name = strings.ReplaceAll(name, "\\", "")
	return name
}
