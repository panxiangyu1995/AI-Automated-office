package repository

import (
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type MaterialPriceRepository interface {
	Upsert(p *model.MaterialPrice) error
	ListByMaterial(matID string) ([]model.MaterialPrice, error)
}
