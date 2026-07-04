package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type KnowledgeHandler struct{ svc *service.KnowledgeService }
func NewKnowledgeHandler(svc *service.KnowledgeService) *KnowledgeHandler { return &KnowledgeHandler{svc} }

func (h *KnowledgeHandler) UploadFile(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	file, header, err := c.Request.FormFile("file")
	if err != nil { response.ValidationError(c, "file", "请选择文件"); return }
	defer file.Close()
	r, appErr := h.svc.CreateFile(eid, header.Filename, "/storage/"+header.Filename, header.Header.Get("Content-Type"), c.PostForm("category"), c.PostForm("ref_id"), c.PostForm("ref_type"), header.Size)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, r)
}

func (h *KnowledgeHandler) ListFiles(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.ListFiles(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *KnowledgeHandler) SendMessage(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ SenderID, ReceiverID, Title, Content, MsgType string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	m, appErr := h.svc.SendMessage(eid, req.SenderID, req.ReceiverID, req.Title, req.Content, req.MsgType)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, m)
}

func (h *KnowledgeHandler) ListMessages(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.ListMessages(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *KnowledgeHandler) CreateDoc(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Title, CategoryID, Content, Summary, Tags string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	d, appErr := h.svc.CreateDoc(eid, req.Title, req.CategoryID, req.Content, req.Summary, req.Tags)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, d)
}

func (h *KnowledgeHandler) ListDocs(c *gin.Context) { h.listEntity(c, "knowledge_docs") }
func (h *KnowledgeHandler) CreateCategory(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Name, ParentID string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	cat, appErr := h.svc.CreateCategory(eid, req.Name, req.ParentID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, cat)
}

func (h *KnowledgeHandler) ListCategories(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	cats, appErr := h.svc.ListCategories(eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, cats)
}

func (h *KnowledgeHandler) SemanticSearch(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	query := c.Query("q"); if query == "" { response.ValidationError(c, "q", "搜索关键词不能为空"); return }
	results, appErr := h.svc.SemanticSearch(eid, query, 10)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, results)
}

func (h *KnowledgeHandler) ChunkDocument(c *gin.Context) {
	docID := c.Param("id"); if docID == "" { response.ValidationError(c, "id", "文档ID不能为空"); return }
	chunks, appErr := h.svc.ChunkDocument(docID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, chunks)
}

func (h *KnowledgeHandler) GetChunks(c *gin.Context) {
	docID := c.Param("id"); if docID == "" { response.ValidationError(c, "id", "文档ID不能为空"); return }
	chunks, appErr := h.svc.GetChunks(docID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, chunks)
}

func (h *KnowledgeHandler) listEntity(c *gin.Context, _ string) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	items, total, appErr := h.svc.ListDocs(eid, p, ps)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
