package definitions

import (
	"github.com/ai-office/cli/internal/skill"
)

func initKnowledgeSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "kb_doc_create",
		Description: "创建知识库文档",
		Category:    "knowledge",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/kb/docs",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "title", Type: "string", Required: true, Description: "文档标题"},
			{Name: "category_id", Type: "string", Required: false, Description: "分类ID"},
			{Name: "content", Type: "string", Required: true, Description: "文档内容"},
			{Name: "summary", Type: "string", Required: false, Description: "文档摘要"},
			{Name: "tags", Type: "string", Required: false, Description: "标签（逗号分隔）"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "kb_doc_list",
		Description: "查询知识库文档列表",
		Category:    "knowledge",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/kb/docs",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "kb_doc_chunk",
		Description: "文档分块处理",
		Category:    "knowledge",
		APIEndpoint: "/api/v1/kb/docs/{id}/chunk",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "文档ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "kb_doc_chunks",
		Description: "查询文档分块列表",
		Category:    "knowledge",
		APIEndpoint: "/api/v1/kb/docs/{id}/chunks",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "文档ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "kb_semantic_search",
		Description: "语义搜索知识库",
		Category:    "knowledge",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/kb/semantic-search",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "q", Type: "string", Required: true, Description: "搜索查询"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "kb_category_create",
		Description: "创建知识库分类",
		Category:    "knowledge",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/kb/categories",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "分类名称"},
			{Name: "parent_id", Type: "string", Required: false, Description: "父分类ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "kb_category_list",
		Description: "查询知识库分类列表",
		Category:    "knowledge",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/kb/categories",
		Method:      "GET",
		Parameters: []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "kb_file_upload",
		Description: "上传文件到知识库",
		Category:    "knowledge",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/files",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "file", Type: "file", Required: true, Description: "上传文件"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "kb_file_list",
		Description: "查询知识库文件列表",
		Category:    "knowledge",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/files",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})
}
