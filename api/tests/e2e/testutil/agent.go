package e2etestutil

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	inttestutil "github.com/ai-office/api/tests/integration/testutil"
)

type E2EClient struct {
	t            *testing.T
	router       *gin.Engine
	token        string
	enterpriseID string
	db           *gorm.DB
}

func NewE2EClient(t *testing.T, router *gin.Engine, db *gorm.DB) *E2EClient {
	t.Helper()
	return &E2EClient{t: t, router: router, db: db}
}

func (c *E2EClient) SetToken(token string)  { c.token = token }
func (c *E2EClient) SetEnterprise(id string) { c.enterpriseID = id }

func (c *E2EClient) doRequest(method, path string, body interface{}) *httptest.ResponseRecorder {
	c.t.Helper()
	if c.db != nil {
		c.db.Exec("SET search_path TO public")
	}
	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			c.t.Fatalf("failed to marshal request body: %v", err)
		}
		bodyReader = bytes.NewReader(b)
	}

	req := httptest.NewRequest(method, path, bodyReader)
	req.Header.Set("Content-Type", "application/json")

	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	if c.enterpriseID != "" {
		req.Header.Set("X-Enterprise-ID", c.enterpriseID)
	}

	w := httptest.NewRecorder()
	c.router.ServeHTTP(w, req)
	return w
}

func (c *E2EClient) GET(path string) *httptest.ResponseRecorder {
	return c.doRequest(http.MethodGet, path, nil)
}

func (c *E2EClient) POST(path string, body interface{}) *httptest.ResponseRecorder {
	return c.doRequest(http.MethodPost, path, body)
}

func (c *E2EClient) PUT(path string, body interface{}) *httptest.ResponseRecorder {
	return c.doRequest(http.MethodPut, path, body)
}

func (c *E2EClient) PATCH(path string, body interface{}) *httptest.ResponseRecorder {
	return c.doRequest(http.MethodPatch, path, body)
}

func (c *E2EClient) DELETE(path string) *httptest.ResponseRecorder {
	return c.doRequest(http.MethodDelete, path, nil)
}

type AgentSimulator struct {
	t      *testing.T
	client *E2EClient
	role   string
	fx     *inttestutil.TestFixtures
}

func NewAgentSimulator(t *testing.T, client *E2EClient, role string, fx *inttestutil.TestFixtures) *AgentSimulator {
	t.Helper()
	return &AgentSimulator{t: t, client: client, role: role, fx: fx}
}

func (a *AgentSimulator) LoginAsOperator() {
	a.t.Helper()
	a.client.SetToken(a.fx.OperatorToken(a.t))
	a.client.SetEnterprise(a.fx.EnterpriseID)
}

func (a *AgentSimulator) LoginAsOwner() {
	a.t.Helper()
	a.client.SetToken(a.fx.OwnerToken(a.t))
	a.client.SetEnterprise(a.fx.EnterpriseID)
}

func (a *AgentSimulator) LoginAsAdmin() {
	a.t.Helper()
	a.client.SetToken(a.fx.AdminToken(a.t))
	a.client.SetEnterprise(a.fx.EnterpriseID)
}

func (a *AgentSimulator) LoginAsManager() {
	a.t.Helper()
	a.client.SetToken(a.fx.ManagerToken(a.t))
	a.client.SetEnterprise(a.fx.EnterpriseID)
}

func (a *AgentSimulator) LoginAsEmployee() {
	a.t.Helper()
	a.client.SetToken(a.fx.EmployeeToken(a.t))
	a.client.SetEnterprise(a.fx.EnterpriseID)
}

func (a *AgentSimulator) CallSkill(skillName string, params map[string]interface{}) *httptest.ResponseRecorder {
	a.t.Helper()
	endpoint := skillToEndpoint(skillName, a.fx.EnterpriseID)
	if endpoint == "" {
		a.t.Fatalf("unknown skill: %s", skillName)
	}
	if params != nil {
		return a.client.POST(endpoint, params)
	}
	return a.client.GET(endpoint)
}

func (a *AgentSimulator) PollMessages() *httptest.ResponseRecorder {
	a.t.Helper()
	return a.client.GET("/api/v1/enterprises/" + a.fx.EnterpriseID + "/messages")
}

func (a *AgentSimulator) SwitchEnterprise(enterpriseID string) *httptest.ResponseRecorder {
	a.t.Helper()
	return a.client.POST("/api/v1/auth/switch-enterprise", map[string]string{
		"enterprise_id": enterpriseID,
	})
}

func skillToEndpoint(skillName, enterpriseID string) string {
	skillEndpoints := map[string]string{
		"hrm_employee_list":    "/api/v1/enterprises/" + enterpriseID + "/employees",
		"hrm_department_tree":  "/api/v1/enterprises/" + enterpriseID + "/departments/tree",
		"crm_customer_list":    "/api/v1/enterprises/" + enterpriseID + "/customers",
		"ims_material_list":   "/api/v1/enterprises/" + enterpriseID + "/materials",
		"ims_inventory_list":  "/api/v1/enterprises/" + enterpriseID + "/inventory",
		"contract_list":       "/api/v1/contracts",
		"finance_payment_list": "/api/v1/enterprises/" + enterpriseID + "/payments",
		"finance_expense_list": "/api/v1/enterprises/" + enterpriseID + "/expenses",
		"finance_invoice_list": "/api/v1/enterprises/" + enterpriseID + "/invoices",
		"kb_doc_list":         "/api/v1/enterprises/" + enterpriseID + "/kb/docs",
		"skill_list":          "/api/v1/skills",
		"dashboard":           "/api/v1/dashboard",
		"message_list":        "/api/v1/enterprises/" + enterpriseID + "/messages",
		"audit_log_list":      "/api/v1/audit-logs",
		"report_sales":        "/api/v1/reports/sales",
		"report_finance":      "/api/v1/reports/finance",
		"service_order_list":   "/api/v1/enterprises/" + enterpriseID + "/service-orders",
		"sales_order_list":     "/api/v1/enterprises/" + enterpriseID + "/sales-orders",
	}
	return skillEndpoints[skillName]
}
