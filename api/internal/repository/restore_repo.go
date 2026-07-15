package repository

import (
	"github.com/google/uuid"
)

type RestoreRepository interface {
	UndeleteByTableAndID(tableName string, enterpriseID, id uuid.UUID) (int64, error)
}
