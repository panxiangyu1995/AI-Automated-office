package service

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type mockMaterialRepo struct {
	materials map[string]*model.Material
}

func newMockMaterialRepo() *mockMaterialRepo {
	return &mockMaterialRepo{materials: make(map[string]*model.Material)}
}

func (m *mockMaterialRepo) Create(mat *model.Material) error {
	if mat.ID == uuid.Nil {
		mat.ID = uuid.New()
	}
	m.materials[mat.ID.String()] = mat
	return nil
}

func (m *mockMaterialRepo) Update(mat *model.Material) error {
	m.materials[mat.ID.String()] = mat
	return nil
}

func (m *mockMaterialRepo) Delete(id, enterpriseID uuid.UUID) error {
	delete(m.materials, id.String())
	return nil
}

func (m *mockMaterialRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Material, error) {
	mat, ok := m.materials[id.String()]
	if !ok {
		return nil, nil
	}
	return mat, nil
}

func (m *mockMaterialRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Material, int64, error) {
	var result []model.Material
	for _, mat := range m.materials {
		if mat.EnterpriseID == enterpriseID {
			result = append(result, *mat)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockMaterialRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	_, ok := m.materials[id.String()]
	if !ok {
		return 0, nil
	}
	delete(m.materials, id.String())
	return 1, nil
}

func TestMaterialService_Create(t *testing.T) {
	repo := newMockMaterialRepo()
	svc := NewMaterialService(repo)
	eid := uuid.New().String()

	mat, appErr := svc.Create(eid, "螺丝M8", "SKU-001", "raw_material", "M8x20", "个", 0.5)
	assert.Nil(t, appErr)
	assert.NotNil(t, mat)
	assert.Equal(t, "螺丝M8", mat.Name)
	assert.Equal(t, "原材料", mat.MaterialType)
	assert.Equal(t, "active", mat.Status)
}

func TestMaterialService_Create_TypeAlias(t *testing.T) {
	repo := newMockMaterialRepo()
	svc := NewMaterialService(repo)
	eid := uuid.New().String()

	mat, appErr := svc.Create(eid, "笔记本电脑", "SKU-002", "hardware", "", "台", 5000)
	assert.Nil(t, appErr)
	assert.NotNil(t, mat)
	assert.Equal(t, "硬件", mat.MaterialType)
}

func TestMaterialService_Create_InvalidType(t *testing.T) {
	repo := newMockMaterialRepo()
	svc := NewMaterialService(repo)
	eid := uuid.New().String()

	mat, appErr := svc.Create(eid, "测试", "SKU-003", "invalid_type", "", "个", 0)
	assert.Nil(t, mat)
	assert.NotNil(t, appErr)
	assert.Equal(t, 400, appErr.Status)
}

func TestMaterialService_Create_EmptyName(t *testing.T) {
	repo := newMockMaterialRepo()
	svc := NewMaterialService(repo)
	eid := uuid.New().String()

	mat, appErr := svc.Create(eid, "", "SKU-004", "raw_material", "", "个", 0)
	assert.Nil(t, mat)
	assert.NotNil(t, appErr)
}

func TestMaterialService_Create_EmptySKU(t *testing.T) {
	repo := newMockMaterialRepo()
	svc := NewMaterialService(repo)
	eid := uuid.New().String()

	mat, appErr := svc.Create(eid, "测试物料", "", "raw_material", "", "个", 0)
	assert.Nil(t, mat)
	assert.NotNil(t, appErr)
}

func TestMaterialService_Get(t *testing.T) {
	repo := newMockMaterialRepo()
	svc := NewMaterialService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, "查询物料", "SKU-010", "raw_material", "", "个", 10)

	found, appErr := svc.Get(eid, created.ID.String())
	assert.Nil(t, appErr)
	assert.NotNil(t, found)
	assert.Equal(t, "查询物料", found.Name)
}

func TestMaterialService_Get_NotFound(t *testing.T) {
	repo := newMockMaterialRepo()
	svc := NewMaterialService(repo)
	eid := uuid.New().String()

	found, appErr := svc.Get(eid, uuid.New().String())
	assert.Nil(t, found)
	assert.NotNil(t, appErr)
	assert.Equal(t, 404, appErr.Status)
}

func TestMaterialService_Update(t *testing.T) {
	repo := newMockMaterialRepo()
	svc := NewMaterialService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, "原始物料", "SKU-020", "raw_material", "M8", "个", 10)

	updated, appErr := svc.Update(eid, created.ID.String(), "更新物料", "成品", "M10", "箱", 20, "inactive")
	assert.Nil(t, appErr)
	assert.NotNil(t, updated)
	assert.Equal(t, "更新物料", updated.Name)
	assert.Equal(t, "成品", updated.MaterialType)
	assert.Equal(t, "inactive", updated.Status)
}

func TestMaterialService_Delete(t *testing.T) {
	repo := newMockMaterialRepo()
	svc := NewMaterialService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, "删除物料", "SKU-030", "raw_material", "", "个", 0)

	appErr := svc.Delete(eid, created.ID.String())
	assert.Nil(t, appErr)

	found, _ := svc.Get(eid, created.ID.String())
	assert.Nil(t, found)
}

func TestMaterialService_List(t *testing.T) {
	repo := newMockMaterialRepo()
	svc := NewMaterialService(repo)
	eid := uuid.New().String()

	svc.Create(eid, "物料A", "SKU-A", "raw_material", "", "个", 0)
	svc.Create(eid, "物料B", "SKU-B", "成品", "", "个", 0)

	materials, total, appErr := svc.List(eid, 1, 10)
	assert.Nil(t, appErr)
	assert.Equal(t, int64(2), total)
	assert.Len(t, materials, 2)
}
