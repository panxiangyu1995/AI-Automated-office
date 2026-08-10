package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type KnowledgeHandler struct {
	svc            *service.KnowledgeService
	versionSvc     *service.KnowledgeVersionService
}
func NewKnowledgeHandler(svc *service.KnowledgeService, versionSvc *service.KnowledgeVersionService) *KnowledgeHandler {
	return &KnowledgeHandler{svc: svc, versionSvc: versionSvc}
}

// svcFor returns a KnowledgeService bound to the request's tenant database.
func (h *KnowledgeHandler) svcFor(c *gin.Context) *service.KnowledgeService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewKnowledgeService(repository.NewKnowledgeRepository(db))
	}
	return h.svc
}

func (h *KnowledgeHandler) UploadFile(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	file, header, err := c.Request.FormFile("file")
	if err != nil { response.ValidationError(c, "file", "请选择文件"); return }
	defer file.Close()
	r, appErr := h.svcFor(c).CreateFile(eid, header.Filename, "/storage/"+header.Filename, header.Header.Get("Content-Type"), c.PostForm("category"), c.PostForm("ref_id"), c.PostForm("ref_type"), header.Size)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, r)
}

func (h *KnowledgeHandler) ListFiles(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).ListFiles(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *KnowledgeHandler) SendMessage(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct {
		SenderID   string `json:"sender_id"`
		ReceiverID string `json:"receiver_id"`
		Title      string `json:"title"`
		Content    string `json:"content"`
		MsgType    string `json:"msg_type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	m, appErr := h.svcFor(c).SendMessage(eid, req.SenderID, req.ReceiverID, req.Title, req.Content, req.MsgType)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, m)
}

func (h *KnowledgeHandler) ListMessages(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).ListMessages(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *KnowledgeHandler) CreateDoc(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct {
		Title      string `json:"title"`
		CategoryID string `json:"category_id"`
		Content    string `json:"content"`
		Summary    string `json:"summary"`
		Tags       string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	d, appErr := h.svcFor(c).CreateDoc(eid, req.Title, req.CategoryID, req.Content, req.Summary, req.Tags)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, d)
}

func (h *KnowledgeHandler) ListDocs(c *gin.Context) { h.listEntity(c, "knowledge_docs") }
func (h *KnowledgeHandler) CreateCategory(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct {
		Name     string `json:"name"`
		ParentID string `json:"parent_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	cat, appErr := h.svcFor(c).CreateCategory(eid, req.Name, req.ParentID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, cat)
}

func (h *KnowledgeHandler) ListCategories(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	cats, appErr := h.svcFor(c).ListCategories(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, cats)
}

func (h *KnowledgeHandler) SemanticSearch(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	query := c.Query("q"); if query == "" { response.ValidationError(c, "q", "搜索关键词不能为空"); return }
	mode := c.DefaultQuery("mode", "semantic")
	results, appErr := h.svcFor(c).SemanticSearch(eid, query, mode, 10)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, results)
}

func (h *KnowledgeHandler) ChunkDocument(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	docID := c.Param("id"); if docID == "" { response.ValidationError(c, "id", "文档ID不能为空"); return }
	chunks, appErr := h.svcFor(c).ChunkDocument(eid, docID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, chunks)
}

func (h *KnowledgeHandler) GetChunks(c *gin.Context) {
	docID := c.Param("id"); if docID == "" { response.ValidationError(c, "id", "文档ID不能为空"); return }
	chunks, appErr := h.svcFor(c).GetChunks(docID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, chunks)
}

func (h *KnowledgeHandler) ListVersions(c *gin.Context) {
	docID := c.Param("id"); if docID == "" { response.ValidationError(c, "id", "文档ID不能为空"); return }
	versions, err := h.versionSvc.ListVersions(docID)
	if err != nil { response.Error(c, &errors.AppError{Code: "KB_VERSION_ERROR", Message: err.Error(), Status: 500}); return }
	response.Success(c, versions)
}

func (h *KnowledgeHandler) GetVersion(c *gin.Context) {
	docID := c.Param("id"); if docID == "" { response.ValidationError(c, "id", "文档ID不能为空"); return }
	version, err := strconv.Atoi(c.Param("version"))
	if err != nil { response.ValidationError(c, "version", "版本号无效"); return }
	doc, err := h.versionSvc.GetVersion(docID, version)
	if err != nil { response.Error(c, &errors.AppError{Code: "KB_VERSION_ERROR", Message: err.Error(), Status: 500}); return }
	response.Success(c, doc)
}

func (h *KnowledgeHandler) CompareVersions(c *gin.Context) {
	docID := c.Param("id"); if docID == "" { response.ValidationError(c, "id", "文档ID不能为空"); return }
	v1, err1 := strconv.Atoi(c.Query("v1"))
	v2, err2 := strconv.Atoi(c.Query("v2"))
	if err1 != nil || err2 != nil { response.ValidationError(c, "v1/v2", "版本号无效"); return }
	result, err := h.versionSvc.CompareVersions(docID, v1, v2)
	if err != nil { response.Error(c, &errors.AppError{Code: "KB_VERSION_ERROR", Message: err.Error(), Status: 500}); return }
	response.Success(c, result)
}

func (h *KnowledgeHandler) listEntity(c *gin.Context, _ string) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svcFor(c).ListDocs(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
